self.addEventListener("install", (e) => {
    self.skipWaiting();
});

self.addEventListener("activate", (e) => {
    console.log("Santuario Literario activo");
});

self.addEventListener("fetch", (e) => {});
