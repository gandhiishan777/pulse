(function () {
  'use strict';

  if (navigator.doNotTrack === '1') return;

  var script = document.currentScript;
  var siteId = script && script.getAttribute('data-site-id');
  if (!siteId) return;

  var scriptSrc = script && script.src;
  var origin = scriptSrc ? new URL(scriptSrc).origin : location.origin;
  var endpoint = origin + '/api/event';

  var VISITOR_KEY = '_pulse_vid';

  function getVisitorId() {
    try {
      var stored = localStorage.getItem(VISITOR_KEY);
      if (stored) return stored;
      var id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(VISITOR_KEY, id);
      return id;
    } catch (_) {
      return 'anonymous';
    }
  }

  var visitorId = getVisitorId();
  var pageStartTime = Date.now();
  var lastPath = location.pathname + location.search;

  function sendEvent(type, path, referrer, durationMs, properties) {
    var payload = {
      site_id: siteId,
      visitor_id: visitorId,
      type: type,
      path: path,
      referrer: referrer || null,
      properties: properties || {},
    };
    if (typeof durationMs === 'number') {
      payload.duration_ms = durationMs;
    }

    try {
      if (navigator.sendBeacon) {
        // Wrap in a Blob so the request carries Content-Type: application/json.
        // sendBeacon with a plain string defaults to text/plain, which some
        // servers / middleware reject.
        var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(function () {});
      }
    } catch (_) {}
  }

  function trackPageview(path, referrer, duration) {
    sendEvent('pageview', path, referrer, duration, {});
  }

  function onPageLoad() {
    pageStartTime = Date.now();
    trackPageview(lastPath, document.referrer || null, null);
  }

  // Intercept history.pushState for SPA navigation
  var originalPushState = history.pushState.bind(history);
  history.pushState = function () {
    var prevPath = lastPath;
    var duration = Date.now() - pageStartTime;
    originalPushState.apply(history, arguments);
    var newPath = location.pathname + location.search;
    if (newPath !== prevPath) {
      trackPageview(prevPath, null, duration);
      lastPath = newPath;
      pageStartTime = Date.now();
      trackPageview(newPath, prevPath || null, null);
    }
  };

  window.addEventListener('popstate', function () {
    var prevPath = lastPath;
    var duration = Date.now() - pageStartTime;
    var newPath = location.pathname + location.search;
    if (newPath !== prevPath) {
      trackPageview(prevPath, null, duration);
      lastPath = newPath;
      pageStartTime = Date.now();
      trackPageview(newPath, prevPath || null, null);
    }
  });

  // Send duration on page unload
  window.addEventListener('pagehide', function () {
    var duration = Date.now() - pageStartTime;
    sendEvent('pageview', lastPath, null, duration, { _unload: true });
  });

  // Custom event API
  window.pulse = function (eventName, properties) {
    if (navigator.doNotTrack === '1') return;
    sendEvent(
      'custom_event',
      location.pathname + location.search,
      null,
      null,
      Object.assign({ event_name: eventName }, properties || {})
    );
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onPageLoad);
  } else {
    onPageLoad();
  }
})();
