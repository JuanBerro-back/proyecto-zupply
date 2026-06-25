export default {
  schema: "./src/schema/index.ts", // Al estar ambos en lib/db, es una ruta directa
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
}
