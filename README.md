# Bitacora TCU - App Unificada en Next.js

Aplicacion web para el registro y seguimiento de actividades de Trabajo Comunal Universitario (TCU) de la Universidad Tecnica Nacional.

Esta version migra y unifica:

- Frontend `React + Vite`.
- Backend `Node + Express`.

Ahora todo corre en un solo proyecto Next.js con `App Router`, API interna y acceso directo a MySQL.

## Objetivos de la migracion

- Unificar frontend y backend en una sola base de codigo.
- Reducir complejidad operativa (un solo deploy y un solo runtime).
- Mantener compatibilidad con los endpoints de la API anterior.
- Conservar validaciones funcionales del formulario TCU.

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

## Arquitectura de la app

### Frontend

- `src/components/features/TCUFormView.tsx`: vista principal del formulario.
- `src/components/features/map/`: mapa interactivo con carga dinamica (Leaflet).
- `src/components/layout/FormHeader.tsx`: cabecera del formulario.
- `src/components/ui/PrivacyNotice.tsx`: aviso de privacidad.
- `src/hooks/*`: manejo de estado, busqueda de estudiantes, geolocalizacion y fecha.
- `src/services/form.ts`: cliente HTTP hacia `/api/*`.
- `src/utils/validators.ts`: validaciones de formulario.
- `src/actions/index.ts`: Server Actions de Next.js.
- `src/types/index.ts`: tipos e interfaces compartidos.

### Backend interno (API Next)

- `src/app/api/*`: endpoints HTTP.
- `src/lib/db/index.ts`: pool de conexiones MySQL.
- `src/lib/db/models/*`: logica SQL de estudiantes, actividades y evidencias.
- `src/lib/uploads.ts`: validacion y persistencia de archivos en `public/uploads`.

### Persistencia de archivos

- Las evidencias de archivos se almacenan en: `public/uploads`.
- La ruta guardada en base de datos se mantiene con formato: `/uploads/<archivo>`.

## Estructura del proyecto

```text
tcu-next/
	src/
		actions/
			index.ts
		app/
			layout.tsx
			page.tsx
			loading.tsx
			error.tsx
			not-found.tsx
			api/
				route.ts
				estudiantes/
				actividades/
				evidencias/
		components/
			features/
				TCUFormView.tsx
				map/
					InteractiveMap.tsx
					LeafletMapInner.tsx
			layout/
				FormHeader.tsx
			ui/
				PrivacyNotice.tsx
		constants/
			form.ts
		hooks/
			index.ts
			useFormData.ts
			useEstudiantes.ts
			useGeolocation.ts
			useFechaHoy.ts
		lib/
			http.ts
			uploads.ts
			db/
				index.ts
				models/
					estudiante.model.ts
					actividad.model.ts
					evidencia.model.ts
		services/
			form.ts
		types/
			index.ts
		utils/
			validators.ts
			map.ts
	public/
		uploads/
```

## Endpoints API disponibles

### Base

- `GET /api`

### Estudiantes

- `GET /api/estudiantes`
- `POST /api/estudiantes`
- `GET /api/estudiantes/search?q=<texto>`
- `GET /api/estudiantes/cedula/:cedula`
- `GET /api/estudiantes/:id`
- `PUT /api/estudiantes/:id`
- `GET /api/estudiantes/:id/resumen`

### Actividades

- `GET /api/actividades`
- `POST /api/actividades`
- `GET /api/actividades/estadisticas`
- `GET /api/actividades/estudiante/:estudianteId`
- `GET /api/actividades/:id`
- `PUT /api/actividades/:id`
- `DELETE /api/actividades/:id`
- `PATCH /api/actividades/:id/aprobar`
- `PATCH /api/actividades/:id/rechazar`

### Evidencias

- `POST /api/evidencias`
- `GET /api/evidencias/actividad/:actividadId`
- `DELETE /api/evidencias/:id`

## Compatibilidad con la version anterior

- Se mantienen rutas y estructura general de respuestas (`success`, `data`, `message`, `error`).
- El frontend consume por defecto `NEXT_PUBLIC_API_URL` y usa `/api` si no esta definida.
- La logica de actividades conserva soporte para:
	- Evidencia de texto.
	- Evidencia de foto/documento con `multipart/form-data`.
	- Integracion con procedimientos almacenados (`sp_registrar_actividad`, `sp_aprobar_actividad`, `sp_rechazar_actividad`).

## Caracteristicas funcionales del formulario

- Busqueda de estudiantes por cedula, nombre y apellido.
- Registro de actividad con tipo y subtipo.
- Campos condicionales para tipo de capacitacion y reflexiones.
- Evidencia obligatoria (texto, foto o documento).
- Geolocalizacion por GPS y seleccion manual en mapa.
- Validaciones de negocio:
	- Rango de fecha (no futura, maximo 10 dias hacia atras).
	- Hora inicio menor que hora final.
	- Limite de horas por actividad.
	- Descripcion con longitud minima y maxima.

## Validaciones de archivos

- Tamano maximo por archivo: `MAX_FILE_SIZE` (por defecto 5 MB).
- Tipos permitidos:
	- `Foto`: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
	- `Documentos`: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

## Consideraciones tecnicas importantes

- Leaflet se carga sin SSR para evitar `window is not defined` en `next build`.
- El mapa usa `dynamic import` en `InteractiveMap` y componente cliente en `LeafletMapInner`.
- Para ambiente productivo, considerar almacenamiento externo (S3, Blob, etc.) en lugar de disco local para `uploads`.

## Troubleshooting

### No aparecen estudiantes

- Verificar conexion a MySQL y credenciales en `.env.local`.
- Confirmar existencia de datos en tabla `estudiantes`.
- Revisar consola del servidor Next para errores SQL.

### Error al registrar actividad

- Revisar que existan los procedimientos almacenados requeridos.
- Verificar estructura de `multipart/form-data` cuando se envian archivos.
- Confirmar que el `tipoEvidencia` coincida con los tipos permitidos.

### Error en mapa o build

- Confirmar que `leaflet` y `react-leaflet` esten instalados.
- Ejecutar `npm run build` para validar SSR/CSR.
- Revisar que la inicializacion de Leaflet no ocurra durante render del servidor.

## Recomendaciones de despliegue

- Definir todas las variables de entorno en el proveedor de hosting.
- Asegurar acceso de red desde el runtime de Next hacia MySQL.
- Configurar persistencia para archivos `uploads` si el entorno es efimero.
- Ejecutar siempre `npm run lint` y `npm run build` antes de publicar.

## Licencia

ISC

## Autor

Universidad Tecnica Nacional - Sistema TCU
