export default {
  schema: "./src/schema/index.ts",
  out: "./drizzle", // <--- ¡Añade esto! Le dice a Drizzle dónde buscar los archivos .sql
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
}
