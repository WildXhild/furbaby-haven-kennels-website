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
