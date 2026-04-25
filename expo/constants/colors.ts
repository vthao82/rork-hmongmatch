const palette = {
  indigo: "#1a0a3c",
  indigoDeep: "#0f061f",
  indigoSoft: "#2a1556",
  crimson: "#c0152f",
  crimsonLight: "#e0304a",
  gold: "#d4a843",
  goldLight: "#e8c26a",
  offwhite: "#f5f0eb",
  ink: "#0c0719",
};

const Colors = {
  ...palette,

  primary: palette.crimson,
  primaryDark: "#8f0e22",
  accent: palette.gold,
  accentLight: palette.goldLight,

  background: "#FFFFFF",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  text: "#1a1a1f",
  textSecondary: "#6b6b75",
  textTertiary: "#a5a5b0",
  border: "#ececee",
  borderLight: "#f1f1f3",
  tabInactive: "#9a9aa5",

  like: "#2fc071",
  nope: "#ff4b5c",
  superLike: palette.gold,
  online: "#2fc071",

  dark: {
    bg: palette.ink,
    bgSoft: "#16102a",
    surface: "#1c1534",
    border: "rgba(255,255,255,0.12)",
    borderStrong: "rgba(255,255,255,0.22)",
    text: palette.offwhite,
    textDim: "rgba(245,240,235,0.68)",
    textFaint: "rgba(245,240,235,0.42)",
  },

  light: {
    text: "#000",
    background: "#fff",
    tint: palette.crimson,
    tabIconDefault: "#ccc",
    tabIconSelected: palette.crimson,
  },
};

export default Colors;
