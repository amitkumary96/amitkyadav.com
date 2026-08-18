/**
 * Colours and type resolve to the CSS custom properties defined in
 * src/styles/global.css. Dark mode therefore lives in exactly one place — the
 * `.dark` token block — instead of being duplicated as a `dark:` variant on
 * every element that carries a colour.
 */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-faint": "var(--ink-faint)",
        rule: "var(--rule)",
        "rule-firm": "var(--rule-firm)",
        madder: "var(--madder)",
        "madder-ink": "var(--madder-ink)",
        "madder-wash": "var(--madder-wash)",
      },
      fontFamily: {
        serif: "var(--font-serif)",
        deva: "var(--font-deva)",
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
      },
      maxWidth: {
        measure: "var(--measure, 36rem)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
};
