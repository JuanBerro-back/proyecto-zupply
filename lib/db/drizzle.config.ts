export default {
  schema: "../../src/schema/index.ts", // <- Dos saltos hacia atrás para llegar a la raíz
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
}
