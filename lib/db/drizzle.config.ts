export default {
  schema: "../src/schema/index.ts", // Apunta directamente al archivo que exporta las tablas
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
}
