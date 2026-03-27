// ==UserScript==
// @name         Macindows — YouTube Theater Fix
// @namespace    Lerakei-0
// @version      1.0.1
// @description  Removes theater-mode dark masthead when navigating away from watch page
// @match        https://www.youtube.com/*
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  const watchObserver = new MutationObserver(updateTheaterClass);
  let watchObserverAttached = false;

  function updateTheaterClass() {
    const app = document.querySelector('ytd-app');
    if (!app) return;

    const onWatchPage = location.pathname === '/watch';
    const theaterActive = onWatchPage && !!document.querySelector('ytd-watch-flexy[theater]');

    app.classList.toggle('theater-active', theaterActive);
  }

  function attachWatchObserver() {
    const watchFlexy = document.querySelector('ytd-watch-flexy');
    if (watchFlexy && !watchObserverAttached) {
      watchObserver.observe(watchFlexy, { attributes: true, attributeFilter: ['theater'] });
      watchObserverAttached = true;
    }
  }

  // Re-run attach + update on every SPA navigation
  // ytd-watch-flexy may be freshly inserted or re-used each time
  document.addEventListener('yt-navigate-finish', () => {
    watchObserverAttached = false;
    watchObserver.disconnect();
    attachWatchObserver();
    updateTheaterClass();
  });

  document.addEventListener('yt-page-data-updated', updateTheaterClass);

  // Poll until ytd-app and ytd-watch-flexy are in the DOM on initial load
  function waitForElements() {
    const app = document.querySelector('ytd-app');
    const watchFlexy = document.querySelector('ytd-watch-flexy');

    if (app) updateTheaterClass();
    if (watchFlexy) attachWatchObserver();

    // Keep polling if we're on the watch page but elements aren't ready yet
    if (!app || (location.pathname === '/watch' && !watchFlexy)) {
      setTimeout(waitForElements, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForElements);
  } else {
    waitForElements();
  }
})();
