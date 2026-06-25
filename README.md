# Zupply IA — ERP/SaaS B2B para Restaurantes y Proveedores

Plataforma para restaurantes que centraliza pedidos a múltiples proveedores, automatiza contabilidad, usa IA predictiva para gestión de inventarios y conecta el ecosistema con proveedores de Bucaramanga, Colombia.

---

## Ejecutar en local (desde cero)

### Requisitos previos

| Herramienta | Versión mínima | Cómo instalar |
|-------------|----------------|---------------|
| Node.js     | 20.x           | https://nodejs.org |
| pnpm        | 9.x            | `npm install -g pnpm` |
| PostgreSQL   | 14+            | https://www.postgresql.org/download/ |

> **Nota:** Este proyecto usa `pnpm workspaces`. No uses `npm` ni `yarn` directamente.

---

### Pasos de instalación

```bash
# 1. Clonar o descomprimir el proyecto
cd zupply-ia

# 2. Instalar todas las dependencias del monorepo
pnpm install

# 3. Configurar la variable de entorno de base de datos
#    Crea un archivo .env en la raíz (o configúralo en tu sistema):
echo "DATABASE_URL=postgresql://usuario:password@localhost:5432/zupply_ia" >> .env
echo "SESSION_SECRET=tu-clave-secreta-de-al-menos-32-caracteres" >> .env

# 4. Crear la base de datos en PostgreSQL
createdb zupply_ia   # o hazlo desde pgAdmin / DBeaver

# 5. Ejecutar migraciones (crear las tablas y sembrar datos de prueba)
pnpm --filter @workspace/db run push

# 6. En una terminal: iniciar el API server (puerto 8080)
pnpm --filter @workspace/api-server run dev

# 7. En otra terminal: iniciar el frontend (puerto 24613)
pnpm --filter @workspace/zupply-ia run dev
```

Abre tu navegador en: **http://localhost:24613**

---

## Despliegue en Vercel / Netlify (solo frontend)

El frontend puede desplegarse de forma independiente si apuntas el API a un servidor propio.

```bash
# Build del frontend
pnpm --filter @workspace/zupply-ia run build
# El output queda en: artifacts/zupply-ia/dist/
```

Para Vercel:
1. Conecta el repositorio en https://vercel.com/new
2. Configura el **Root Directory** como `artifacts/zupply-ia`
3. Agrega las variables de entorno (`VITE_API_URL`, etc.)
4. Deploy automático en cada push

Para Netlify:
```bash
# Build command
pnpm --filter @workspace/zupply-ia run build
# Publish directory
artifacts/zupply-ia/dist
```

---

## Cuentas de prueba (RBAC)

| Usuario         | Contraseña | Rol                      | Contexto     | Acceso |
|----------------|------------|--------------------------|--------------|--------|
| `admin`        | demo123    | Administrador            | Restaurante  | Total  |
| `gerente`      | demo123    | Gerente de Operaciones   | Restaurante  | Pedidos, facturación, reportes |
| `empleado`     | demo123    | Empleado (Cocina/Barra)  | Restaurante  | Solo lectura: inventario y recetas |
| `proveedor`    | demo123    | Admin de Catálogo        | Proveedor    | Total  |
| `domiciliario` | demo123    | Encargado de Envíos      | Proveedor    | Solo logística y rutas |

---

## Módulos del sistema

### Vista Restaurante
- **Dashboard** — KPIs, alertas IA, gastos del mes, top proveedores
- **Pedidos** — Catálogo multi-proveedor, carrito, rastreo con mapa Leaflet (Bucaramanga) y escáner de código de barras
- **Inventario** — CRUD completo + FEFO (alertas de vencimiento por fecha)
- **Contabilidad** — Transacciones auto-generadas, flujo de caja
- **Facturación** — POS (efectivo / tarjeta / Nequi) + Factura Electrónica (NIT / Cédula / Gmail)
- **Proveedores** — Directorio con calificaciones y sistema de reseñas
- **Costeo Platos** — CRUD de recetas con Food Cost % = (Costo/PVP)×100; alerta roja si >35%

### Vista Proveedor
- **Panel Principal** — KPIs de ventas, Kanban (Nuevo → Preparando → Despachado → Entregado)
- **Logística & Flota** — Mapa Leaflet, gestión de flota (motos/furgones), despacho con asignación de vehículos
- **Mi Inventario** — CRUD de catálogo con fechas de vencimiento FEFO, alertas de lote

---

## Stack técnico

| Capa        | Tecnología                                         |
|-------------|----------------------------------------------------|
| Frontend    | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Mapas       | react-leaflet + OpenStreetMap (sin API key)       |
| API         | Express 5 + Zod                                   |
| Base de datos | PostgreSQL + Drizzle ORM                        |
| Validación  | Zod v4 + drizzle-zod                              |
| Codegen     | Orval (OpenAPI → React Query hooks)               |
| Monorepo    | pnpm workspaces + Node.js 24                      |

---

## Estructura del proyecto

```
zupply-ia/
├── artifacts/
│   ├── api-server/        # Express API (puerto 8080)
│   │   └── src/routes/    # Endpoints REST
│   └── zupply-ia/         # Frontend React + Vite
│       └── src/
│           ├── context/   # AuthContext (RBAC)
│           ├── pages/     # Páginas por rol
│           │   ├── restaurante/
│           │   └── proveedor/
│           └── components/
├── lib/
│   ├── api-spec/          # openapi.yaml (fuente de verdad)
│   ├── api-client-react/  # React Query hooks (generados)
│   ├── api-zod/           # Schemas Zod (generados)
│   └── db/                # Schema Drizzle + migraciones
└── pnpm-workspace.yaml
```

---

## Comandos útiles

```bash
# Regenerar hooks y schemas desde el OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Typecheck completo (libs + artifacts)
pnpm run typecheck

# Build completo
pnpm run build

# Actualizar schema de DB (dev)
pnpm --filter @workspace/db run push
```

---

## Solución de problemas comunes

| Problema | Solución |
|----------|----------|
| `DATABASE_URL not set` | Agrega la variable en `.env` o en las variables del sistema |
| `Port already in use` | Cambia el puerto en el `.replit-artifact/artifact.toml` correspondiente |
| El mapa Leaflet no carga | Verifica que `leaflet/dist/leaflet.css` esté importado en `main.tsx` |
| Tipos desactualizados | Ejecuta `pnpm --filter @workspace/api-spec run codegen` |
| Error de migración | Borra la DB y vuelve a ejecutar `pnpm --filter @workspace/db run push` |
