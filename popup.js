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
  const data = await res.json();
  const voices = data.voices || [];
  const select = el("voice");
  select.innerHTML = "";
  if (voices.length === 0) {
    const o = document.createElement("option");
    o.textContent = "No voices";
    select.appendChild(o);
    return;
  }
  voices.forEach(v => {
    const o = document.createElement("option");
    o.value = v.name;
    o.textContent = `${v.name} (${v.ssmlGender})`;
    if (v.name === selected) o.selected = true;
    select.appendChild(o);
  });
}
