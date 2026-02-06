// admin.js - Admin Panel Functionality

// ===== AUTHENTICATION =====
// Simple hash function for password (not cryptographically secure, but prevents casual access)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Password configuration - CHANGE THIS TO YOUR DESIRED PASSWORD
const ADMIN_PASSWORD = 'puppies123'; // Change this to a secure password!
const PASSWORD_HASH = simpleHash(ADMIN_PASSWORD);

// Check if user is authenticated
function isAuthenticated() {
  return sessionStorage.getItem('adminAuth') === PASSWORD_HASH;
}

// Login handler
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const password = document.getElementById('adminPassword').value;
  const enteredHash = simpleHash(password);
  
  if (enteredHash === PASSWORD_HASH) {
    // Store auth in sessionStorage (clears when browser closes)
    sessionStorage.setItem('adminAuth', PASSWORD_HASH);
    document.getElementById('loginPage').classList.remove('show');
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('loginError').classList.remove('show');
  } else {
    // Show error message
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = 'Incorrect password. Please try again.';
    errorEl.classList.add('show');
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
  }
});

// Logout handler
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    sessionStorage.removeItem('adminAuth');
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('loginPage').classList.add('show');
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
  }
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
  if (isAuthenticated()) {
    document.getElementById('loginPage').classList.remove('show');
    document.getElementById('adminPanel').style.display = 'block';
  } else {
    document.getElementById('loginPage').classList.add('show');
    document.getElementById('adminPanel').style.display = 'none';
  }
});

// ===== PUPPY MANAGEMENT =====

function getPuppiesFromStorage() {
  const stored = localStorage.getItem('puppiesCatalog');
  if (stored) {
    return JSON.parse(stored);
  }
  // If nothing stored, save the current puppies array
  localStorage.setItem('puppiesCatalog', JSON.stringify(puppies));
  return puppies;
}

// Save puppies to localStorage
function savePuppiestoStorage(puppiesList) {
  localStorage.setItem('puppiesCatalog', JSON.stringify(puppiesList));
}

// Show alert message
function showAlert(message, type = 'success') {
  const alertEl = document.getElementById('alert');
  alertEl.textContent = message;
  alertEl.className = `alert show alert-${type}`;
  setTimeout(() => {
    alertEl.classList.remove('show');
  }, 3000);
}

// Switch tabs
function switchTab(tabName) {
  // Hide all tabs
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));
  
  // Deactivate all buttons
  const btns = document.querySelectorAll('.tab-btn');
  btns.forEach(btn => btn.classList.remove('active'));
  
  // Show selected tab
  document.getElementById(tabName).classList.add('active');
  
  // Activate selected button
  event.target.classList.add('active');
  
  // Refresh table if showing manage dogs
  if (tabName === 'manage-dogs') {
    loadDogsTable();
  }
}

// Render dogs table
function loadDogsTable() {
  const puppiesList = getPuppiesFromStorage();
  const tbody = document.getElementById('dogsTableBody');
  tbody.innerHTML = '';
  
  puppiesList.forEach(pup => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><img src="${pup.img}" alt="${pup.name}" class="dog-img" onerror="this.src='images/placeholder.png'"></td>
      <td>${pup.name}</td>
      <td>${pup.color}</td>
      <td>${pup.gender}</td>
      <td>$${pup.price}</td>
      <td>
        <span class="badge ${pup.sold ? 'badge-sold' : 'badge-available'}">
          ${pup.sold ? 'SOLD' : 'AVAILABLE'}
        </span>
      </td>
      <td>
        <button class="btn btn-secondary" onclick="editDog('${pup.id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteDog('${pup.id}')">Delete</button>
        ${pup.sold ? `<button class="btn btn-success" onclick="toggleSoldStatus('${pup.id}', false)">Mark Available</button>` : `<button class="btn btn-primary" onclick="toggleSoldStatus('${pup.id}', true)">Mark Sold</button>`}
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Toggle sold status quickly from the table
function toggleSoldStatus(dogId, makeSold) {
  const puppiesList = getPuppiesFromStorage();
  const idx = puppiesList.findIndex(p => p.id === dogId);
  if (idx === -1) {
    showAlert('Puppy not found', 'error');
    return;
  }
  puppiesList[idx].sold = !!makeSold;
  // If marking sold and no review exists, set a default empty review
  if (makeSold && !puppiesList[idx].review) puppiesList[idx].review = '';
  savePuppiestoStorage(puppiesList);
  showAlert(`${puppiesList[idx].name} status updated`, 'success');
  loadDogsTable();
}

// Edit dog - open modal
function editDog(dogId) {
  const puppiesList = getPuppiesFromStorage();
  const pup = puppiesList.find(p => p.id === dogId);
  
  if (!pup) {
    showAlert('Puppy not found', 'error');
    return;
  }
  
  // Populate modal with dog data
  document.getElementById('editDogId').value = pup.id;
  document.getElementById('editDogName').value = pup.name;
  document.getElementById('editDogColor').value = pup.color;
  document.getElementById('editDogGender').value = pup.gender;
  document.getElementById('editDogPrice').value = pup.price;
  document.getElementById('editDogReview').value = pup.review || '';
  document.getElementById('editDogSold').value = pup.sold;
  
  // Show modal
  document.getElementById('editModal').classList.add('show');
}

// Close edit modal
function closeEditModal() {
  document.getElementById('editModal').classList.remove('show');
}

// Save edited dog
document.getElementById('editDogForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const puppiesList = getPuppiesFromStorage();
  const dogId = document.getElementById('editDogId').value;
  const pupIndex = puppiesList.findIndex(p => p.id === dogId);
  
  if (pupIndex === -1) {
    showAlert('Puppy not found', 'error');
    return;
  }
  
  // Update puppy data
  puppiesList[pupIndex].name = document.getElementById('editDogName').value;
  puppiesList[pupIndex].color = document.getElementById('editDogColor').value;
  puppiesList[pupIndex].gender = document.getElementById('editDogGender').value;
  puppiesList[pupIndex].price = parseFloat(document.getElementById('editDogPrice').value);
  puppiesList[pupIndex].review = document.getElementById('editDogReview').value;
  puppiesList[pupIndex].sold = document.getElementById('editDogSold').value === 'true';
  
  savePuppiestoStorage(puppiesList);
  showAlert(`${puppiesList[pupIndex].name} updated successfully!`, 'success');
  
  closeEditModal();
  loadDogsTable();
});

// Delete dog
function deleteDog(dogId) {
  if (!confirm('Are you sure you want to delete this puppy? This action cannot be undone.')) {
    return;
  }
  
  let puppiesList = getPuppiesFromStorage();
  const pup = puppiesList.find(p => p.id === dogId);
  
  if (!pup) {
    showAlert('Puppy not found', 'error');
    return;
  }
  
  puppiesList = puppiesList.filter(p => p.id !== dogId);
  savePuppiestoStorage(puppiesList);
  showAlert(`${pup.name} has been deleted`, 'success');
  loadDogsTable();
}

// Add new dog
document.getElementById('addDogForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const puppiesList = getPuppiesFromStorage();
  
  // Generate new ID
  const maxId = Math.max(...puppiesList.map(p => parseInt(p.id.substring(1))), 0);
  const newId = `p${maxId + 1}`;
  
  // Get gallery images
  const galleryInputs = document.querySelectorAll('.gallery-img');
  const gallery = [];
  galleryInputs.forEach(input => {
    if (input.value.trim()) {
      gallery.push(input.value.trim());
    }
  });
  
  // Add main image to gallery if not already there
  const mainImg = document.getElementById('dogImg').value;
  if (!gallery.includes(mainImg)) {
    gallery.unshift(mainImg);
  }
  
  // Create new puppy object
  const newPuppy = {
    id: newId,
    name: document.getElementById('dogName').value,
    color: document.getElementById('dogColor').value,
    img: mainImg,
    gallery: gallery.length > 0 ? gallery : [mainImg],
    sold: document.getElementById('dogSold').value === 'true',
    gender: document.getElementById('dogGender').value,
    review: document.getElementById('dogReview').value,
    price: parseFloat(document.getElementById('dogPrice').value)
  };
  
  puppiesList.push(newPuppy);
  savePuppiestoStorage(puppiesList);
  
  showAlert(`${newPuppy.name} has been added successfully!`, 'success');
  
  // Reset form
  document.getElementById('addDogForm').reset();
  document.querySelectorAll('.gallery-img').forEach(input => input.value = '');
});

// Close modal when clicking outside of it
window.onclick = function(event) {
  const modal = document.getElementById('editModal');
  if (event.target === modal) {
    closeEditModal();
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  // Load initial table (not shown by default, but ready when tab is clicked)
});

// ===== SAVE / EXPORT HELPERS =====

// Ensure current puppies list is saved to browser storage and show confirmation
function saveAllSettings() {
  const puppiesList = getPuppiesFromStorage();
  savePuppiestoStorage(puppiesList);
  showAlert('Settings saved to browser storage (localStorage).', 'success');
}

// Generate a puppies.js file content from current puppies data and trigger download
function exportPuppiesJS() {
  try {
    const puppiesList = getPuppiesFromStorage();
    const header = "// puppies.js\n";
    const content = header + 'const puppies = ' + JSON.stringify(puppiesList, null, 2) + ';\n';
    const blob = new Blob([content], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'puppies.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showAlert('Downloaded updated puppies.js — commit this file to GitHub to make changes permanent.', 'success');
  } catch (err) {
    console.error(err);
    showAlert('Failed to export puppies.js', 'error');
  }
}

// Copy updated puppies.js content to clipboard (for quick paste into GitHub editor)
function copyPuppiesToClipboard() {
  const puppiesList = getPuppiesFromStorage();
  const content = '// puppies.js\n' + 'const puppies = ' + JSON.stringify(puppiesList, null, 2) + ';\n';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(content).then(() => {
      showAlert('puppies.js content copied to clipboard.', 'success');
    }).catch(() => {
      showAlert('Copy to clipboard failed (browser permission).', 'error');
    });
  } else {
    // Fallback: create a temporary textarea
    const ta = document.createElement('textarea');
    ta.value = content;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showAlert('puppies.js content copied to clipboard (fallback).', 'success');
    } catch (e) {
      showAlert('Copy to clipboard failed', 'error');
    }
    ta.remove();
  }
}

// Wire up buttons when DOM ready
document.addEventListener('DOMContentLoaded', function() {
  const saveBtn = document.getElementById('saveSettingsBtn');
  const exportBtn = document.getElementById('exportPuppiesBtn');
  const copyBtn = document.getElementById('copyPuppiesBtn');

  if (saveBtn) saveBtn.addEventListener('click', saveAllSettings);
  if (exportBtn) exportBtn.addEventListener('click', exportPuppiesJS);
  if (copyBtn) copyBtn.addEventListener('click', copyPuppiesToClipboard);
});

// ===== GitHub PR creation (client-side) =====

// Helper: base64 encode string
function base64Encode(str) {
  try { return btoa(unescape(encodeURIComponent(str))); } catch (e) { return btoa(str); }
}

async function createBranchIfNeeded(owner, repo, baseBranch, newBranch, token) {
  const headers = { Authorization: 'token ' + token, Accept: 'application/vnd.github.v3+json' };
  // Get ref of base branch
  const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${baseBranch}`, { headers });
  if (!refRes.ok) throw new Error('Failed to get base branch ref: ' + refRes.status);
  const refData = await refRes.json();
  const sha = refData.object.sha;

  // Try to create new branch
  const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
    method: 'POST', headers: {...headers, 'Content-Type':'application/json'},
    body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha })
  });

  if (createRes.status === 201) return true; // created
  if (createRes.status === 422) return false; // already exists
  throw new Error('Failed to create branch: ' + createRes.status);
}

async function pushFileToRepo(owner, repo, path, content, branch, message, token) {
  const headers = { Authorization: 'token ' + token, Accept: 'application/vnd.github.v3+json' };

  // Check if file exists on branch to get sha
  const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`, { headers });
  let existingSha = null;
  if (getRes.ok) {
    const data = await getRes.json();
    existingSha = data.sha;
  }

  const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT', headers: {...headers, 'Content-Type':'application/json'},
    body: JSON.stringify({ message, content: base64Encode(content), branch, sha: existingSha })
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    throw new Error('Failed to create/update file: ' + putRes.status + ' ' + err);
  }

  return await putRes.json();
}

async function createPullRequest(owner, repo, head, base, title, body, token) {
  const headers = { Authorization: 'token ' + token, Accept: 'application/vnd.github.v3+json', 'Content-Type':'application/json' };
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: 'POST', headers, body: JSON.stringify({ title, head, base, body })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('Failed to create PR: ' + res.status + ' ' + text);
  }
  return await res.json();
}

async function handleCreatePR() {
  const owner = (document.getElementById('ghOwner')||{}).value?.trim();
  const repo = (document.getElementById('ghRepo')||{}).value?.trim();
  const branchInput = (document.getElementById('ghBranch')||{}).value?.trim();
  const pathInput = (document.getElementById('ghPath')||{}).value?.trim() || 'site/puppies.js';
  const token = (document.getElementById('ghToken')||{}).value;

  if (!owner || !repo || !token) {
    showAlert('Please fill GitHub owner, repo and token.', 'error');
    return;
  }

  showAlert('Creating branch and pushing file to GitHub. This may take a few seconds...', 'success');

  try {
    // Get repo details to determine default branch
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: { Authorization: 'token ' + token } });
    if (!repoRes.ok) throw new Error('Unable to access repo. Check owner/repo/token.');
    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch || 'main';

    const newBranch = branchInput || `admin-updates-${Date.now()}`;

    // Create branch if it doesn't exist
    await createBranchIfNeeded(owner, repo, defaultBranch, newBranch, token).catch(err => {
      // If create failed due to exists, ignore; else rethrow
      if (!/create branch/i.test(err.message) && !/422/.test(err.message)) throw err;
    });

    // Prepare content
    const puppiesList = getPuppiesFromStorage();
    const header = "// puppies.js\n";
    const content = header + 'const puppies = ' + JSON.stringify(puppiesList, null, 2) + ';\n';

    // Push file
    const commitMessage = `Update puppies.js via admin panel`;
    await pushFileToRepo(owner, repo, pathInput, content, newBranch, commitMessage, token);

    // Create PR
    const pr = await createPullRequest(owner, repo, newBranch, defaultBranch, 'Admin panel updates: puppies.js', 'Automated update from admin panel', token);

    showAlert('Pull request created: ' + pr.html_url, 'success');
    // Optionally open PR in new tab
    window.open(pr.html_url, '_blank');
  } catch (err) {
    console.error(err);
    showAlert('GitHub push/PR failed: ' + err.message, 'error');
  }
}

// Wire Create PR button
document.addEventListener('DOMContentLoaded', function() {
  const prBtn = document.getElementById('createPRBtn');
  if (prBtn) prBtn.addEventListener('click', handleCreatePR);
});

// ===== Push via serverless function (recommended) =====
async function handleServerPush() {
  const serverUrlEl = document.getElementById('serverUrl');
  const url = (serverUrlEl && serverUrlEl.value.trim()) || '/.netlify/functions/update-puppies';
  const password = (document.getElementById('adminPanelPassword')||{}).value;
  const owner = (document.getElementById('ghOwner')||{}).value?.trim();
  const repo = (document.getElementById('ghRepo')||{}).value?.trim();
  const branch = (document.getElementById('ghBranch')||{}).value?.trim();
  const path = (document.getElementById('ghPath')||{}).value?.trim() || 'site/puppies.js';

  if (!password) { showAlert('Enter admin panel password for server push', 'error'); return; }
  if (!owner || !repo) { showAlert('Enter GitHub owner and repo', 'error'); return; }

  const puppiesList = getPuppiesFromStorage();
  const content = '// puppies.js\n' + 'const puppies = ' + JSON.stringify(puppiesList, null, 2) + ';\n';

  showAlert('Sending update to server...', 'success');

  try {
    const res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, owner, repo, branch, path, content, commitMessage: 'Update puppies.js via admin panel' })
    });

    const data = await res.json();
    if (!res.ok) {
      showAlert('Server push failed: ' + (data.error || res.statusText), 'error');
      return;
    }

    showAlert('Server push successful. PR: ' + data.pr, 'success');
    if (data.pr) window.open(data.pr, '_blank');
  } catch (err) {
    console.error(err);
    showAlert('Server push error: ' + err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const serverBtn = document.getElementById('serverPushBtn');
  if (serverBtn) serverBtn.addEventListener('click', handleServerPush);
});

// ===== Admin chat management =====
async function fetchAllChats() {
  const owner = (document.getElementById('adminChatOwner')||{}).value?.trim();
  const repo = (document.getElementById('adminChatRepo')||{}).value?.trim();
  const password = (document.getElementById('adminChatPassword')||{}).value;
  if (!password) { showAlert('Enter admin password to access chats', 'error'); return; }
  try {
    const res = await fetch('/.netlify/functions/chat', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'list', owner, repo, password }) });
    const d = await res.json();
    if (!res.ok) { showAlert('Failed to load chats: ' + (d.error||res.statusText), 'error'); return; }
    return d.conversations || {};
  } catch (err) { console.error(err); showAlert('Error loading chats', 'error'); }
}

function renderConvoList(convos) {
  const list = document.getElementById('convoList');
  list.innerHTML = '';
  Object.values(convos || {}).sort((a,b)=> new Date(b.updatedAt||b.createdAt) - new Date(a.updatedAt||a.createdAt)).forEach(c=>{
    const el = document.createElement('div');
    el.style.padding='8px'; el.style.borderBottom='1px solid #eee'; el.style.cursor='pointer'; el.style.display='flex'; el.style.justifyContent='space-between'; el.style.alignItems='center';
    const left = document.createElement('div');
    left.innerHTML = `<div style="font-weight:bold">${c.name}</div><div style="font-size:12px;color:#666">${c.messages.length} messages • ${formatTime(c.updatedAt || c.createdAt)}</div>`;
    const right = document.createElement('div');
    if (c.unread) {
      const badge = document.createElement('span'); badge.textContent='NEW'; badge.style.background='#dc3545'; badge.style.color='#fff'; badge.style.padding='4px 8px'; badge.style.borderRadius='12px'; badge.style.fontSize='12px'; right.appendChild(badge);
    }
    el.appendChild(left);
    el.appendChild(right);
    el.onclick = ()=> loadConversation(c.id);
    list.appendChild(el);
  });
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

async function loadConversation(id) {
  const owner = (document.getElementById('adminChatOwner')||{}).value?.trim();
  const repo = (document.getElementById('adminChatRepo')||{}).value?.trim();
  const password = (document.getElementById('adminChatPassword')||{}).value;
  if (!password) { showAlert('Enter admin password', 'error'); return; }
  const res = await fetch('/.netlify/functions/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'get', owner, repo, convoId:id }) });
  const d = await res.json();
  if (!res.ok) { showAlert('Failed to load conversation: '+(d.error||res.statusText),'error'); return; }
  const convo = d.conversation;
  const header = document.getElementById('convoHeader'); header.innerHTML = `<strong>${convo.name}</strong> — ${convo.email || ''}`;
  const mEl = document.getElementById('convoMessages'); mEl.innerHTML = '';
  convo.messages.forEach(m=>{
    const row = document.createElement('div'); row.style.margin='6px 0';
    if (m.from==='admin') row.innerHTML = `<div style="background:#111;color:#fff;padding:8px;border-radius:8px;display:inline-block;">${m.text}</div>`;
    else row.innerHTML = `<div style="background:#ffcc00;color:#111;padding:8px;border-radius:8px;display:inline-block;">${m.text}</div>`;
    mEl.appendChild(row);
  });
  // store current convo id for reply
  mEl.dataset.currentConvo = id;
}

async function sendReply() {
  const owner = (document.getElementById('adminChatOwner')||{}).value?.trim();
  const repo = (document.getElementById('adminChatRepo')||{}).value?.trim();
  const password = (document.getElementById('adminChatPassword')||{}).value;
  const input = document.getElementById('replyInput');
  const text = input.value.trim();
  const convo = document.getElementById('convoMessages');
  const id = convo.dataset.currentConvo;
  if (!password || !id || !text) { showAlert('Password, conversation and reply required', 'error'); return; }
  try {
    const res = await fetch('/.netlify/functions/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'reply', owner, repo, convoId: id, message: text, password }) });
    const d = await res.json();
    if (!res.ok) { showAlert('Reply failed: '+(d.error||res.statusText),'error'); return; }
    showAlert('Reply sent', 'success');
    input.value='';
    await loadConversation(id);
  } catch (err) { console.error(err); showAlert('Reply error','error'); }
}

document.addEventListener('DOMContentLoaded', function(){
  const refreshBtn = document.getElementById('refreshChatsBtn');
  const sendBtn = document.getElementById('sendReplyBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', async ()=>{ const convos = await fetchAllChats(); if (convos) renderConvoList(convos); });
  if (sendBtn) sendBtn.addEventListener('click', sendReply);
  
  // Admin notifications: request permission and poll periodically for new convos/unread
  const enableBtn = document.getElementById('adminEnableNotif');
  let seenConvos = {};
  try { seenConvos = JSON.parse(sessionStorage.getItem('admin_seen_convos') || '{}'); } catch(e){ seenConvos = {}; }

  async function requestAdminNotifs() {
    if (!('Notification' in window)) { showAlert('Browser does not support notifications', 'error'); return; }
    if (Notification.permission === 'granted') { showAlert('Notifications already enabled', 'success'); return; }
    try { const p = await Notification.requestPermission(); if (p === 'granted') showAlert('Notifications enabled', 'success'); else showAlert('Notifications denied', 'error'); } catch(e){ showAlert('Notification permission request failed', 'error'); }
  }

  enableBtn?.addEventListener('click', requestAdminNotifs);

  async function pollChatsForNotifications() {
    const convos = await fetchAllChats(); if (!convos) return;
    Object.values(convos).forEach(c => {
      const prev = seenConvos[c.id];
      const updated = c.updatedAt || c.createdAt;
      if (!prev) {
        // new convo
        if (Notification.permission === 'granted') new Notification('New conversation', { body: `${c.name}: ${c.messages[0]?.text || ''}`, tag: c.id }).onclick = function(){ window.open('/admin/index.html'); };
      } else if (prev !== updated && c.unread) {
        // updated and unread
        if (Notification.permission === 'granted') new Notification('New reply received', { body: `${c.name} has a new message`, tag: c.id }).onclick = function(){ window.open('/admin/index.html'); };
      }
      seenConvos[c.id] = updated;
    });
    sessionStorage.setItem('admin_seen_convos', JSON.stringify(seenConvos));
  }

  // start polling every 12s
  setInterval(pollChatsForNotifications, 12000);
  // also run once on load
  pollChatsForNotifications();

  // Register service worker and subscribe admin for push notifications
  async function registerAdminPush() {
    if (!('serviceWorker' in navigator)) { showAlert('Service Worker not supported', 'error'); return; }
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const vapidRes = await fetch('/.netlify/functions/get-vapid');
      const vapid = (await vapidRes.json()).publicKey;
      if (vapid && reg.pushManager) {
        const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapid) });
        await fetch('/.netlify/functions/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'subscribe', subscription: sub, role:'admin' }) });
        showAlert('Admin push subscription registered', 'success');
      }
    } catch (e) { console.error(e); showAlert('Admin push registration failed', 'error'); }
  }

  // wire enable button to both request permission and register
  enableBtn?.addEventListener('click', async () => { await requestAdminNotifs(); await registerAdminPush(); });

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }
  
  // If URL has openConvo param, open it
  const params = new URLSearchParams(window.location.search);
  const openConvo = params.get('openConvo');
  if (openConvo) loadConversation(openConvo);
});
