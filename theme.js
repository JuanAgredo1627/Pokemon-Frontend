// Paleta centralizada por tipo: [principal, secundario, texto sobre el principal].
const DARK = "#1b1b2e", LIGHT = "#ffffff";
export const TYPE_COLORS = {
  normal: ["#A8A878", "#C6C6A7", DARK], fire: ["#F08030", "#F5AC78", DARK],
  water: ["#6890F0", "#9DB7F5", DARK], electric: ["#F8D030", "#FAE078", DARK],
  grass: ["#78C850", "#A7DB8D", DARK], ice: ["#98D8D8", "#BCE6E6", DARK],
  fighting: ["#C03028", "#D67873", LIGHT], poison: ["#A040A0", "#C183C1", LIGHT],
  ground: ["#E0C068", "#EBD69D", DARK], flying: ["#A890F0", "#C6B7F5", DARK],
  psychic: ["#F85888", "#FA92B2", DARK], bug: ["#A8B820", "#C6D16E", DARK],
  rock: ["#B8A038", "#D1C17D", DARK], ghost: ["#705898", "#A292BC", LIGHT],
  dragon: ["#7038F8", "#A27DFA", LIGHT], dark: ["#705848", "#A29288", LIGHT],
  steel: ["#B8B8D0", "#D1D1E0", DARK], fairy: ["#EE99AC", "#F4BDC9", DARK],
};
const NEUTRAL = ["#9AA3B2", "#C9CEDA", DARK];

export const TYPE_ES = {
  normal: "Normal", fire: "Fuego", water: "Agua", electric: "Eléctrico", grass: "Planta",
  ice: "Hielo", fighting: "Lucha", poison: "Veneno", ground: "Tierra", flying: "Volador",
  psychic: "Psíquico", bug: "Bicho", rock: "Roca", ghost: "Fantasma", dragon: "Dragón",
  dark: "Siniestro", steel: "Acero", fairy: "Hada",
};

export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");
export const pad = (n) => String(n).padStart(3, "0");
export const typeInfo = (t) => TYPE_COLORS[t] ?? NEUTRAL;

// Dos tipos: principal = 1.º, secundario = 2.º. Un tipo: su tono claro. Sin datos: neutra.
export function applyTheme(types = []) {
  const a = TYPE_COLORS[types[0]] ?? NEUTRAL;
  const b = TYPE_COLORS[types[1]];
  const root = document.documentElement.style;
  root.setProperty("--c1", a[0]);
  root.setProperty("--c2", b ? b[0] : a[1]);
  root.setProperty("--ink", a[2]);
  document.querySelector('meta[name="theme-color"]').content = a[0];
}
