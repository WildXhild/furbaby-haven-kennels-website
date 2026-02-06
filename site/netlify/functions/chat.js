// Netlify Function: chat.js
// Handles visitor messages and admin replies by storing messages in site/chat.json in the repo.
// Requires these Netlify env vars:
// - GITHUB_TOKEN : Personal access token with repo contents access
// - ADMIN_PASSWORD : password used by admin panel to authenticate
// Optional:
// - GITHUB_OWNER, GITHUB_REPO : default owner/repo to operate on if not provided in request

const fetch = require('node-fetch');
let webpush;
try { webpush = require('web-push'); } catch(e) { webpush = null; }

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const { action, owner, repo, path = 'site/chat.json', convoId, name, email, message, password } = body;

    const OWNER = owner || process.env.GITHUB_OWNER;
    const REPO = repo || process.env.GITHUB_REPO;

    if (!OWNER || !REPO) return { statusCode: 400, body: JSON.stringify({ error: 'Missing owner/repo (or set GITHUB_OWNER/GITHUB_REPO)' }) };
    if (!process.env.GITHUB_TOKEN) return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured: missing GITHUB_TOKEN' }) };

    const token = process.env.GITHUB_TOKEN;
    const headers = { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' };

    // Get repo info and default branch
    const repoRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}`, { headers });
    if (!repoRes.ok) {
      const text = await repoRes.text();
      return { statusCode: 400, body: JSON.stringify({ error: 'Unable to access repo: ' + text }) };
    }
    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch || 'main';

    // Helper to fetch current chat file
    async function fetchChatFile() {
      const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(defaultBranch)}`, { headers });
      if (!res.ok) {
        // if not found, return empty structure
        return { sha: null, data: {} };
      }
      const d = await res.json();
      const content = Buffer.from(d.content, 'base64').toString('utf8');
      const json = JSON.parse(content || '{}');
      return { sha: d.sha, data: json };
    }

    async function putChatFile(newData, existingSha) {
      const content = Buffer.from(JSON.stringify(newData, null, 2)).toString('base64');
      const putRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`, {
        method: 'PUT', headers: { ...headers, 'Content-Type':'application/json' },
        body: JSON.stringify({ message: 'Update chat.json via serverless chat', content, branch: defaultBranch, sha: existingSha })
      });
      if (!putRes.ok) {
        const text = await putRes.text();
        throw new Error('Failed to update chat file: ' + text);
      }
      return await putRes.json();
    }

    // Helpers for push subscriptions storage (site/push_subs.json)
    async function fetchPushFile() {
      const spath = 'site/push_subs.json';
      const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(spath)}?ref=${encodeURIComponent(defaultBranch)}`, { headers });
      if (!res.ok) return { sha: null, subs: [] };
      const d = await res.json();
      const content = Buffer.from(d.content, 'base64').toString('utf8');
      const json = JSON.parse(content || '{}');
      return { sha: d.sha, subs: json.subscriptions || [] };
    }

    async function putPushFile(subs, existingSha) {
      const spath = 'site/push_subs.json';
      const content = Buffer.from(JSON.stringify({ subscriptions: subs }, null, 2)).toString('base64');
      const putRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(spath)}`, {
        method: 'PUT', headers: { ...headers, 'Content-Type':'application/json' },
        body: JSON.stringify({ message: 'Update push_subs.json', content, branch: defaultBranch, sha: existingSha })
      });
      if (!putRes.ok) {
        const text = await putRes.text();
        throw new Error('Failed to update push_subs file: ' + text);
      }
      return await putRes.json();
    }

    // Load current chats
    const { sha, data } = await fetchChatFile();
    const chats = data.conversations || {};

    // Ensure action
    if (!action) return { statusCode: 400, body: JSON.stringify({ error: 'Missing action' }) };

    if (action === 'post') {
      if (!message) return { statusCode: 400, body: JSON.stringify({ error: 'Missing message' }) };
      // For new visitor message, create convoId if not provided
      const id = convoId || `c_${Date.now()}_${Math.floor(Math.random()*1000)}`;
      if (!chats[id]) {
        chats[id] = { id, name: name || 'Visitor', email: email || '', messages: [], createdAt: new Date().toISOString(), updatedAt: null, unread: true };
      }
      chats[id].messages.push({ from: 'visitor', text: message, ts: new Date().toISOString() });
      chats[id].updatedAt = new Date().toISOString();
      chats[id].unread = true;

      // Persist
      const newData = { conversations: chats };
      await putChatFile(newData, sha);

      // Send optional notifications (Slack or generic webhook)
      try {
        const payload = {
          convoId: id,
          name: name || 'Visitor',
          email: email || '',
          message: message,
          ts: new Date().toISOString()
        };

        if (process.env.SLACK_WEBHOOK_URL) {
          try {
            await fetch(process.env.SLACK_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: `*New chat message* from *${payload.name}*\n>${payload.message}\nConvo ID: ${payload.convoId}` })
            });
          } catch (e) { console.error('Slack notify failed', e); }
        }

        if (process.env.NOTIFY_WEBHOOK_URL) {
          try {
            await fetch(process.env.NOTIFY_WEBHOOK_URL, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
          } catch (e) { console.error('Generic webhook notify failed', e); }
        }
      } catch (e) {
        console.error('Notification error', e);
      }

      // Also send Web Push notifications to subscribed clients (if configured)
      try {
        if (webpush && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_PUBLIC_KEY) {
          webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
          const { sha: pushSha, subs } = await fetchPushFile();
          const payload = { type: 'new_message', convoId: id, name: name || 'Visitor', message };
          for (const s of subs || []) {
            try { await webpush.sendNotification(s, JSON.stringify(payload)); } catch (e) { console.error('push send failed', e); }
          }
        }
      } catch (e) { console.error('Web push error', e); }

      return { statusCode: 200, body: JSON.stringify({ ok: true, convoId: id }) };
    }

    if (action === 'reply') {
      // Admin posting reply to convo; require admin password
      if (!password || password !== process.env.ADMIN_PASSWORD) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      if (!convoId || !chats[convoId]) return { statusCode: 404, body: JSON.stringify({ error: 'Conversation not found' }) };
      if (!message) return { statusCode: 400, body: JSON.stringify({ error: 'Missing message' }) };

      chats[convoId].messages.push({ from: 'admin', text: message, ts: new Date().toISOString() });
      chats[convoId].updatedAt = new Date().toISOString();
      chats[convoId].unread = false;

      const newData = { conversations: chats };
      await putChatFile(newData, sha);

      // Send push to visitor/admin subscribers
      try {
        if (webpush && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_PUBLIC_KEY) {
          webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
          const { sha: pushSha, subs } = await fetchPushFile();
          const payload = { type: 'admin_reply', convoId, message };
          for (const s of subs || []) {
            try { await webpush.sendNotification(s, JSON.stringify(payload)); } catch (e) { console.error('push send failed', e); }
          }
        }
      } catch (e) { console.error('Web push error', e); }

      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    if (action === 'subscribe') {
      // Save push subscription sent from client
      const { subscription, role } = body;
      if (!subscription) return { statusCode: 400, body: JSON.stringify({ error: 'Missing subscription' }) };
      const { sha: pushSha, subs } = await fetchPushFile();
      // de-duplicate by endpoint
      const exists = subs.find(s => s.endpoint === subscription.endpoint);
      if (!exists) subs.push({ subscription, role: role || 'visitor' });
      await putPushFile(subs, pushSha);
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    if (action === 'list') {
      // Admin listing all conversations (requires password)
      if (!password || password !== process.env.ADMIN_PASSWORD) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      // Return list
      return { statusCode: 200, body: JSON.stringify({ ok: true, conversations: chats }) };
    }

    if (action === 'get') {
      // Visitor fetching conversation by id
      if (!convoId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing convoId' }) };
      const convo = chats[convoId];
      if (!convo) return { statusCode: 404, body: JSON.stringify({ error: 'Conversation not found' }) };
      return { statusCode: 200, body: JSON.stringify({ ok: true, conversation: convo }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Unknown action' }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
