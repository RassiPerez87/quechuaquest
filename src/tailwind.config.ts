import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        crema: '#FEFAF5',
        'cafe-oscuro': '#3D2B1F',
        'cafe-medio': '#6B3F2A',
        terracota: '#C4763A',
        dorado: '#D4A853',
        'verde-andino': '#7A9E6E',
        'rojo-andino': '#B85C38',
        'cafe-claro': '#E8C99A',
      },
    },
  },
  plugins: [],
};

export default config;