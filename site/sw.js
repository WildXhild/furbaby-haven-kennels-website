self.addEventListener('push', function(event) {
  let payload = {};
  try { payload = event.data.json(); } catch(e) { payload = { title: 'Notification', body: event.data?.text || '' }; }

  const title = payload.title || (payload.type === 'admin_reply' ? 'Reply from admin' : 'New message');
  const options = {
    body: payload.message || payload.body || '',
    tag: payload.convoId || undefined,
    data: payload,
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const data = event.notification.data || {};
  const convoId = data.convoId;
  const target = data.target || (data.type === 'admin_reply' ? 'visitor' : (data.type === 'new_message' ? 'admin' : 'visitor'));

  event.waitUntil((async () => {
    const clientsList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (target === 'admin') {
      const url = `/admin/index.html?openConvo=${encodeURIComponent(convoId)}`;
      for (const c of clientsList) { if (c.url.includes('/admin/') ) return c.focus().then(()=>c.navigate(url)); }
      return clients.openWindow(url);
    } else {
      // visitor: open site and open chat panel via URL param
      const url = `/?openConvo=${encodeURIComponent(convoId)}`;
      for (const c of clientsList) { if (c.url.endsWith('/') || c.url.includes('/index.html')) return c.focus().then(()=>c.navigate(url)); }
      return clients.openWindow(url);
    }
  })());
});
