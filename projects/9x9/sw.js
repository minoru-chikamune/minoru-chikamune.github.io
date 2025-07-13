self.addEventListener('fetch', ev => {
  ev.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          return caches.delete(key);
        })
      )
    )
  );
  if (ev.request.url.startsWith('http')) {
    // ev.respondWith(
    //   caches.match(ev.request).then(res => {
    //     return res || fetch(ev.request).then(res => {
    //       return caches.open('cache0').then(cache => {
    //         cache.put(ev.request.url, res.clone());
    //         return res;
    //       });
    //     });
    //   })
    // );
  }
});
