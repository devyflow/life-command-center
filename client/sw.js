const CACHE = "life-command-static-v19";
const REMINDER_CACHE = "life-command-reminders-v1";
const STATIC = ["/styles.css", "/app.js", "/scene.js", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => ![CACHE,REMINDER_CACHE].includes(key)).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin || url.pathname === "/" || url.pathname.startsWith("/api/")) return;
  const freshAsset=/\.(?:js|css)$/.test(url.pathname);
  if(freshAsset){
    event.respondWith(fetch(event.request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response;}).catch(()=>caches.match(event.request).then(cached=>cached||caches.match(url.pathname))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));return response;})));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target=event.notification.data?.url||"/";
  event.waitUntil(clients.matchAll({ type:"window", includeUncontrolled:true }).then(async windows => {if(windows[0]){await windows[0].navigate?.(target);return windows[0].focus();}return clients.openWindow(target);}));
});

self.addEventListener("periodicsync", event => {
  if(event.tag!=="life-command-reminders")return;
  event.waitUntil((async()=>{
    const response=await fetch("/api/state",{cache:"no-store",credentials:"include"});if(!response.ok)return;
    const payload=await response.json(),state=payload.state||payload;if(!state.preferences?.reminders)return;
    const now=new Date(),lead=Number(state.preferences.reminderLead||10),due=[];
    for(const task of state.tasks||[]){if(task.progress>=100||!task.date||!task.start)continue;const at=new Date(`${task.date}T${task.start}:00`),minutes=(at-now)/60000;if(minutes<=lead&&minutes>=-10)due.push({key:`task-${task.id}-${task.date}-${task.start}`,title:task.title,body:`${minutes<=0?'Scheduled now':`Starts in ${Math.ceil(minutes)} minutes`} · ${task.next||'Open Life Command Center'}`,url:"/"});}
    for(const note of state.boardNotes||[]){if(note.archived||!note.notifyAt)continue;const minutes=(new Date(note.notifyAt)-now)/60000;if(minutes<=lead&&minutes>=-15)due.push({key:`board-${note.id}-${note.notifyAt}`,title:"A note from your board",body:note.text,url:"/#board"});}
    const seen=await caches.open(REMINDER_CACHE);
    for(const item of due){const marker=new Request(`${self.location.origin}/__reminder/${encodeURIComponent(item.key)}`);if(await seen.match(marker))continue;await self.registration.showNotification(item.title,{body:item.body,tag:item.key,data:{url:item.url}});await seen.put(marker,new Response(new Date().toISOString()));}
  })());
});
