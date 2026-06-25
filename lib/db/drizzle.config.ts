// En lib/db/drizzle.config.ts
export default {
  schema: "../../src/schema/index.ts", // <--- Nota los TRES puntos (../../)
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
}
