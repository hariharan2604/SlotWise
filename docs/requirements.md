# SlotWise — Software Requirements Specification (SRS)

**Version:** 1.0  
**Status:** MVP baseline  
**Target delivery:** 2–3 weeks  
**Backend:** ASP.NET Core Web API (.NET 10), C#  
**Frontend:** React.js + TypeScript  
**Database:** Microsoft SQL Server

## 1. Purpose
SlotWise is a web application that allows employees to discover and reserve shared resources such as meeting rooms, projectors, vehicles, and equipment. It prevents overlapping reservations and provides a central view of bookings.

## 2. Problem statement
Small organizations frequently coordinate shared resources using spreadsheets, chat messages, or email. This leads to double bookings, poor visibility, and time spent confirming availability. SlotWise provides a centralized resource catalog and booking workflow.

## 3. Goals
- Centralize shared resource availability and reservations.
- Prevent two confirmed bookings from overlapping for the same resource.
- Let users create, view, and cancel their own future bookings.
- Let administrators manage resources and view all bookings.
- Provide a simple dashboard of resources and personal bookings.

## 4. Scope

### In scope
- User registration and login.
- JWT authentication.
- Roles: Admin and User.
- Resource catalog.
- Resource availability check.
- Create and cancel bookings.
- Personal booking history.
- Admin view of all bookings.
- Seed demo resources and admin account.
- Responsive web interface.

### Out of scope for MVP
- Payment processing.
- Email/SMS/push notifications.
- Recurring bookings.
- Approval workflows.
- Calendar provider integrations.
- Multi-tenant organizations.
- Booking modification/rescheduling.
- Resource maintenance scheduling.
- Mobile native applications.

## 5. Actors and permissions

| Actor | Permissions |
|---|---|
| Visitor | Register and log in |
| User | View active resources, check availability, create bookings, view own bookings, cancel own future bookings |
| Admin | All user actions, create resources, view all bookings, cancel any future booking |

All protected endpoints must enforce authorization on the server. Frontend visibility is not a security boundary.

## 6. Functional requirements

### FR-01 Registration
The system shall allow a user to register with display name, email, and password. Email must be unique. Password policy shall require at least eight characters and a digit.

**Acceptance:** Valid registration creates a User-role account. Invalid or duplicate registration returns a useful validation error.

### FR-02 Login
The system shall authenticate users using email and password and return a signed JWT with an eight-hour expiry.

**Acceptance:** Invalid credentials return HTTP 401. Protected endpoints reject missing, invalid, or expired tokens.

### FR-03 Resource catalog
The system shall display active resources with name, description, location, and capacity. Admins shall be able to create resources.

**Acceptance:** Users can view active resources. Non-admin users cannot create resources.

### FR-04 Availability
The system shall determine whether a resource is available for a requested time interval.

**Acceptance:** An interval conflicts when an existing confirmed booking has `existing.Start < requested.End AND existing.End > requested.Start`. Adjacent intervals are allowed.

### FR-05 Create booking
An authenticated user shall be able to book an active resource by selecting start time, end time, and purpose.

Validation:
- Start must be in the future.
- End must be after start.
- Duration must not exceed 12 hours.
- Purpose is required and has a maximum length of 300 characters.
- Times are stored in UTC.
- The resource must be active.
- No overlapping confirmed booking may exist.

**Acceptance:** A valid request returns a confirmed booking. A conflict returns HTTP 409 and does not create a booking.

### FR-06 Concurrency safety
The backend shall perform the overlap check and insert in a SQL Server serializable transaction, with a supporting index.

**Acceptance:** Concurrent requests for overlapping intervals must not both be confirmed. This must be verified with integration tests against SQL Server before production use.

### FR-07 My bookings
Users shall be able to view their own bookings, including resource, purpose, start/end, and status.

**Acceptance:** A user must never see another user's bookings through the personal bookings endpoint.

### FR-08 Cancellation
Users shall be able to cancel their own future confirmed bookings. Admins shall be able to cancel any future confirmed booking.

**Acceptance:** Cancelled bookings no longer block availability. Started/past bookings cannot be cancelled through this MVP endpoint.

### FR-09 Admin booking view
Admins shall be able to view all bookings.

**Acceptance:** Non-admin requests receive HTTP 403.

## 7. Business rules
1. Booking intervals use half-open semantics: `[start, end)`.
2. Two bookings conflict only if they belong to the same resource and overlap in time.
3. Cancelled bookings do not block availability.
4. A booking cannot exceed 12 hours.
5. All persisted booking timestamps are UTC.
6. Client-provided resource IDs and user IDs must be validated server-side.
7. The authenticated user's identity comes from JWT claims, never from a request body.
8. A booking and its conflict check must be committed atomically.

## 8. Non-functional requirements
- Security: password hashing through ASP.NET Core Identity; JWT authentication; role authorization.
- Integrity: relational foreign keys and transactional booking creation.
- Performance: common list and availability requests should respond within two seconds for a small demo dataset.
- Usability: responsive layout and clear validation/conflict messages.
- Maintainability: separate controllers, DTOs, models, data access, and booking service.
- Compatibility: current Chrome, Edge, and Firefox desktop browsers.
- Observability: application logs should record errors without logging passwords or JWTs.

## 9. Data requirements

### Users
Identity-managed user records with ID, email, password hash, display name, and roles.

### Resources
- Id: integer primary key
- Name: required, max 120
- Description: max 500
- Location: max 150
- Capacity: positive integer
- IsActive: boolean
- CreatedAtUtc: UTC timestamp

### Bookings
- Id: integer primary key
- ResourceId: foreign key
- UserId: foreign key
- Purpose: required, max 300
- StartUtc: UTC timestamp
- EndUtc: UTC timestamp
- Status: Confirmed or Cancelled
- CreatedAtUtc: UTC timestamp
- CancelledAtUtc: nullable UTC timestamp

An index shall support conflict checks on resource, start, end, and status.

## 10. API requirements

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/resources` | User | List active resources |
| POST | `/api/resources` | Admin | Create resource |
| POST | `/api/bookings` | User | Create booking |
| GET | `/api/bookings/mine` | User | List own bookings |
| GET | `/api/bookings` | Admin | List all bookings |
| DELETE | `/api/bookings/{id}` | Owner/Admin | Cancel future booking |
| GET | `/api/bookings/availability` | User | Check availability |
| GET | `/api/bookings/availability/resources` | User | List active resources available in a time window |

## 11. UI requirements
- Login and registration screen.
- Dashboard with resource count, active booking count, and total personal bookings.
- Resource cards with details and booking action, plus a time-window finder for resources available across the workspace.
- Booking dialog with calendar/time pickers for resource, start, end, and purpose, including a conflict-aware availability check.
- Personal booking list with status and cancellation action.
- Admin-only workspace screen to create resources and review all bookings; admins can cancel any future booking.

## 12. Acceptance test checklist
- [ ] User can register.
- [ ] User can log in and receive a JWT.
- [ ] Anonymous requests cannot access resources or bookings.
- [ ] User can view active resources.
- [ ] User can find all active resources available in a valid time window.
- [ ] User can create a future booking.
- [ ] Invalid time ranges are rejected.
- [ ] Overlapping bookings are rejected.
- [ ] Back-to-back bookings are accepted.
- [ ] Different resources can be booked for the same time.
- [ ] Cancelled bookings no longer block the slot.
- [ ] Users cannot cancel another user's booking.
- [ ] Non-admin users cannot create resources or view all bookings.
- [ ] Concurrent overlapping booking attempts do not both succeed.

## 13. Assumptions and constraints
- Initial deployment is for a single small organization.
- Resource records are created by an administrator or seeded during setup.
- User-selected local times are converted by the browser to UTC before API submission.
- The MVP uses SQL Server and requires an internet browser.
- Admin credentials are configured only for local development and must be changed before deployment.

## 14. Future enhancements
- Weekly/monthly recurring bookings.
- Booking approvals.
- Email reminders and cancellation notifications.
- Calendar view and drag-to-reschedule.
- Resource maintenance blocks.
- QR code check-in.
- Organization and department support.
- Booking utilization reports.
- Integration with Microsoft 365 or Google Calendar.
