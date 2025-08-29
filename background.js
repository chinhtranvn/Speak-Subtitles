import { getConfig, setConfig } from "./storage.js";
import { synthesize } from "./tts.js";

function buildIcon(char) {
  const canvas = new OffscreenCanvas(128, 128);
  const ctx = canvas.getContext("2d");
  ctx.font = "96px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";
  ctx.fillText(char, 64, 64);
  return { 128: ctx.getImageData(0, 0, 128, 128) };
}

async function updateIcon(enabled, tabId) {
  const imageData = buildIcon(enabled ? "🔊" : "🔇");
  const details = { imageData };
  if (tabId !== undefined) details.tabId = tabId;
  await chrome.action.setIcon(details);
}

(async () => {
  const cfg = await getConfig();
  updateIcon(cfg.enabled);
})();

chrome.action.onClicked.addListener(async tab => {
  const cfg = await getConfig();
  cfg.enabled = !cfg.enabled;
  await setConfig(cfg);
  chrome.tabs.sendMessage(tab.id, {
    type: "toggle",
    enabled: cfg.enabled
  });
  updateIcon(cfg.enabled, tab.id);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "tts") {
    synthesize(msg.text, msg.settings).then(sendResponse);
    return true; // keep channel open for async
  }
});
