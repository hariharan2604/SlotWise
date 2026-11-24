# SlotWise — Resource Booking MVP

SlotWise is a small full-stack resource booking application built with ASP.NET Core Web API, React, TypeScript, Material UI, Entity Framework Core, and SQL Server.

## MVP functionality
- User registration and JWT login
- JWT authentication stored in an HttpOnly cookie (not browser storage)
- Seeded bookable resources
- View resources
- Create bookings with UTC timestamps
- Reject overlapping bookings for the same resource
- View own booking history
- Cancel future bookings
- Admin-only resource creation and all-bookings view
- Admin-managed office locations with an OpenStreetMap-powered discovery map
- Office-specific resource discovery, availability checks, and directions

## Prerequisites
- .NET 10 SDK
- Node.js 20+
- Docker Desktop (or SQL Server 2022 for local development without containers)
- Git

## Run with Docker Compose
From the repository root, copy `.env.example` to `.env` and replace the SQL Server, JWT, and seeded-admin passwords/keys with local values. Keep `.env` private; it is ignored by Git.
```bash
docker compose up --build -d
```
Open the app at http://localhost:8080 and Swagger at http://localhost:8080/swagger. Compose waits for SQL Server to become healthy before starting the API. The SQL data is persisted in the `slotwise-sql-data` volume. Use `docker compose logs -f` to view logs and `docker compose down` to stop the stack. To also remove the database volume, run `docker compose down -v`.

The frontend container proxies `/api` and `/swagger` to the API container, so browser requests and Swagger use the same origin. To change the host ports, update `APP_PORT` and `MSSQL_PORT` in `.env`.

## Run locally without Docker
Start SQL Server separately (Docker Desktop or an installed SQL Server), then run from the repository root:
```bash
docker compose up -d sqlserver
```
Wait until SQL Server is ready.

## Run backend
```bash
cd backend/SlotWise.Api
dotnet restore
dotnet run
```
Swagger: http://localhost:5080/swagger

Development seed admin:
- Email: `admin@slotwise.local`
- Password: `ChangeMe123!`

Change these values before using the application outside a local demo. Configure with environment variables or user secrets rather than committing secrets.

The backend currently uses `EnsureCreated` for quick local startup. The repository includes an `InitialCreate` EF migration for new databases. For a maintained deployment, back up the database, apply the migration to an empty database, and replace `EnsureCreated` with the reviewed migration workflow:
```bash
dotnet tool install --global dotnet-ef
dotnet ef database update
```
For a database previously created by this app's `EnsureCreated` startup, apply [`UpgradeEnsureCreatedDatabase.sql`](backend/SlotWise.Api/Data/Migrations/UpgradeEnsureCreatedDatabase.sql) after taking a backup. It adds the office schema and records the existing schema as the initial migration baseline, preserving existing resources and bookings. Then use `dotnet ef database update` for later migrations.

## Run frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173.

Optional frontend API URL:
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5080/api
```

## Booking rules
- The client converts local datetime inputs to UTC ISO strings.
- The API validates start/end ordering, future start time, and a maximum 12-hour booking.
- Intervals are half-open: `[start, end)`. A booking ending at 11:00 does not conflict with one starting at 11:00.
- The backend checks overlaps inside a SQL Server `SERIALIZABLE` transaction.
- Cancelled bookings do not block availability.
- Users can cancel only their own future bookings; Admin can cancel any future booking.

## Office locations and map
Admins can add or update office locations under **Manage workspace**, entering latitude and longitude manually or using browser geolocation to fill the coordinates, and associate resources with an active office. Employees can select **Office locations** to view active offices, their resources, and resource availability before booking. When an admin changes a resource's office and it has future confirmed bookings, the admin must choose to move those bookings with the resource or cancel them. Booking views show the resource's current office. Office deactivation hides the office and its associated resources from employee discovery and prevents new bookings, while preserving existing bookings.

The map uses Leaflet and OpenStreetMap data/tiles without an API key. Tile requests use `tile.openstreetmap.org` with visible attribution; the public OSM tile service has a usage policy and is not an unlimited production tile CDN. Review https://operations.osmfoundation.org/policies/tiles/ before deployment and use a compliant provider or self-hosted tiles if production traffic requires it. Directions open OpenStreetMap in a new tab; no routing API or geocoding service is used.

Office API requests are documented in [`backend/SlotWise.Api/OfficeLocations.http`](backend/SlotWise.Api/OfficeLocations.http). Office listing and resource discovery require authentication; office create, update, and deactivation require the Admin role. Resource `OfficeLocationId` is optional to preserve compatibility with existing resources; when supplied it must reference an active office.

## Important production hardening
This is a learning MVP, not a production-certified reservation platform. Before production:
1. Move JWT and database secrets to a secret manager/environment variables.
2. Use HTTPS.
3. Use EF Core migrations and review generated SQL.
4. Add rate limiting, email verification, password reset, audit logs, and structured logging.
5. Add integration tests for simultaneous booking attempts against SQL Server.
6. Consider a dedicated reservation/locking strategy and retry handling for SQL deadlock error 1205.
7. Add pagination, resource editing/deactivation, booking modification, and admin UI.
8. Store and display each organization's timezone explicitly if supporting multiple time zones.
9. Review cancellation and authorization policies for the business.

## API overview
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/resources`
- `POST /api/resources` (Admin)
- `PUT /api/resources/{id}/office-location` (Admin)
- `GET /api/office-locations`
- `GET /api/office-locations/{id}`
- `POST /api/office-locations` (Admin)
- `PUT /api/office-locations/{id}` (Admin)
- `DELETE /api/office-locations/{id}` (Admin; deactivates)
- `GET /api/office-locations/{id}/resources`
- `GET /api/office-locations/{id}/resources/availability?start=...&end=...`
- `POST /api/bookings`
- `GET /api/bookings/mine`
- `GET /api/bookings` (Admin)
- `DELETE /api/bookings/{id}`
- `GET /api/bookings/availability?resourceId=1&start=...&end=...`

Successful JSON responses use `{ "success": true, "message": "...", "data": ... }`. Errors use RFC Problem Details (`application/problem+json`) with a `traceId`; validation failures include an `errors` object. `204 No Content` is retained for successful booking cancellation.

The browser never receives or stores the JWT in JavaScript. Login and registration
set an HttpOnly, SameSite cookie (Secure outside development); the API validates
the cookie on subsequent requests. The frontend restores sessions through
`GET /api/auth/me` and clears the cookie through `POST /api/auth/logout`.

## Postman
Import [`postman/SlotWise-Backend.postman_collection.json`](postman/SlotWise-Backend.postman_collection.json) and [`postman/SlotWise-Local.postman_environment.json`](postman/SlotWise-Local.postman_environment.json) into Postman, then select the **SlotWise Local** environment. Start the backend and SQL Server first.

For regular user requests, run **Register user** (or **Login user**); Postman stores and sends the HttpOnly cookie automatically. For Admin-only requests, enter the local development admin password in the environment's `adminPassword` variable, then run **Login Admin**. The collection automatically picks a resource from **List active resources**, creates future UTC timestamps for booking and availability requests, and saves the created `bookingId`.

## Project structure
```text
backend/SlotWise.Api
  Controllers/       HTTP routing, authorization, and response mapping
  Services/          Application and booking/resource/authentication logic
  Data/Repositories/ EF Core persistence queries and writes
  Data/AppDbContext.cs  SQL Server ORM model and relationships
  Models/            EF Core entities and Identity user
  Dtos/              API request and response contracts
frontend/src
docs/requirements.md
```

The backend uses ASP.NET Core MVC controllers, scoped service interfaces, and
entity-specific repositories implemented with Entity Framework Core. Controllers
depend on services rather than accessing the `AppDbContext` directly. ASP.NET
Core Identity manages user and role persistence through its EF Core stores.
