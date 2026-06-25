import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "../src/schema/index.ts", // Asegúrate de que el camino relativo sea correcto
  out: "./drizzle",
  dialect: "postgresql", // O 'pg' dependiendo de tu versión de kit
  dbCredentials: {
    url: "postgresql://postgres:Juanchotopocho@db.dfwaopkbjcqwlzwmqbwx.supabase.co:5432/postgres",
  },
});
