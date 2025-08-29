import { getConfig, setConfig } from "./storage.js";
import { synthesize } from "./tts.js";

const ICON_OFF =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iYmxhY2siPjxwYXRoIGQ9Ik0xNi41IDEyYzAtMS43Ny0xLTMuMjktMi41LTQuMDN2Mi41MmwyLjUgMi41YzAtLjI4LjA0LS41NS4wNC0uODN6TTMgOXY2aDRsNSA1VjRsLTUgNUgzem0xMy41IDNjMCAuMjgtLjA0LjU1LS4wNC44M2wyLjI4IDIuMjhDMjAuMjYgMTQuNTggMjEgMTMuMzUgMjEgMTJzLS43NC0yLjU4LTEuOTYtMy4xMWwtMS42NiAxLjY2Yy42LjcyLjk2IDEuNjMuOTYgMi42NXptLTYuMDctNi4wN3YyLjA2Yy44OS4zOSAxLjY1IDEuMDggMi4xNCAxLjkzbDEuNDYtMS40NmMtLjY2LTEuNDctMS45LTIuNjEtMy4zOS0zLjEzeiIvPjwvc3ZnPg==";
const ICON_ON =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iYmxhY2siPjxwYXRoIGQ9Ik0zIDl2Nmg0bDUgNVY0TDcgOUgzem0xMS41IDNjMC0xLjc3LTEtMy4yOS0yLjUtNC4wM3Y4LjA2YzEuNS0uNzQgMi41LTIuMjYgMi41LTQuMDN6TTE0IDMuMjN2Mi4wNmMyLjg5Ljg2IDUgMy41NCA1IDYuNzFzLTIuMTEgNS44NS01IDYuNzF2Mi4wNmM0LjAxLS45MSA3LTQuNDkgNy04Ljc3cy0yLjk5LTcuODYtNy04Ljc3eiIvPjwvc3ZnPg==";

chrome.action.onClicked.addListener(async tab => {
  const cfg = await getConfig();
  cfg.enabled = !cfg.enabled;
  await setConfig(cfg);
  chrome.tabs.sendMessage(tab.id, {
    type: "toggle",
    enabled: cfg.enabled
  });
  chrome.action.setIcon({
    tabId: tab.id,
    path: {
      128: cfg.enabled ? ICON_ON : ICON_OFF,
    },
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "tts") {
    synthesize(msg.text, msg.settings).then(sendResponse);
    return true; // keep channel open for async
  }
});
