# SmartBills Cleaner MVP

Monorepo para un MVP funcional de SmartBills Cleaner con:

- `apps/backend`: API Node.js + Express + Prisma + PostgreSQL
- `apps/frontend`: React + Vite
- `docker-compose.yml`: PostgreSQL 15, backend, frontend y pgAdmin

## Alcance del MVP

El proyecto implementa los primeros sprints con una simulacion funcional de:

- autenticacion con email y contrasena
- gestion de usuarios por roles `ADMIN`, `ANALYST`, `VIEWER`
- auditoria de acciones
- dashboard con KPIs
- carga de facturas con drag and drop
- OCR y almacenamiento tipo S3 simulados localmente
- listado y edicion de facturas con filtros

La integracion real con AWS no esta activa. El backend deja preparado el contrato para reemplazar el almacenamiento y OCR simulados por S3/Textract despues.

## Estructura

```text
smartbills/
  apps/
    backend/
    frontend/
  docker-compose.yml
```

## Git y ramas

Estrategia recomendada:

- `main`: produccion
- `develop`: integracion
- `feature/*`: nuevas historias

Al no existir commit inicial todavia, Git queda inicializado en `main`. Despues del primer commit puedes crear `develop` con:

```bash
git checkout -b develop
```

## Variables de entorno

Duplica `.env.example` como `.env` en la raiz.

## Arranque local

### Opcion 1: Docker Compose

```bash
docker compose up --build
```

La API ejecuta un seed automatico al arrancar si la base de datos no tiene usuarios.

### Opcion 2: local

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Credenciales seed

- Admin: `admin@smartbills.local` / `Admin123!`
- Analyst: `analyst@smartbills.local` / `Analyst123!`
- Viewer: `viewer@smartbills.local` / `Viewer123!`

## pgAdmin

- URL: [http://localhost:5050](http://localhost:5050)
- Email: `admin@smartbills.com`
- Password: `admin123`

## Nota para Docker

En Docker, el backend usa siempre `postgres` como hostname interno de la base de datos.
El valor `DATABASE_URL` del archivo `.env` queda reservado para ejecucion local fuera de contenedores.
