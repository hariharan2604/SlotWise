# SlotWise — Resource Booking MVP

SlotWise is a small full-stack resource booking application built with ASP.NET Core Web API, React, TypeScript, Material UI, Entity Framework Core, and SQL Server.

## MVP functionality
- User registration and JWT login
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
- Docker Desktop (or SQL Server 2022)
- Git

## Run SQL Server
From the repository root:
```bash
docker compose up -d
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
- `GET /api/resources`
- `POST /api/resources` (Admin)
- `POST /api/bookings`
- `GET /api/bookings/mine`
- `GET /api/bookings` (Admin)
- `DELETE /api/bookings/{id}`
- `GET /api/bookings/availability?resourceId=1&start=...&end=...`

Successful JSON responses use `{ "success": true, "message": "...", "data": ... }`. Errors use RFC Problem Details (`application/problem+json`) with a `traceId`; validation failures include an `errors` object. `204 No Content` is retained for successful booking cancellation.

## Postman
Import [`postman/SlotWise-Backend.postman_collection.json`](postman/SlotWise-Backend.postman_collection.json) and [`postman/SlotWise-Local.postman_environment.json`](postman/SlotWise-Local.postman_environment.json) into Postman, then select the **SlotWise Local** environment. Start the backend and SQL Server first.

For regular user requests, run **Register user** (or **Login user**) to save a JWT automatically. For Admin-only requests, enter the local development admin password in the environment's `adminPassword` variable, then run **Login Admin**. The collection automatically picks a resource from **List active resources**, creates future UTC timestamps for booking and availability requests, and saves the created `bookingId`.

## Project structure
```text
backend/SlotWise.Api
frontend/src
docs/requirements.md
```
