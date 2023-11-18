// content.js
if (window.location.href.startsWith("https://open.spotify.com/playlist")) {
  // Execute code to display the popup here

  chrome.runtime.sendMessage({ action: "showPopup" });
}
