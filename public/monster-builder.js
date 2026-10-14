(() => {
  "use strict";
  const rules = window.MonsterRules;
  const token = window.GairosMonsterToken;
  if (!rules || !token) return;
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const field = (key, label, type = "number", extra = "") => `<label class="monster-field">${label}<input name="${key}" type="${type}" ${type === "number" ? 'step="any"' : ""} ${extra}></label>`;
  const dialog = document.createElement("dialog");
  dialog.className = "monster-dialog";
  dialog.setAttribute("aria-labelledby", "monster-title");
  dialog.innerHTML = `
    <form class="monster-workshop">
      <header class="monster-header"><div><span class="monster-eyebrow">DM WORKSHOP</span><h2 id="monster-title">Monster builder</h2><p>Start with a baseline. Make the creature your own.</p></div><button type="button" data-action="close" aria-label="Close monster builder">✕</button></header>
      <div class="monster-layout">
        <div class="monster-editor">
          <section><h3>Creature & baseline</h3>
            ${field("name", "Name", "text", 'required maxlength="120" placeholder="e.g. Ashwood stalker"')}
            <div class="monster-grid">${field("creatureType", "Creature type", "text", 'placeholder="Beast, undead, construct…"')}<label class="monster-field">Challenge rating<select name="cr"></select></label></div>
            <button type="button" data-action="baseline" class="monster-secondary">Apply CR baseline</button>
            <p class="monster-help" id="monster-baseline-note"></p>
            <div class="monster-grid">${field("averageSkillBonus", "Default skill bonus", "number", 'placeholder="Choose a baseline"')}${field("hp", "Hit points", "number", 'required min="1"')}${field("mana", "Mana", "number", 'min="0"')}${field("ac", "Armor class")}${field("attackBonus", "Attack bonus")}${field("saveDc", "Save DC")}${field("speed", "Speed (feet)", "number", 'min="0"')}${field("reach", "Reach (feet)", "number", 'min="0"')}</div>
            <p class="monster-help">The default skill bonus fills skills without a custom value. Hit points and mana are set by you.</p>
          </section>
          <section><h3>Size & identity</h3><div class="monster-grid"><label class="monster-field">Size<select name="size"><option value="auto">Automatic from statblock</option></select></label>${field("spaceFeet", "Space (feet)", "number", 'min="0" placeholder="Optional"')}${field("heightFeet", "Height / length (feet)", "number", 'min="0" placeholder="Optional"')}</div>
            <p class="monster-help" id="monster-size-note"></p>
            <label class="monster-field">Appearance<textarea name="description" rows="3" maxlength="4000" placeholder="Describe its face, silhouette, colors, and defining features."></textarea></label>
            <label class="monster-field">Attacks<textarea name="attacks" rows="3" maxlength="6000" placeholder="Attack name, damage, range, and effects"></textarea></label>
            <label class="monster-field">Traits & abilities<textarea name="traits" rows="3" maxlength="6000" placeholder="Senses, resistances, special actions…"></textarea></label>
          </section>
          <details class="monster-skills" open><summary>All 28 skills <span>Custom bonuses override the baseline</span></summary><div id="monster-skill-inputs"></div></details>
        </div>
        <aside class="monster-preview-column">
          <section class="monster-token-section"><h3>Creature token</h3><div class="monster-token-display"><canvas width="512" height="512" aria-label="Monster token preview"></canvas><img class="monster-saved-token" alt="Saved monster token" hidden></div>
            <button type="button" data-action="generate">Generate artwork</button><p class="monster-help" id="monster-image-note">One image per click, using your configured OpenAI key.</p>
            <label class="monster-field">Or upload artwork<input name="artwork" type="file" accept="image/png,image/jpeg,image/webp"></label>
            <details><summary>Adjust framing & ring</summary><div class="monster-framing">
              <label class="monster-field">Zoom<input name="zoom" type="range" min="0.6" max="2.5" step="0.01" value="1"></label>
              <label class="monster-field">Horizontal position<input name="offsetX" type="range" min="-40" max="40" value="0"></label>
              <label class="monster-field">Vertical position<input name="offsetY" type="range" min="-40" max="40" value="0"></label>
              ${field("ringColor", "Ring color", "color", 'value="#bd965a"')}
              <button type="button" data-action="center" class="monster-secondary">Auto-center artwork</button>
              <button type="button" data-action="download" class="monster-secondary">Download token PNG</button>
            </div></details>
          </section>
          <article class="monster-statblock" aria-label="Statblock preview"></article>
        </aside>
      </div>
      <footer class="monster-footer"><p class="monster-status" role="status" aria-live="polite"></p><button type="button" data-action="close" class="monster-secondary">Cancel</button><button type="submit">Save monster</button></footer>
    </form>`;
  document.body.appendChild(dialog);
  const form = dialog.querySelector("form");
  const input = (name) => form.elements.namedItem(name);
  const action = (name) => dialog.querySelector(`[data-action="${name}"]`);
  const canvas = dialog.querySelector("canvas");
  const savedImage = dialog.querySelector(".monster-saved-token");
  const status = dialog.querySelector(".monster-status");
  let current = null, artwork = null, savedToken = "", saveHandler = null, permitted = () => false;
  let generation = 0, configuration = 0, busy = false, imageAvailable = false, validationError = false, previousFocus = null;

  function message(text, error = false) { status.textContent = text; status.classList.toggle("monster-error", error); }
  function setBusy(value) {
    busy = value;
    action("generate").disabled = busy || !imageAvailable;
    input("artwork").disabled = busy;
    form.querySelector('[type="submit"]').disabled = busy;
  }
  function skillName(skill) { return typeof skill === "string" ? skill : skill.key; }
  const skillList = rules.skills.map(skillName);
  const crValues = rules.averages.map((row) => row.cr);
  input("cr").innerHTML = crValues.map((cr) => `<option value="${escape(cr)}">${escape(cr)}</option>`).join("");
  input("size").insertAdjacentHTML("beforeend", rules.sizes.map((size) => `<option value="${escape(size.key)}">${escape(size.label)}</option>`).join(""));
  dialog.querySelector("#monster-skill-inputs").innerHTML = `<div class="monster-grid">${skillList.map((skill) => field(`skill:${skill}`, skill.replace(/\b\w/g, (c) => c.toUpperCase()), "number", 'placeholder="Default"')).join("")}</div>`;

  function read() {
    const value = { ...current, skills: {} };
    for (const key of ["name", "creatureType", "cr", "size", "description", "attacks", "traits"]) value[key] = input(key).value;
    for (const key of ["averageSkillBonus", "hp", "mana", "ac", "attackBonus", "saveDc", "speed", "reach"]) value[key] = input(key).value === "" ? null : Number(input(key).value);
    value.space = input("spaceFeet").value;
    value.height = input("heightFeet").value;
    skillList.forEach((skill) => { if (input(`skill:${skill}`).value !== "") value.skills[skill] = Number(input(`skill:${skill}`).value); });
    return rules.normalizeMonster(value);
  }

  function fill(monster) {
    current = monster;
    for (const key of ["name", "creatureType", "cr", "size", "description", "attacks", "traits", "averageSkillBonus", "hp", "mana", "ac", "attackBonus", "saveDc", "speed", "reach"]) input(key).value = monster[key] ?? "";
    input("spaceFeet").value = monster.space ?? "";
    input("heightFeet").value = monster.height ?? "";
    const defaults = rules.normalizeMonster({ ...monster, skills: {} });
    skillList.forEach((skill) => {
      const value = monster.skills?.[skill];
      input(`skill:${skill}`).value = value === defaults.skills[skill] ? "" : value ?? "";
    });
    update();
  }

  function update() {
    let monster;
    try { monster = read(); } catch (error) { validationError = true; message(error.message, true); return; }
    if (validationError) { validationError = false; message(""); }
    const defaults = rules.normalizeMonster({ ...monster, skills: {} });
    skillList.forEach((skill) => { input(`skill:${skill}`).placeholder = defaults.skills[skill] ?? "Default"; });
    const size = rules.inferSize(monster);
    dialog.querySelector("#monster-size-note").textContent = `${size.label || size.size} · ${size.reason}`;
    dialog.querySelector("#monster-baseline-note").innerHTML = `Values from the <a href="${rules.sources.averages.url}" target="_blank" rel="noopener">CR Balancer</a>. Its ‘average stat’ column is blank, so average save supplies the initial skill baseline. You can change every value.`;
    const bonus = (value) => value === null || value === undefined ? "—" : Number(value) >= 0 ? `+${value}` : String(value);
    const stat = (label, value) => `<div><dt>${label}</dt><dd>${escape(value ?? "—")}</dd></div>`;
    dialog.querySelector(".monster-statblock").innerHTML = `<span class="monster-eyebrow">STATBLOCK PREVIEW</span><h3>${escape(monster.name || "Unnamed creature")}</h3><p>${escape(size.label || size.size)} ${escape(monster.creatureType || "creature")} · CR ${escape(monster.cr)}</p><dl class="monster-stat-grid">${stat("HP", monster.hp)}${stat("AC", monster.ac)}${stat("Mana", monster.mana)}${stat("Speed", `${monster.speed} ft`)}${stat("Attack", bonus(monster.attackBonus))}${stat("Save DC", monster.saveDc)}</dl>${monster.attacks ? `<h4>Attacks</h4><p class="monster-prose">${escape(monster.attacks)}</p>` : ""}${monster.traits ? `<h4>Traits</h4><p class="monster-prose">${escape(monster.traits)}</p>` : ""}<h4>Skills</h4><dl class="monster-skill-preview">${skillList.map((skill) => stat(skill, bonus(monster.skills[skill]))).join("")}</dl>`;
  }

  function renderToken() {
    savedImage.hidden = !savedToken || Boolean(artwork);
    canvas.hidden = !savedImage.hidden;
    if (!savedImage.hidden) savedImage.src = savedToken;
    token.draw(canvas, artwork, { zoom: input("zoom").value, x: input("offsetX").value, y: input("offsetY").value, color: input("ringColor").value });
  }
  function center() { input("zoom").value = 1; input("offsetX").value = 0; input("offsetY").value = 0; renderToken(); }
  async function useArtwork(url, ticket) {
    const loaded = await token.load(url);
    if (ticket !== generation || !dialog.open) return false;
    artwork = loaded; savedToken = ""; center();
    return true;
  }
  function tokenData() { return artwork ? canvas.toDataURL("image/png") : savedToken; }
  function close() {
    if (busy) { message("Wait for the current operation to finish before closing."); return; }
    generation += 1; configuration += 1; dialog.close(); previousFocus?.focus();
  }
  dialog.querySelectorAll('[data-action="close"]').forEach((button) => button.addEventListener("click", close));
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); close(); });
  form.addEventListener("input", (event) => {
    if (["zoom", "offsetX", "offsetY", "ringColor"].includes(event.target.name)) renderToken();
    else update();
  });
  action("baseline").addEventListener("click", () => {
    const cr = input("cr").value;
    const baseline = rules.createMonster(cr, { averageSkillBonus: rules.averageFor(cr).averageSave });
    // Only these combat defaults are reset; the creature's identity and text survive.
    for (const key of ["ac", "attackBonus", "saveDc", "averageSkillBonus"]) input(key).value = baseline[key] ?? "";
    skillList.forEach((skill) => { input(`skill:${skill}`).value = ""; });
    update(); message("CR baseline applied. Review your skill bonuses before saving.");
  });
  action("center").addEventListener("click", center);
  action("download").addEventListener("click", () => {
    const data = tokenData();
    if (!data) { message("Generate or upload artwork first.", true); return; }
    const link = document.createElement("a"); link.href = data; link.download = `${input("name").value.replace(/[^\w-]+/g, "-") || "monster"}-token.png`; link.click();
  });
  input("artwork").addEventListener("change", async () => {
    const file = input("artwork").files[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) { message("Choose an image smaller than 12 MB.", true); return; }
    const ticket = ++generation;
    const url = URL.createObjectURL(file);
    setBusy(true);
    try { if (await useArtwork(url, ticket)) message("Artwork centered with its visible features inside the ring."); }
    catch (error) { if (ticket === generation) message(error.message, true); }
    finally { URL.revokeObjectURL(url); if (ticket === generation) setBusy(false); }
  });
  action("generate").addEventListener("click", async () => {
    if (busy || !permitted() || !imageAvailable) return;
    let monster;
    try { monster = read(); } catch (error) { message(error.message, true); return; }
    if (!monster.name && !monster.description) { message("Add a name or appearance before generating artwork.", true); return; }
    const ticket = ++generation;
    setBusy(true);
    message("Generating one image. This can take a few minutes…");
    try {
      const response = await fetch("/api/dm/monster-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: monster.name, description: monster.description, statblock: rules.toManualText(monster) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Image generation failed.");
      if (await useArtwork(result.imageDataUrl, ticket)) message("Token ready. Auto-centering preserves the visible subject; adjust framing if desired.");
    } catch (error) { if (ticket === generation) message(error.message || "Could not generate artwork.", true); }
    finally { if (ticket === generation) setBusy(false); }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || !permitted()) return;
    let monster;
    try { monster = read(); } catch (error) { message(error.message, true); return; }
    if (skillList.some((skill) => monster.skills[skill] === null || monster.skills[skill] === undefined)) { message("Set a default skill bonus or fill every skill before saving.", true); input("averageSkillBonus").focus(); return; }
    const ticket = ++generation;
    setBusy(true);
    try {
      await saveHandler({ id: current.id, mode: "generated", name: monster.name, monster, tokenImage: tokenData() });
      if (ticket === generation) { setBusy(false); message("Monster saved."); close(); }
    }
    catch (error) { if (ticket === generation) message(error.message || "Could not save this monster.", true); }
    finally { if (ticket === generation) setBusy(false); }
  });
  window.GairosMonsterBuilder = {
    configure({ onSave, isDm }) { saveHandler = onSave; permitted = isDm; },
    async open(statblock) {
      if (!permitted() || dialog.open) return;
      previousFocus = document.activeElement;
      generation += 1; artwork = null; savedToken = statblock?.tokenImage || "";
      const configTicket = ++configuration;
      imageAvailable = false; validationError = false;
      form.reset(); setBusy(false); message("");
      dialog.querySelector("#monster-image-note").textContent = "Checking image generation availability…";
      fill({ ...(statblock?.monster ? rules.normalizeMonster(statblock.monster) : rules.createMonster(1, { averageSkillBonus: rules.averageFor(1).averageSave })), id: statblock?.id });
      center(); dialog.showModal();
      input("name").focus();
      try {
        const response = await fetch("/api/dm/monster-image");
        const config = await response.json();
        if (configTicket !== configuration || !dialog.open) return;
        imageAvailable = response.ok && Boolean(config.available);
        setBusy(busy);
        dialog.querySelector("#monster-image-note").textContent = response.ok ? config.available ? `One image per click · ${config.model}` : "Set OPENAI_API_KEY in the server’s .env file to generate artwork. Uploads are available now." : "Open the DM gateway to enable image generation. Uploads are available now.";
      } catch (_) {
        if (configTicket !== configuration || !dialog.open) return;
        imageAvailable = false; setBusy(busy);
        dialog.querySelector("#monster-image-note").textContent = "Image service unavailable. You can still upload artwork.";
      }
    },
    syncRole() { if (dialog.open && !permitted()) { generation += 1; configuration += 1; imageAvailable = false; setBusy(false); dialog.close(); } },
  };
})();
