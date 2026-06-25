import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Al usar rutas relativas basadas en string, Drizzle las resuelve directo 
  // desde donde se ejecuta el comando sin romperse por ESM/__dirname
  schema: "./src/schema/index.ts", 
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Si DATABASE_URL no llega a estar, Drizzle Kit fallará con su propio mensaje interno de conexión
    url: process.env.DATABASE_URL || "", 
  },
});
