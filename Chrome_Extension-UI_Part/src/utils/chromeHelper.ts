export const closeExtensionTab = () => {
  if (typeof chrome !== "undefined" && chrome.tabs) {
    // Get the current tab (the popup or extension tab)
    chrome.tabs.getCurrent((tab) => {
      if (tab && tab.id) {
        chrome.tabs.remove(tab.id);
      } else {
        // Fallback: try to query the active tab of the extension
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length) {
            chrome.tabs.remove(tabs[0].id!);
          }
        });
      }
    });
  } else {
    // Not in a Chrome extension environment; just navigate to root if possible
    console.warn("closeExtensionTab called outside of Chrome extension context");
  }
};
