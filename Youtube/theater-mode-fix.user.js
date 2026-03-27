// ==UserScript==
// @name         Macindows — YouTube Theater Fix
// @namespace    Lerakei
// @version      2.3.0
// @description  Syncs theater-active class on ytd-app and live chat iframe
//               so masthead and chat styles only apply when theater mode is on.
// @match        https://www.youtube.com/*
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  const watchObserver = new MutationObserver(updateTheaterClass);
  let watchObserverAttached = false;
  let chatSyncInterval = null;

  function isTheaterActive() {
    return location.pathname === '/watch' && !!document.querySelector('ytd-watch-flexy[theater]');
  }

  function syncChatIframe(theaterActive) {
    const iframe = document.querySelector('ytd-live-chat-frame iframe');
    if (!iframe) return false;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow && iframe.contentWindow.document;
      if (!iframeDoc || !iframeDoc.body) return false;

      iframeDoc.body.classList.toggle('theater-active', theaterActive);
      return true;
    } catch (e) {
      return false;
    }
  }

  function updateTheaterClass() {
    const app = document.querySelector('ytd-app');
    if (!app) return;

    const theaterActive = isTheaterActive();
    app.classList.toggle('theater-active', theaterActive);
    syncChatIframe(theaterActive);
  }

  // Poll until the chat iframe body is accessible and synced
  function startChatIframePolling() {
    if (chatSyncInterval) clearInterval(chatSyncInterval);

    chatSyncInterval = setInterval(() => {
      const theaterActive = isTheaterActive();
      const synced = syncChatIframe(theaterActive);
      if (synced) {
        clearInterval(chatSyncInterval);
        chatSyncInterval = null;

        // Also watch for future theater toggles after iframe is ready
        const iframe = document.querySelector('ytd-live-chat-frame iframe');
        if (iframe) {
          iframe.addEventListener('load', () => {
            syncChatIframe(isTheaterActive());
          });
        }
      }
    }, 300);
  }

  function attachWatchObserver() {
    const watchFlexy = document.querySelector('ytd-watch-flexy');
    if (watchFlexy && !watchObserverAttached) {
      watchObserver.observe(watchFlexy, { attributes: true, attributeFilter: ['theater'] });
      watchObserverAttached = true;
    }
  }

  // On every SPA navigation
  document.addEventListener('yt-navigate-finish', () => {
    watchObserverAttached = false;
    watchObserver.disconnect();
    attachWatchObserver();
    updateTheaterClass();

    // If on watch page, start polling for chat iframe
    if (location.pathname === '/watch') {
      startChatIframePolling();
    } else if (chatSyncInterval) {
      clearInterval(chatSyncInterval);
      chatSyncInterval = null;
    }
  });

  document.addEventListener('yt-page-data-updated', updateTheaterClass);

  // Poll until ytd-app and ytd-watch-flexy are ready on initial load
  function waitForElements() {
    const app = document.querySelector('ytd-app');
    const watchFlexy = document.querySelector('ytd-watch-flexy');

    if (app) updateTheaterClass();
    if (watchFlexy) attachWatchObserver();
    if (!app || (location.pathname === '/watch' && !watchFlexy)) {
      setTimeout(waitForElements, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForElements);
  } else {
    waitForElements();
  }

  window.addEventListener('load', () => {
    if (location.pathname === '/watch') {
      startChatIframePolling();
    }
  });
})();
