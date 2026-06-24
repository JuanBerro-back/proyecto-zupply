# Zupply IA

Plataforma para restaurantes que centraliza pedidos a múltiples proveedores, automatiza contabilidad y usa IA predictiva para gestión de inventarios.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/zupply-ia run dev` — run the frontend (port 24613)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (suppliers, reviews, products, orders, inventory, transactions)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/zupply-ia/src/pages/` — React page components
- `artifacts/zupply-ia/src/components/layout/AppLayout.tsx` — Sidebar layout

## Architecture decisions

- OpenAPI-first: all types flow from `openapi.yaml` → Orval codegen → React hooks + Zod schemas
- Inventory predictions are computed server-side (no external ML service), using avgDailyUsage to simulate AI recommendations
- Confirming an order automatically creates an accounting transaction (expense)
- Delivering an order auto-increments matching inventory items
- Dashboard summary endpoint computes all metrics in a single request

## Product

- **Dashboard**: KPIs, AI stock alerts, top suppliers, monthly spend chart
- **Pedidos**: Multi-supplier catalog with cart, consolidated checkout
- **Contabilidad**: Auto-generated expense transactions, cash flow summary
- **Inventario IA**: Stock status with critical/low/ok badges, on-demand AI predictions
- **Proveedores**: Supplier directory with contact info, star ratings, review submission

## Gotchas

- Inventory predictions endpoint (`GET /api/inventory/predictions`) is on-demand — frontend fetches it only when user clicks "Ejecutar predicción IA"
- Drizzle numeric columns return strings from the DB driver — always `parseFloat()` before use
- Express 5: wildcard routes need `/{*splat}`, optional params use `/todos{/:id}`
