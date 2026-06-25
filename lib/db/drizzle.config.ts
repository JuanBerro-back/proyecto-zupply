// En lib/db/drizzle.config.ts
export default {
  schema: "../src/schema/*.ts", // <--- Esto le dice: "sal dos niveles y entra a src/schema"
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
}
