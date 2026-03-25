// ==UserScript==
// @name         Macindows — YouTube Theater Fix
// @namespace    Lerakei-0
// @version      1.0.0
// @description  Removes theater-mode dark masthead when navigating away from watch page
// @match        https://www.youtube.com/*
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  function fixMasthead() {
    const isWatchPage = location.pathname === '/watch';
    const masthead = document.querySelector('#masthead, ytd-masthead');
    if (!masthead) return;

    if (!isWatchPage) {
      // Force parchment background directly when not on watch page
      masthead.style.setProperty('background-color', '#fff9ec', 'important');
      masthead.style.setProperty('border-bottom-color', '#000000', 'important');
    } else {
      // Let CSS take over on watch page
      masthead.style.removeProperty('background-color');
      masthead.style.removeProperty('border-bottom-color');
    }
  }

  // YouTube is a SPA — hook into navigation events
  document.addEventListener('yt-navigate-finish', fixMasthead);
  document.addEventListener('yt-page-data-updated', fixMasthead);

  // Also run on initial load
  window.addEventListener('load', fixMasthead);
})();
