// background.js
chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: showPopup,
    });
  });
  
  function showPopup(tab) {
    chrome.action.setPopup({ tabId: tab.id, popup: "popup.html" });
  }
  