/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        // the one container shadow: a hairline plus a soft, wide lift (the page is a clear step darker than the white cards — see PAGE_BG in shared/colors.ts)
        card: '0 1px 2px rgba(15,23,42,0.08), 0 8px 24px -6px rgba(15,23,42,0.18)',
        lift: '0 2px 4px rgba(15,23,42,0.08), 0 14px 36px -6px rgba(15,23,42,0.24)',
      },
    },
  },
  plugins: [],
}
