const CACHE='interval-clock-v8';
const BASE=new URL('./',self.location.href);
const INDEX=new URL('index.html',BASE);
const ASSETS=['manifest.webmanifest','icon.svg'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  const freshUrl=new URL(INDEX.href);
  freshUrl.searchParams.set('refresh',CACHE);
  const response=await fetch(freshUrl.href,{cache:'reload'});
  if(!response.ok)throw new Error('Could not fetch the latest app page');
  await cache.put(INDEX.href,response.clone());
  await cache.put(BASE.href,response.clone());
  await cache.addAll(ASSETS.map(path=>new URL(path,BASE).href));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        const cache=await caches.open(CACHE);
        await cache.put(INDEX.href,response.clone());
        await cache.put(BASE.href,response.clone());
        return response;
      }catch(error){
        return (await caches.match(event.request))||(await caches.match(INDEX.href))||(await caches.match(BASE.href));
      }
    })());
    return;
  }
  event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request)));
});
