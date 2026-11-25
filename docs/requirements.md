# SlotWise — Software Requirements Specification (SRS)

**Version:** 1.1  
**Status:** Implemented MVP baseline  
**Target delivery:** 2–3 weeks  
**Backend:** ASP.NET Core Web API (.NET 10), C#  
**Frontend:** React.js (JavaScript/JSX)  
**Database:** Microsoft SQL Server

## 1. Purpose
SlotWise is a web application that allows employees to discover and reserve shared resources such as meeting rooms, projectors, vehicles, and equipment. It prevents overlapping reservations and provides a central view of bookings.

## 2. Problem statement
Small organizations frequently coordinate shared resources using spreadsheets, chat messages, or email. This leads to double bookings, poor visibility, and time spent confirming availability. SlotWise provides a centralized resource catalog and booking workflow.

## 3. Goals
- Centralize shared resource availability and reservations.
- Prevent two confirmed bookings from overlapping for the same resource.
- Let users create, view, and cancel their own future bookings.
- Let administrators manage offices, resources, and view all bookings.
- Let employees find available resources across all offices or within a selected office.
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
- Active office-location discovery and resource assignment.
- Workspace-wide and office-specific availability search.
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
| Admin | All user actions, create resources and offices, assign/deassign resources, deactivate offices, view all bookings, cancel any future booking |

All protected endpoints must enforce authorization on the server. Frontend visibility is not a security boundary.

## 6. Functional requirements

### FR-01 Registration
The system shall allow a user to register with display name, email, and password. Email must be unique. Password policy shall require at least eight characters and a digit.

**Acceptance:** Valid registration creates a User-role account. Invalid or duplicate registration returns a useful validation error.

### FR-02 Login
The system shall authenticate users using email and password and return a signed JWT with a three-hour expiry in an HttpOnly, SameSite authentication cookie.

**Acceptance:** Invalid credentials return HTTP 401. Protected endpoints reject missing, invalid, or expired tokens.

### FR-03 Resource catalog
The system shall display active resources with name, description, location, and capacity. Admins shall be able to create resources.

**Acceptance:** Users can view active resources. Non-admin users cannot create resources.

### FR-04 Availability
The system shall determine whether a resource is available for a requested time interval.

**Acceptance:** An interval conflicts when an existing confirmed booking has `existing.Start < requested.End AND existing.End > requested.Start`. Adjacent intervals are allowed. Availability is calculated for an individual resource and for all active, assigned-or-unassigned resources in the workspace.

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

### FR-10 Office locations
The system shall allow administrators to create, update, and deactivate office locations. An office shall have a name, address, city, optional state, country, latitude, longitude, and optional description. Users shall be able to discover active offices on a map or location sidebar and view active resources assigned to a selected office.

**Acceptance:** Inactive offices are hidden from ordinary users. Office coordinates are within valid latitude and longitude ranges. A resource may remain unassigned or be assigned to one active office.

### FR-11 Resource office assignment
Administrators shall be able to assign or remove a resource's office association. If future confirmed bookings exist, the administrator shall explicitly choose to move those bookings with the resource or cancel them.

**Acceptance:** Assignment validation requires an active office when an office ID is supplied. Moving an assignment preserves existing confirmed future bookings. Cancelling the affected bookings changes their status to Cancelled and releases their availability.

## 7. Business rules
1. Booking intervals use half-open semantics: `[start, end)`.
2. Two bookings conflict only if they belong to the same resource and overlap in time.
3. Cancelled bookings do not block availability.
4. A booking cannot exceed 12 hours.
5. All persisted booking timestamps are UTC.
6. Client-provided resource IDs and user IDs must be validated server-side.
7. The authenticated user's identity comes from JWT claims, never from a request body.
8. A booking and its conflict check must be committed atomically.
9. A resource may be unassigned or associated with one active office.
10. Deactivating an office hides its discovery and resources while preserving existing bookings.
11. Changing an assigned office may not silently affect future confirmed bookings.

## 8. Non-functional requirements
- Security: password hashing through ASP.NET Core Identity; JWT authentication delivered in an HttpOnly, SameSite cookie; role authorization.
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
- OfficeLocationId: nullable foreign key
- CreatedAtUtc: UTC timestamp

### Office locations
- Id: integer primary key
- Name: required, max 120
- Address: required, max 250
- City: required, max 120
- State: optional, max 120
- Country: required, max 120
- Latitude: decimal between -90 and 90
- Longitude: decimal between -180 and 180
- Description: optional, max 1000
- IsActive: boolean
- CreatedAt: UTC timestamp
- UpdatedAt: nullable UTC timestamp

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
| GET | `/api/office-locations` | User/Admin | List active offices, or all offices for Admin |
| GET | `/api/office-locations/{id}` | User/Admin | Get an office |
| POST | `/api/office-locations` | Admin | Create office |
| PUT | `/api/office-locations/{id}` | Admin | Update office |
| DELETE | `/api/office-locations/{id}` | Admin | Deactivate office |
| GET | `/api/office-locations/{id}/resources` | User/Admin | List resources assigned to an office |
| GET | `/api/office-locations/{id}/resources/availability` | User/Admin | Check office resources in a time window |
| PUT | `/api/resources/{id}/office-location` | Admin | Assign, reassign, or remove an office |

## 11. UI requirements
- Login and registration screen.
- Dashboard with resource count, active booking count, and total personal bookings.
- Resource cards with details and booking action.
- Office locations page with a workspace-wide time-window finder, map, office sidebar, and office resource browser.
- Booking dialog with calendar/time pickers for resource, start, end, and purpose, including a conflict-aware availability check.
- Personal booking list with status and cancellation action.
- Admin-only workspace screen to create and assign resources, create/update/deactivate offices, review all bookings, and cancel any future booking.
- Admin prompts to move or cancel future bookings when reassigning a resource.

## 12. Acceptance test checklist
- [ ] User can register.
- [ ] User can log in and receive an HttpOnly session cookie containing a JWT.
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
- [ ] Admin can create an office and assign a resource to it.
- [ ] Employees can find available resources across the workspace for a valid time window.
- [ ] Employees can browse active offices and the resources assigned to a selected office.
- [ ] Reassigning a resource with future bookings requires an explicit move or cancel decision.
- [ ] Deactivating an office hides it and its resources from employee discovery.

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
