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

The backend currently uses `EnsureCreated` for quick local startup. For a maintained deployment, replace this with EF Core migrations:
```bash
dotnet tool install --global dotnet-ef
dotnet ef migrations add InitialCreate
dotnet ef database update
```
Then remove `EnsureCreated` from startup and use migrations.

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
