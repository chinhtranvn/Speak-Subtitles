import { getConfig, setConfig } from "./storage.js";

const el = id => document.getElementById(id);
const inputs = [
  "apiKey",
  "language",
  "translate",
  "voice",
  "pitch",
  "volume",
  "speechRate",
  "minRate",
  "maxRate"
];

(async function load() {
  const cfg = await getConfig();
  inputs.forEach(k => {
    if (typeof cfg[k] === "boolean") el(k).checked = cfg[k];
    else el(k).value = cfg[k];
  });
  await loadVoices(cfg.language, cfg.apiKey, cfg.voice);
})();

el("language").addEventListener("change", async e => {
  const cfg = await getConfig();
  await loadVoices(e.target.value, cfg.apiKey, cfg.voice);
});

el("save").addEventListener("click", async () => {
  const cfg = await getConfig();
  inputs.forEach(k => {
    cfg[k] = typeof cfg[k] === "boolean" ? el(k).checked : el(k).value;
  });
  await setConfig(cfg);
});

async function loadVoices(language, apiKey, selected) {
  const res = await fetch(
    "https://texttospeech.googleapis.com/v1/voices?languageCode=" +
      language +
      "&key=" +
      apiKey
  );
  const { voices } = await res.json();
  const select = el("voice");
  select.innerHTML = "";
  voices.forEach(v => {
    const o = document.createElement("option");
    o.value = v.name;
    o.textContent = `${v.name} (${v.ssmlGender})`;
    if (v.name === selected) o.selected = true;
    select.appendChild(o);
  });
}
