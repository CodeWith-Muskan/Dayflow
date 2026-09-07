// Soft dreamy palette. Keys are shared with the backend Category model.
// Each key resolves to day and night specific hex values.
export const CATEGORY_COLOR_KEYS = [
  "lavender",
  "blue",
  "sage",
  "peach",
  "rose",
  "yellow",
  "aqua",
];

export const CATEGORY_COLORS = {
  lavender: { day: "#C9C2E8", night: "#A78BFA" },
  blue: { day: "#BFD8EA", night: "#7BA7D8" },
  sage: { day: "#C8DCCB", night: "#7FB69A" },
  peach: { day: "#EBCFC2", night: "#C99B8A" },
  rose: { day: "#E5C7D0", night: "#D89AB3" },
  yellow: { day: "#E8DDAF", night: "#C9BA78" },
  aqua: { day: "#BFDEDA", night: "#6FB5B0" },
};

export const resolveColor = (key, theme) => {
  const palette = CATEGORY_COLORS[key] || CATEGORY_COLORS.lavender;
  return palette[theme === "night" ? "night" : "day"];
};

export const fallbackColor = "lavender";