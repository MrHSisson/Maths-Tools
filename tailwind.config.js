/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        // the one container shadow: a hairline plus a soft, wide lift (reads on the near-white page)
        card: '0 1px 2px rgba(15,23,42,0.05), 0 6px 20px -4px rgba(15,23,42,0.10)',
        lift: '0 2px 4px rgba(15,23,42,0.05), 0 12px 32px -6px rgba(15,23,42,0.16)',
      },
    },
  },
  plugins: [],
}
