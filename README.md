# Destaco.es

> El directorio empresarial mas moderno de Espana — descubre, compara y contacta
> con empresas verificadas por provincia, ciudad y categoria.

Plataforma SaaS construida para escalar a nivel nacional: SEO programatico a
escala de millones de paginas, ingesta legal de datos, enriquecimiento con IA y
un diseno premium inspirado en Linear, Stripe y Apple.

---

## Stack

| Capa            | Tecnologia                                                   |
| --------------- | ------------------------------------------------------------ |
| Frontend        | Next.js 16 (App Router), React 19, TypeScript                |
| Estilos         | Tailwind CSS v4, shadcn/ui (new-york), Framer Motion          |
| Backend         | Next.js Server Actions + Route Handlers, arquitectura modular |
| Base de datos   | PostgreSQL 16 + Prisma ORM 6                                  |
| Cache / colas   | Redis 7 (ioredis)                                            |
| Autenticacion   | Auth.js v5 (NextAuth) — Google + roles                       |
| IA              | OpenAI API (enriquecimiento, FAQs, SEO, moderacion)          |
| Pagos           | Stripe (planes, perfiles destacados)                         |
| Infraestructura | Docker Compose, salida `standalone` lista para producir      |

---

## Estado del proyecto

Este repositorio contiene los **cimientos** de la plataforma. Lo ya implementado:

- [x] Scaffold completo (Next.js 16 + TypeScript + Tailwind v4)
- [x] Esquema de base de datos completo (Prisma) — empresas, geografia,
      categorias, resenas, usuarios, monetizacion, jobs de ingesta
- [x] Sistema de diseno premium monocromo con modo claro/oscuro
- [x] App shell (header, footer, theming) y home page
- [x] Infraestructura Docker (PostgreSQL + Redis) e instalacion automatica
- [x] Seed con 52 provincias, ciudades, categorias y empresas demo
- [x] Configuracion de Auth.js v5
- [x] **Pipeline de ingesta legal** — Google Places API + OpenStreetMap,
      normalizacion, categorizacion, deduplicacion, jobs, CLI y cron
- [x] **Base tecnica de SEO** — sitemap y robots programaticos, helpers de
      metadatos y datos estructurados schema.org (Organization, LocalBusiness,
      FAQPage, BreadcrumbList, ItemList)
- [x] **Sitio publico programatico completo** — capa de datos sobre Prisma con
      fallback demo, y paginas `/categorias`, `/[categoria]`,
      `/[categoria]/[ciudad]`, `/provincias`, `/provincias/[provincia]`,
      `/empresas` (busqueda y filtros) y `/empresa/[slug]` (perfil)
- [x] **Enriquecimiento con IA (OpenAI)** — genera descripcion, perfil
      profesional, servicios, FAQs, keywords y meta tags; pasa las empresas
      de DRAFT a PENDING para revision del administrador
- [x] **Autenticacion** — Auth.js v5 con Google + email/password (scrypt),
      sesiones JWT, paginas `/login` y `/registro`, roles USER/BUSINESS/ADMIN
- [x] **Panel de administracion** (`/admin`) — metricas, moderacion de
      empresas y de resenas (aprobar / rechazar), historial de jobs
- [x] **Dashboard de empresa** (`/dashboard`) — publicar y editar fichas de
      empresa, ver estadisticas
- [x] **Sistema de resenas** — envio por usuarios autenticados, moderacion
      del admin y recalculo automatico de la valoracion media

Roadmap (siguientes fases):

- [ ] Monetizacion con Stripe (planes, perfiles destacados, checkout)
- [ ] Blog automatico con IA y busqueda semantica con embeddings
- [ ] Reclamacion de fichas existentes (CompanyClaim) y sitemaps dinamicos

> Nota tecnica: el header muestra el estado de sesion, lo que hace que las
> paginas se rendericen en modo dinamico (SSR). Es 100% indexable; para
> recuperar el cacheo ISR a gran escala, mover la sesion a un componente
> cliente con `SessionProvider`.

---

## Requisitos

- Node.js 20+ (probado con 22)
- Docker + Docker Compose (para PostgreSQL y Redis)
- npm 10+

---

## Instalacion rapida

```bash
# 1. Instalacion automatica (deps + Docker + esquema + datos demo)
npm run setup

# 2. Arrancar el servidor de desarrollo
npm run dev
```

Abre <http://localhost:3000>.

### Instalacion manual

```bash
cp .env.example .env          # configura tus variables
npm install
docker compose up -d          # PostgreSQL + Redis
npx prisma generate
npx prisma db push            # crea el esquema
npm run db:seed               # carga datos demo
npm run dev
```

---

## Variables de entorno

Copia `.env.example` a `.env`. Las imprescindibles para desarrollo local:

| Variable       | Descripcion                                            |
| -------------- | ------------------------------------------------------ |
| `DATABASE_URL` | Cadena de conexion a PostgreSQL (valor Docker por def.)|
| `REDIS_URL`    | Cadena de conexion a Redis                             |
| `AUTH_SECRET`  | Secreto de Auth.js — `openssl rand -base64 32`         |

Opcionales (activan funcionalidades): `OPENAI_API_KEY`, `GOOGLE_PLACES_API_KEY`,
`AUTH_GOOGLE_ID/SECRET`, `STRIPE_*`, `SMTP_*`.

---

## Comandos

| Comando              | Descripcion                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Servidor de desarrollo                   |
| `npm run build`      | Build de produccion (`prisma generate` + Next) |
| `npm run start`      | Servir el build de produccion            |
| `npm run db:push`    | Sincroniza el esquema con la base de datos |
| `npm run db:migrate` | Crea y aplica una migracion              |
| `npm run db:seed`    | Carga datos demo                         |
| `npm run db:studio`  | Abre Prisma Studio                       |

---

## Ingesta de empresas

El pipeline obtiene empresas reales de **fuentes legales**: Google Places API
y OpenStreetMap (Overpass). Cada empresa se normaliza, se categoriza, se
deduplica y se guarda en estado `DRAFT` registrando un `IngestionJob`.

```bash
# Prueba sin tocar la base de datos (--dry-run): muestra lo que se obtendria
npx tsx scripts/ingest.ts --source=osm --area=Valencia --category=restaurantes --dry-run
npx tsx scripts/ingest.ts --source=google --query="dentistas en Valencia" --dry-run

# Ingesta real (requiere PostgreSQL en marcha)
npx tsx scripts/ingest.ts --source=osm --area=Madrid --category=abogados
npx tsx scripts/ingest.ts --source=google --query="marketing en Madrid"
```

Tambien hay un endpoint protegido `POST /api/ingest` (cabecera
`Authorization: Bearer $CRON_SECRET`) y un cron diario en `vercel.json` que
ejecuta una ingesta rotativa via OpenStreetMap (sin coste de API).

> Google Places es de pago: ~0,03 €/busqueda. Restringe la clave en Google
> Cloud Console y define un limite de presupuesto.

### Enriquecimiento con IA

Las empresas se ingieren en estado `DRAFT`. El enriquecimiento con OpenAI
genera descripcion, perfil profesional, servicios, FAQs, keywords y meta tags,
y pasa la empresa a `PENDING` (pendiente de aprobacion del administrador).

```bash
# Probar contra OpenAI sin tocar la base de datos
npx tsx scripts/enrich.ts --dry-run --name="Bar Pepe" --category="Restaurantes" --city="Sevilla"

# Enriquecer un lote de empresas DRAFT (requiere PostgreSQL)
npx tsx scripts/enrich.ts --limit=20
```

Endpoint protegido: `POST /api/enrich` con `Authorization: Bearer $CRON_SECRET`.

> Modelo `gpt-4o-mini` (~0,001 €/empresa). El contenido es orientativo y
> generico por diseno — no inventa datos concretos — y debe revisarse antes
> de publicar.

---

## Estructura del proyecto

```
destaco-es/
├── prisma/
│   ├── schema.prisma      # modelo de datos completo
│   └── seed.ts            # datos demo (provincias, categorias, empresas)
├── src/
│   ├── app/               # rutas (App Router)
│   │   ├── api/auth/       # handler de Auth.js
│   │   ├── layout.tsx      # layout raiz + theming + SEO
│   │   └── page.tsx        # home
│   ├── components/
│   │   ├── ui/             # primitivas de diseno (shadcn-style)
│   │   ├── layout/         # header y footer
│   │   ├── home/           # secciones de la home
│   │   └── company-card.tsx
│   ├── lib/
│   │   ├── prisma.ts       # cliente Prisma (singleton)
│   │   ├── redis.ts        # cliente Redis + cache-aside
│   │   ├── auth.ts         # configuracion Auth.js v5
│   │   ├── seo.ts          # metadatos y JSON-LD
│   │   ├── constants.ts    # catalogo y configuracion del sitio
│   │   └── demo-data.ts    # datos demo para la home
│   └── types/              # ampliaciones de tipos
├── docker-compose.yml      # PostgreSQL + Redis (+ app con --profile full)
├── Dockerfile              # imagen de produccion (standalone)
└── scripts/setup.mjs       # instalacion automatica
```

---

## Docker

```bash
docker compose up -d                 # solo infraestructura (PostgreSQL + Redis)
docker compose --profile full up -d  # infraestructura + app Next.js
```

---

## Nota legal sobre los datos

La ingesta de empresas se disena para usar **unicamente fuentes legales**:
Google Places API, OpenStreetMap (Overpass) y datos abiertos espanoles
(datos.gob.es, BORME). No se realiza scraping de servicios cuyos terminos lo
prohiben (p. ej. Google Maps o Paginas Amarillas).

---

Hecho en Espana.
