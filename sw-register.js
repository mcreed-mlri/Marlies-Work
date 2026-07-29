/* Service worker registration with automatic update checks. */
(function () {
  if (!('serviceWorker' in navigator)) return;

  var refreshing = false;

  function reloadForUpdate() {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  }

  function showUpdateBanner() {
    if (document.getElementById('sw-update-banner')) return;

    var bar = document.createElement('div');
    bar.id = 'sw-update-banner';
    bar.setAttribute('role', 'status');
    bar.innerHTML =
      '<span>A new version is ready.</span>' +
      '<button type="button">Refresh</button>';
    bar.style.cssText =
      'position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);' +
      'z-index:9999;display:flex;align-items:center;gap:.75rem;padding:.65rem 1rem;' +
      'border-radius:999px;background:#221f1a;color:#fbf8f1;font:500 .875rem/1.2 system-ui,sans-serif;' +
      'box-shadow:0 8px 24px rgba(0,0,0,.18);';

    var btn = bar.querySelector('button');
    btn.style.cssText =
      'border:0;border-radius:999px;padding:.35rem .85rem;background:#3a5a40;color:#fff;' +
      'font:inherit;cursor:pointer;';
    btn.addEventListener('click', reloadForUpdate);

    document.body.appendChild(bar);
  }

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (document.visibilityState === 'hidden') {
      reloadForUpdate();
      return;
    }
    showUpdateBanner();
  });

  function checkForUpdates(registration) {
    if (registration) registration.update().catch(function () {});
  }

  var swUrl = new URL('sw.js', document.currentScript.src).href;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register(swUrl).then(function (registration) {
      checkForUpdates(registration);

      registration.addEventListener('updatefound', function () {
        var worker = registration.installing;
        if (!worker) return;

        worker.addEventListener('statechange', function () {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            worker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') checkForUpdates(registration);
      });

      window.addEventListener('focus', function () {
        checkForUpdates(registration);
      });
    }).catch(function () {});
  });
})();
