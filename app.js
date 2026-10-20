import { listAll, getDetail, peekDetail } from "./api.js";
import { applyTheme, typeInfo, TYPE_ES, cap, pad } from "./theme.js";

const $ = (s) => document.querySelector(s);
const view = $("#view"), nav = $("#nav"), prevBtn = $("#prev"), nextBtn = $("#next");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const state = { list: [], current: null, busy: false, token: 0, q: "", type: "" };
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const filtered = () => {
  const q = norm(state.q.trim()), num = q.replace(/^#/, "").replace(/^0+(?=\d)/, "");
  return state.list.filter((p) => (!state.type || p.types?.includes(state.type)) && (!q || norm(p.name).includes(q) || String(p.id) === num));
};
// Lista sobre la que se navega: la filtrada si el Pokémon actual está en ella; si no, el catálogo completo.
const pool = () => { const f = filtered(); return f.some((p) => p.id === state.current) ? f : state.list; };

const STATS = [["hp", "HP"], ["attack", "Ataque"], ["defense", "Defensa"], ["specialAttack", "At. Esp."], ["specialDefense", "Def. Esp."], ["speed", "Velocidad"]];

const chips = (types) => (types ?? []).map((t) => {
  const [c, , ink] = typeInfo(t);
  return `<span class="chip" style="background:${c};color:${ink}">${esc(TYPE_ES[t] ?? cap(t))}</span>`;
}).join("");

/* ---------- Catálogo ---------- */
async function showCatalog() {
  state.token++; state.current = null;
  nav.hidden = true; applyTheme([]);
  if (!state.list.length) {
    view.innerHTML = `<div class="state" role="status"><div class="ball spin"></div><p id="msg">Cargando Pokédex…</p></div>`;
    try {
      state.list = await listAll(() => { const m = $("#msg"); if (m) m.textContent = "El servidor está despertando, esto puede tardar hasta un minuto…"; });
    } catch {
      view.innerHTML = `<div class="state" role="alert"><p>No se pudo conectar con el backend.</p><button class="btn" id="retry">Reintentar</button></div>`;
      $("#retry").onclick = showCatalog; return;
    }
  }
  if (!state.list.length) { view.innerHTML = `<div class="state"><p>No hay Pokémon para mostrar.</p></div>`; return; }
  const types = [...new Set(state.list.flatMap((p) => p.types ?? []))].sort((a, b) => (TYPE_ES[a] ?? a).localeCompare(TYPE_ES[b] ?? b, "es"));
  view.innerHTML = `
    <div class="tools" role="search">
      <input id="q" type="search" placeholder="Buscar por nombre o número" aria-label="Buscar Pokémon por nombre o número" autocomplete="off" value="${esc(state.q)}">
      <select id="type" aria-label="Filtrar por tipo"><option value="">Todos los tipos</option>
        ${types.map((t) => `<option value="${esc(t)}"${t === state.type ? " selected" : ""}>${esc(TYPE_ES[t] ?? cap(t))}</option>`).join("")}</select>
      <p id="count" class="count" role="status"></p>
    </div>
    <div id="results"></div>`;
  $("#q").oninput = (e) => { state.q = e.target.value; renderGrid(); };
  $("#type").onchange = (e) => { state.type = e.target.value; renderGrid(); };
  renderGrid();
  window.scrollTo(0, 0);
}

function renderGrid() {
  const items = filtered();
  $("#count").textContent = items.length === state.list.length ? `${items.length} Pokémon` : `${items.length} de ${state.list.length}`;
  $("#results").innerHTML = items.length ? `<ul class="grid">${items.map((p) => `
    <li><a class="tile" href="#/p/${p.id}" style="--t:${typeInfo(p.types?.[0])[0]}" aria-label="${esc(cap(p.name))}, número ${p.id}">
      <span class="num">#${pad(p.id)}</span>
      ${p.sprite ? `<img src="${esc(p.sprite)}" alt="" loading="lazy" width="96" height="96">` : `<span class="noimg"></span>`}
      <span class="nm">${esc(cap(p.name))}</span></a></li>`).join("")}</ul>`
    : `<div class="state"><p>No hay Pokémon que coincidan.</p><button class="btn" id="clear">Limpiar filtros</button></div>`;
  $("#clear")?.addEventListener("click", () => { state.q = ""; state.type = ""; $("#q").value = ""; $("#type").value = ""; renderGrid(); });
}

/* ---------- Ficha ---------- */
function cardHTML(s, d) {
  const art = d?.sprites?.artworkOfficial || s.artwork || s.sprite;
  const body = d ? detailBody(d) : `<div class="skeleton"></div><div class="skeleton short"></div>`;
  return `
  <article class="card" aria-live="polite">
    <header class="hero">
      <span class="bigid" aria-hidden="true">${pad(s.id)}</span>
      <div class="art">${art ? `<img src="${esc(art)}" alt="Ilustración de ${esc(cap(s.name))}" width="475" height="475" decoding="async">` : `<div class="ball"></div>`}</div>
      <div class="plate"><span class="id">#${pad(s.id)}</span><h1>${esc(cap(s.name))}</h1>${s.genus ? `<p>${esc(s.genus)}</p>` : ""}</div>
      <div class="chips">${chips(s.types)}</div>
    </header>
    <div class="body">${body}</div>
  </article>`;
}

function detailBody(d) {
  const facts = [];
  if (d.height != null) facts.push(["Altura", `${(d.height / 10).toFixed(1)} m`]);
  if (d.weight != null) facts.push(["Peso", `${(d.weight / 10).toFixed(1)} kg`]);
  if (d.baseExperience != null) facts.push(["Exp. base", d.baseExperience]);
  if (d.captureRate != null) facts.push(["Captura", d.captureRate]);
  const evo = [...(d.evolvesFrom ? [["Evoluciona de", [d.evolvesFrom]]] : []), ...(d.evolvesTo?.length ? [["Evoluciona a", d.evolvesTo]] : [])];
  return `
    ${d.flavorText ? `<p class="flavor">${esc(d.flavorText.replace(/[\n\f]/g, " "))}</p>` : ""}
    ${facts.length ? `<dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
    ${d.abilities?.length ? `<section><h2>Habilidades</h2><ul class="tags">${d.abilities.map((a) => `<li>${esc(cap(a.name.replace(/-/g, " ")))}${a.isHidden ? " <small>(oculta)</small>" : ""}</li>`).join("")}</ul></section>` : ""}
    ${d.stats ? `<section><h2>Estadísticas</h2>${STATS.filter(([k]) => d.stats[k] != null).map(([k, l]) => `
      <div class="stat"><span>${l}</span><b>${d.stats[k]}</b><i><u style="width:${Math.min(100, (d.stats[k] / 255) * 100)}%"></u></i></div>`).join("")}</section>` : ""}
    ${evo.map(([t, arr]) => `<section><h2>${t}</h2><ul class="tags">${arr.map((e) => `<li><a href="#/p/${e.id}">#${pad(e.id)} ${esc(cap(e.name))}</a></li>`).join("")}</ul></section>`).join("")}`;
}

function setBusy(b) {
  state.busy = b;
  prevBtn.disabled = nextBtn.disabled = b;
  nav.classList.toggle("loading", b);
}

async function showPokemon(id, prevId = state.current) {
  const s = state.list.find((p) => p.id === id);
  if (!s) { location.replace("#/"); return; }
  state.current = id;
  const list = pool(), idx = list.findIndex((p) => p.id === id);
  const dir = prevId == null ? 0 : (id > prevId ? 1 : -1);
  const token = ++state.token;

  applyTheme(s.types);
  nav.hidden = false; $("#pos").textContent = `${idx + 1} / ${list.length}`;
  prevBtn.querySelector("small").textContent = cap(list[(idx - 1 + list.length) % list.length].name);
  nextBtn.querySelector("small").textContent = cap(list[(idx + 1) % list.length].name);

  const cached = peekDetail(id);
  view.innerHTML = cardHTML(s, cached);
  view.firstElementChild.style.setProperty("--dir", dir);
  window.scrollTo(0, 0);
  if (cached) { setBusy(false); return; }

  setBusy(true);
  try {
    const d = await getDetail(id, () => { if (token === state.token) view.querySelector(".body")?.setAttribute("data-wait", "El servidor está despertando…"); });
    if (token !== state.token) return;
    view.querySelector(".body").innerHTML = detailBody(d);
    applyTheme(d.types?.length ? d.types : s.types);
  } catch {
    if (token !== state.token) return;
    view.querySelector(".body").innerHTML = `<div class="state" role="alert"><p>No se pudieron cargar los datos de ${esc(cap(s.name))}.</p><button class="btn" id="retry">Reintentar</button></div>`;
    $("#retry").onclick = () => showPokemon(id);
  } finally {
    if (token === state.token) setBusy(false);
  }
}

/* ---------- Navegación ---------- */
function step(delta) {
  if (state.busy || state.current == null) return;
  const list = pool(), i = list.findIndex((p) => p.id === state.current);
  const n = (i + delta + list.length) % list.length; // navegación circular dentro del filtro activo
  location.replace(`#/p/${list[n].id}`);
}
prevBtn.onclick = () => step(-1);
nextBtn.onclick = () => step(1);
$("#home").onclick = () => { location.hash = "#/"; };
addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); });

async function route() {
  const m = location.hash.match(/^#\/p\/(\d+)$/);
  if (!m) return showCatalog();
  if (!state.list.length) await showCatalog();
  if (state.list.length) showPokemon(Number(m[1]));
}
addEventListener("hashchange", route);
route();

if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
