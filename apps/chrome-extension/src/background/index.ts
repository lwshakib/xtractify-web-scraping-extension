/**
 * background/index.ts — Xtractify Service Worker
 *
 * This is the extension's background service worker. It runs persistently
 * (in the background) and handles extension lifecycle events.
 *
 * Currently its sole responsibility is configuring the side panel behavior:
 * when the user clicks the Xtractify toolbar icon, the side panel opens
 * automatically instead of requiring a right-click or manual action.
 *
 * The `onInstalled` listener fires when the extension is first installed,
 * updated to a new version, or when Chrome itself is updated.
 */
chrome.runtime.onInstalled.addListener(() => {
  // Configure the side panel to open when the user clicks the extension's
  // action icon in the toolbar. Without this, the user would need to
  // manually open the side panel from the browser's side panel menu.
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) =>
      console.error("Failed to set side panel behavior:", error)
    )
})
