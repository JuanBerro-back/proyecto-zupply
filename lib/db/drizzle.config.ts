export default {
  schema: "../../src/schema/index.ts", // Esto sube dos niveles (fuera de db, fuera de lib)
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
}
