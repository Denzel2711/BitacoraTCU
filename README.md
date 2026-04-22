# Bitacora TCU

Aplicacion web para el registro y seguimiento de actividades de Trabajo Comunal Universitario (TCU) de la Universidad Tecnica Nacional.

- Frontend `React + Vite`.
- Backend `Node + Express`.

Todo corre en un solo proyecto Next.js con `App Router`, API interna y acceso directo a MySQL.

## Tecnologias principales

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- MySQL (`mysql2/promise`)
- Leaflet + React Leaflet

## Requisitos previos

- Node.js 18+
- npm 9+
- MySQL 8+
- Esquema de base de datos del sistema TCU ya creado (tablas, vistas y procedimientos almacenados)

## Instalacion

1. Instalar dependencias

```bash
npm install
```

2. Crear archivo de entorno local

```bash
Copy-Item .env.example .env.local
```

3. Ajustar valores en `.env.local`

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Backend (MySQL)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=bitacora_tcu
DB_PORT=3306

# Uploads (bytes)
MAX_FILE_SIZE=5242880
```

## Scripts disponibles

```bash
# Desarrollo
npm run dev

# Lint
npm run lint

# Build produccion
npm run build

# Ejecutar build
npm run start
```

La aplicacion inicia por defecto en `http://localhost:3000`.