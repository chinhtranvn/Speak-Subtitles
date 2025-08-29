export const DEFAULTS = {
  apiKey: "",
  language: "vi-VN",
  translate: false,
  voice: "vi-VN-Standard-A",
  pitch: 0,
  volume: 1,
  speechRate: 1,
  minRate: 0.75,
  maxRate: 1.25,
  enabled: false
};

export const getConfig = () =>
  new Promise(resolve => chrome.storage.sync.get(DEFAULTS, resolve));

export const setConfig = config =>
  new Promise(resolve => chrome.storage.sync.set(config, resolve));
