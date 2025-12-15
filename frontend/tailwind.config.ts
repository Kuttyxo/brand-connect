import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#F2F2F2',    // Gris claro
          dark: '#2A2859',     // Azul marino profundo (Fondo principal)
          orange: '#F2994B',   // Naranja principal
          accent1: '#F2784B',  // Naranja rojizo
          accent2: '#F25E5E',  // Rojo salmón
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        // Gradiente oficial de BrandConnect
        "brand-gradient": "linear-gradient(to right, #F2994B, #F2784B, #F25E5E)",
      },
    },
  },
  plugins: [],
};
export default config;