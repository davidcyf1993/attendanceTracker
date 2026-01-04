# Attendance Tracker MVC Revamp Plan

## Overview

This document outlines the plan to revamp the current HTML-based Attendance Tracker application into a full MVC (Model-View-Controller) architecture with database persistence and user authentication.

---

## 1. Database Structure

### 1.1 Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Users       │     │    Attendees    │     │     Events      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ Id (PK)         │     │ Id (PK)         │     │ Id (PK)         │
│ Username        │     │ AttendeeCode    │     │ EventCode       │
│ Email           │     │ FullName        │     │ EventName       │
│ PasswordHash    │     │ NickName        │     │ EventType       │
│ Role            │     │ CreatedAt       │     │ DatetimeFrom    │
│ CreatedAt       │     │ UpdatedAt       │     │ DatetimeTo      │
│ UpdatedAt       │     │ CreatedByUserId │     │ CreatedAt       │
│ LastLoginAt     │     │ IsActive        │     │ UpdatedAt       │
└─────────────────┘     └─────────────────┘     │ CreatedByUserId │
                                                │ IsActive        │
                                                └─────────────────┘
                                                        │
                                                        │
                        ┌───────────────────────────────┴───────────────────────────────┐
                        │                                                               │
                        ▼                                                               ▼
              ┌─────────────────────┐                                     ┌─────────────────────┐
              │ AttendanceRecords   │                                     │    EventTypes       │
              ├─────────────────────┤                                     ├─────────────────────┤
              │ Id (PK)             │                                     │ Id (PK)             │
              │ AttendeeId (FK)     │                                     │ TypeName            │
              │ EventId (FK)        │                                     │ Description         │
              │ IsPresent           │                                     │ CreatedAt           │
              │ MarkedAt            │                                     │ IsActive            │
              │ MarkedByUserId (FK) │                                     └─────────────────────┘
              │ Notes               │
              └─────────────────────┘
```

### 1.2 Table Definitions

#### Users Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | INT | PK, Identity | Primary key |
| Username | NVARCHAR(50) | NOT NULL, UNIQUE | Login username |
| Email | NVARCHAR(255) | NOT NULL, UNIQUE | User email address |
| PasswordHash | NVARCHAR(255) | NOT NULL | Hashed password |
| Role | NVARCHAR(20) | NOT NULL, DEFAULT 'User' | User role (Admin, User, Viewer) |
| CreatedAt | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() | Account creation timestamp |
| UpdatedAt | DATETIME2 | NULL | Last update timestamp |
| LastLoginAt | DATETIME2 | NULL | Last login timestamp |
| IsActive | BIT | NOT NULL, DEFAULT 1 | Soft delete flag |

#### Attendees Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | INT | PK, Identity | Primary key |
| AttendeeCode | NVARCHAR(20) | NOT NULL, UNIQUE | Attendee identifier (e.g., A001) |
| FullName | NVARCHAR(100) | NOT NULL | Attendee's full name |
| NickName | NVARCHAR(50) | NULL | Attendee's nickname/alias |
| CreatedAt | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() | Record creation timestamp |
| UpdatedAt | DATETIME2 | NULL | Last update timestamp |
| CreatedByUserId | INT | FK → Users.Id | User who created the record |
| IsActive | BIT | NOT NULL, DEFAULT 1 | Soft delete flag |

#### Events Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | INT | PK, Identity | Primary key |
| EventCode | NVARCHAR(20) | NOT NULL, UNIQUE | Event identifier (e.g., E001) |
| EventName | NVARCHAR(200) | NOT NULL | Event name/title |
| EventType | NVARCHAR(50) | NOT NULL | Event category |
| DatetimeFrom | DATETIME2 | NOT NULL | Event start datetime |
| DatetimeTo | DATETIME2 | NOT NULL | Event end datetime |
| CreatedAt | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() | Record creation timestamp |
| UpdatedAt | DATETIME2 | NULL | Last update timestamp |
| CreatedByUserId | INT | FK → Users.Id | User who created the record |
| IsActive | BIT | NOT NULL, DEFAULT 1 | Soft delete flag |

#### AttendanceRecords Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | INT | PK, Identity | Primary key |
| AttendeeId | INT | FK → Attendees.Id, NOT NULL | Reference to attendee |
| EventId | INT | FK → Events.Id, NOT NULL | Reference to event |
| IsPresent | BIT | NOT NULL | Attendance status (1=Present, 0=Absent) |
| MarkedAt | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() | When attendance was marked |
| MarkedByUserId | INT | FK → Users.Id | User who marked attendance |
| Notes | NVARCHAR(500) | NULL | Optional notes |

**Unique Constraint:** (AttendeeId, EventId) - Each attendee can only have one record per event.

#### EventTypes Table (Optional - for standardizing event types)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | INT | PK, Identity | Primary key |
| TypeName | NVARCHAR(50) | NOT NULL, UNIQUE | Event type name |
| Description | NVARCHAR(200) | NULL | Type description |
| CreatedAt | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() | Record creation timestamp |
| IsActive | BIT | NOT NULL, DEFAULT 1 | Soft delete flag |

### 1.3 SQL Create Scripts

```sql
-- Users Table
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL DEFAULT 'User',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    LastLoginAt DATETIME2 NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

-- EventTypes Table
CREATE TABLE EventTypes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TypeName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(200) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1
);

-- Attendees Table
CREATE TABLE Attendees (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AttendeeCode NVARCHAR(20) NOT NULL UNIQUE,
    FullName NVARCHAR(100) NOT NULL,
    NickName NVARCHAR(50) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    CreatedByUserId INT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_Attendees_Users FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id)
);

-- Events Table
CREATE TABLE Events (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EventCode NVARCHAR(20) NOT NULL UNIQUE,
    EventName NVARCHAR(200) NOT NULL,
    EventType NVARCHAR(50) NOT NULL,
    DatetimeFrom DATETIME2 NOT NULL,
    DatetimeTo DATETIME2 NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    CreatedByUserId INT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_Events_Users FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id)
);

-- AttendanceRecords Table
CREATE TABLE AttendanceRecords (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AttendeeId INT NOT NULL,
    EventId INT NOT NULL,
    IsPresent BIT NOT NULL,
    MarkedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    MarkedByUserId INT NULL,
    Notes NVARCHAR(500) NULL,
    CONSTRAINT FK_AttendanceRecords_Attendees FOREIGN KEY (AttendeeId) REFERENCES Attendees(Id),
    CONSTRAINT FK_AttendanceRecords_Events FOREIGN KEY (EventId) REFERENCES Events(Id),
    CONSTRAINT FK_AttendanceRecords_Users FOREIGN KEY (MarkedByUserId) REFERENCES Users(Id),
    CONSTRAINT UQ_AttendanceRecords_Attendee_Event UNIQUE (AttendeeId, EventId)
);

-- Indexes for better query performance
CREATE INDEX IX_Attendees_FullName ON Attendees(FullName);
CREATE INDEX IX_Attendees_AttendeeCode ON Attendees(AttendeeCode);
CREATE INDEX IX_Events_EventType ON Events(EventType);
CREATE INDEX IX_Events_DatetimeFrom ON Events(DatetimeFrom);
CREATE INDEX IX_AttendanceRecords_EventId ON AttendanceRecords(EventId);
CREATE INDEX IX_AttendanceRecords_AttendeeId ON AttendanceRecords(AttendeeId);
```

---

## 2. API Endpoints

### 2.1 Authentication APIs

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/auth/login` | User login | `{ username, password }` | `{ token, user, expiresAt }` |
| POST | `/api/auth/logout` | User logout | - | `{ success }` |
| POST | `/api/auth/register` | Register new user (Admin only) | `{ username, email, password, role }` | `{ user }` |
| POST | `/api/auth/refresh` | Refresh auth token | `{ refreshToken }` | `{ token, expiresAt }` |
| GET | `/api/auth/me` | Get current user info | - | `{ user }` |
| PUT | `/api/auth/change-password` | Change password | `{ currentPassword, newPassword }` | `{ success }` |

### 2.2 Attendee APIs

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/attendees` | Get all attendees | - | `[{ id, attendeeCode, fullName, nickName, ... }]` |
| GET | `/api/attendees/{id}` | Get attendee by ID | - | `{ id, attendeeCode, fullName, nickName, ... }` |
| GET | `/api/attendees/search?q={query}` | Search attendees | - | `[{ attendee }]` |
| POST | `/api/attendees` | Create new attendee | `{ attendeeCode, fullName, nickName }` | `{ attendee }` |
| PUT | `/api/attendees/{id}` | Update attendee | `{ fullName, nickName }` | `{ attendee }` |
| DELETE | `/api/attendees/{id}` | Delete attendee (soft delete) | - | `{ success }` |
| POST | `/api/attendees/import` | Bulk import from Excel | FormData with file | `{ imported, failed, errors }` |
| GET | `/api/attendees/export` | Export attendees to Excel | - | Excel file download |

### 2.3 Event APIs

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/events` | Get all events | - | `[{ id, eventCode, eventName, eventType, ... }]` |
| GET | `/api/events/{id}` | Get event by ID | - | `{ event }` |
| GET | `/api/events/search?q={query}` | Search events | - | `[{ event }]` |
| GET | `/api/events/types` | Get all event types | - | `[{ typeName }]` |
| POST | `/api/events` | Create new event | `{ eventCode, eventName, eventType, datetimeFrom, datetimeTo }` | `{ event }` |
| PUT | `/api/events/{id}` | Update event | `{ eventName, eventType, datetimeFrom, datetimeTo }` | `{ event }` |
| DELETE | `/api/events/{id}` | Delete event (soft delete) | - | `{ success }` |
| POST | `/api/events/import` | Bulk import from Excel | FormData with file | `{ imported, failed, errors }` |
| GET | `/api/events/export` | Export events to Excel | - | Excel file download |

### 2.4 Attendance APIs

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/attendance/event/{eventId}` | Get attendance for event | - | `[{ attendee, isPresent, markedAt }]` |
| GET | `/api/attendance/attendee/{attendeeId}` | Get attendance for attendee | - | `[{ event, isPresent, markedAt }]` |
| POST | `/api/attendance/mark` | Mark single attendance | `{ attendeeId, eventId, isPresent }` | `{ record }` |
| POST | `/api/attendance/mark-batch` | Mark batch attendance | `[{ attendeeId, eventId, isPresent }]` | `{ success, updated }` |
| GET | `/api/attendance/summary` | Get attendance summary | Query params: `eventType`, `dateFrom`, `dateTo` | `[{ attendee, totalEvents, attended, rate }]` |
| GET | `/api/attendance/event-summary/{eventId}` | Get event attendance summary | - | `{ totalAttendees, present, absent, rate }` |
| POST | `/api/attendance/import` | Import attendance from Excel | FormData with file | `{ imported, failed, errors }` |
| GET | `/api/attendance/export` | Export all data to Excel | Query params: `eventType`, `dateFrom`, `dateTo` | Excel file download |

### 2.5 User Management APIs (Admin only)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/users` | Get all users | - | `[{ id, username, email, role, ... }]` |
| GET | `/api/users/{id}` | Get user by ID | - | `{ user }` |
| POST | `/api/users` | Create new user | `{ username, email, password, role }` | `{ user }` |
| PUT | `/api/users/{id}` | Update user | `{ email, role, isActive }` | `{ user }` |
| DELETE | `/api/users/{id}` | Deactivate user | - | `{ success }` |
| POST | `/api/users/{id}/reset-password` | Reset user password | `{ newPassword }` | `{ success }` |

### 2.6 API Response Format

#### Success Response
```json
{
    "success": true,
    "data": { ... },
    "message": "Operation completed successfully"
}
```

#### Error Response
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Error description",
        "details": [ ... ]
    }
}
```

#### Pagination Response
```json
{
    "success": true,
    "data": [ ... ],
    "pagination": {
        "page": 1,
        "pageSize": 20,
        "totalItems": 100,
        "totalPages": 5
    }
}
```

---

## 3. Web Pages / Views

### 3.1 Page Structure

```
├── Authentication
│   ├── Login Page
│   └── Change Password Page
│
├── Dashboard
│   └── Home / Overview Page
│
├── Attendance Management
│   ├── Take Attendance Page
│   │   ├── Select Event View
│   │   └── Mark Attendance View
│   └── Attendance Summary Page
│
├── Attendee Management
│   ├── Attendee List Page
│   └── Attendee Form Page (Create/Edit)
│
├── Event Management
│   ├── Event List Page
│   └── Event Form Page (Create/Edit)
│
├── Data Import/Export
│   ├── Import Data Page
│   └── Export Data Page
│
└── Administration (Admin only)
    ├── User Management Page
    └── System Settings Page
```

### 3.2 Page Descriptions

#### 3.2.1 Login Page (`/login`)
- **Purpose:** User authentication
- **Features:**
  - Username/email input field
  - Password input field
  - "Remember me" checkbox
  - Login button
  - Forgot password link (optional)
- **Access:** Public (unauthenticated users only)

#### 3.2.2 Home / Dashboard Page (`/` or `/dashboard`)
- **Purpose:** Main landing page after login
- **Features:**
  - Quick statistics overview (total attendees, events, recent attendance rate)
  - Recent events list
  - Quick action buttons (Take Attendance, Add Event, Add Attendee)
  - Upcoming events calendar/list
- **Access:** Authenticated users

#### 3.2.3 Take Attendance Page (`/attendance/take`)
- **Purpose:** Mark attendance for an event
- **Features:**
  - Step 1: Event Selection
    - Dropdown/list of events sorted by date (newest first)
    - "Create New Event" button
  - Step 2: Mark Attendance
    - List of all attendees with checkboxes
    - Search/filter by name or nickname
    - Select all / Deselect all buttons
    - Auto-save on checkbox change
    - Save button to confirm
    - Back button to change event
- **Access:** Authenticated users

#### 3.2.4 Attendance Summary Page (`/attendance/summary`)
- **Purpose:** View and analyze attendance statistics
- **Features:**
  - Filter controls:
    - Event type filter
    - Date range filter (from/to)
    - Attendee search
  - Summary table showing:
    - Attendee name
    - Nickname
    - Total events (filtered)
    - Attended count
    - Attendance rate percentage
  - Sort by any column
  - Export to Excel button
- **Access:** Authenticated users

#### 3.2.5 Attendee List Page (`/attendees`)
- **Purpose:** View and manage attendees
- **Features:**
  - Searchable/filterable list of attendees
  - Sortable columns (ID, Name, Nickname)
  - Add new attendee button
  - Edit and delete action buttons per row
  - Pagination
  - Import from Excel button
  - Export to Excel button
- **Access:** Authenticated users

#### 3.2.6 Attendee Form Page (`/attendees/new`, `/attendees/{id}/edit`)
- **Purpose:** Create or edit attendee
- **Features:**
  - Form fields:
    - Attendee Code (auto-generated for new, read-only for edit)
    - Full Name (required)
    - Nickname (optional)
  - Save button
  - Cancel button
  - Delete button (edit mode only)
- **Access:** Authenticated users

#### 3.2.7 Event List Page (`/events`)
- **Purpose:** View and manage events
- **Features:**
  - Searchable/filterable list of events
  - Sortable columns (ID, Name, Type, Date, Attendance %)
  - Add new event button
  - Edit and delete action buttons per row
  - Pagination
  - Import from Excel button
  - Export to Excel button
- **Access:** Authenticated users

#### 3.2.8 Event Form Page (`/events/new`, `/events/{id}/edit`)
- **Purpose:** Create or edit event
- **Features:**
  - Form fields:
    - Event Code (auto-generated for new, read-only for edit)
    - Event Name (required)
    - Event Type (typeahead with existing types)
    - Start Datetime (required)
    - End Datetime (required)
  - Save button
  - Cancel button
  - Delete button (edit mode only)
- **Access:** Authenticated users

#### 3.2.9 Import Data Page (`/import`)
- **Purpose:** Import data from Excel files
- **Features:**
  - File upload area
  - Import type selection (Attendees, Events, Full Data)
  - Download template button
  - Preview of data before import
  - Import progress indicator
  - Results summary (success, failed, errors)
- **Access:** Authenticated users

#### 3.2.10 Export Data Page (`/export`)
- **Purpose:** Export data to Excel files
- **Features:**
  - Export type selection (Attendees, Events, Attendance, Full Data)
  - Date range filter for attendance
  - Event type filter
  - Download button
- **Access:** Authenticated users

#### 3.2.11 User Management Page (`/admin/users`) - Admin Only
- **Purpose:** Manage system users
- **Features:**
  - List of all users
  - Add new user button
  - Edit user (change role, activate/deactivate)
  - Reset password
  - Delete user
- **Access:** Admin users only

#### 3.2.12 Change Password Page (`/account/change-password`)
- **Purpose:** Allow users to change their password
- **Features:**
  - Current password field
  - New password field
  - Confirm new password field
  - Change password button
- **Access:** Authenticated users

---

## 4. Login / Authentication System

### 4.1 Authentication Method

Use **JWT (JSON Web Token)** based authentication with the following flow:

1. User submits credentials (username/email + password)
2. Server validates credentials against database
3. If valid, server generates JWT token with user info and expiration
4. Token is returned to client and stored (cookie or localStorage)
5. Client includes token in Authorization header for subsequent requests
6. Server validates token on each protected request

### 4.2 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access - manage users, all CRUD operations, import/export |
| **User** | Standard access - CRUD operations, import/export, take attendance |
| **Viewer** | Read-only access - view data, export only |

### 4.3 Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (optional but recommended)

### 4.4 Security Features

- Password hashing using BCrypt or PBKDF2
- JWT token expiration (configurable, default: 24 hours)
- Refresh token mechanism for extended sessions
- Account lockout after failed login attempts (e.g., 5 attempts = 15 min lockout)
- HTTPS enforcement
- CORS configuration
- Anti-CSRF tokens for forms
- Input validation and sanitization

### 4.5 Session Management

```
┌────────────────────────────────────────────────────────────────┐
│                    Authentication Flow                          │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Login Request                                               │
│     POST /api/auth/login { username, password }                 │
│                    │                                            │
│                    ▼                                            │
│  2. Validate credentials against DB                             │
│                    │                                            │
│                    ▼                                            │
│  3. Generate JWT Token                                          │
│     - Include: userId, username, role, exp                      │
│                    │                                            │
│                    ▼                                            │
│  4. Return token to client                                      │
│     { token: "eyJhbG...", expiresAt: "2025-01-05T..." }        │
│                    │                                            │
│                    ▼                                            │
│  5. Client stores token (cookie/localStorage)                   │
│                    │                                            │
│                    ▼                                            │
│  6. Subsequent requests include:                                │
│     Authorization: Bearer eyJhbG...                             │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Project Structure (ASP.NET Core MVC)

```
AttendanceTracker/
├── AttendanceTracker.Web/                    # MVC Web Project
│   ├── Controllers/
│   │   ├── AccountController.cs              # Login, logout, password
│   │   ├── HomeController.cs                 # Dashboard
│   │   ├── AttendeeController.cs             # Attendee pages
│   │   ├── EventController.cs                # Event pages
│   │   ├── AttendanceController.cs           # Attendance pages
│   │   └── AdminController.cs                # Admin pages
│   ├── Views/
│   │   ├── Account/
│   │   │   ├── Login.cshtml
│   │   │   └── ChangePassword.cshtml
│   │   ├── Home/
│   │   │   └── Index.cshtml
│   │   ├── Attendee/
│   │   │   ├── Index.cshtml
│   │   │   └── Form.cshtml
│   │   ├── Event/
│   │   │   ├── Index.cshtml
│   │   │   └── Form.cshtml
│   │   ├── Attendance/
│   │   │   ├── Take.cshtml
│   │   │   └── Summary.cshtml
│   │   ├── Admin/
│   │   │   └── Users.cshtml
│   │   └── Shared/
│   │       ├── _Layout.cshtml
│   │       ├── _LoginLayout.cshtml
│   │       └── _Partial*.cshtml
│   ├── wwwroot/
│   │   ├── css/
│   │   ├── js/
│   │   └── lib/
│   └── Program.cs
│
├── AttendanceTracker.Api/                    # Web API Project (optional - for SPA)
│   └── Controllers/
│       ├── AuthController.cs
│       ├── AttendeesController.cs
│       ├── EventsController.cs
│       ├── AttendanceController.cs
│       └── UsersController.cs
│
├── AttendanceTracker.Core/                   # Business Logic Layer
│   ├── Entities/
│   │   ├── User.cs
│   │   ├── Attendee.cs
│   │   ├── Event.cs
│   │   └── AttendanceRecord.cs
│   ├── Interfaces/
│   │   ├── IUserService.cs
│   │   ├── IAttendeeService.cs
│   │   ├── IEventService.cs
│   │   └── IAttendanceService.cs
│   ├── Services/
│   │   ├── UserService.cs
│   │   ├── AttendeeService.cs
│   │   ├── EventService.cs
│   │   └── AttendanceService.cs
│   └── DTOs/
│       ├── LoginDto.cs
│       ├── AttendeeDto.cs
│       ├── EventDto.cs
│       └── AttendanceDto.cs
│
├── AttendanceTracker.Data/                   # Data Access Layer
│   ├── ApplicationDbContext.cs
│   ├── Repositories/
│   │   ├── UserRepository.cs
│   │   ├── AttendeeRepository.cs
│   │   ├── EventRepository.cs
│   │   └── AttendanceRepository.cs
│   └── Migrations/
│
└── AttendanceTracker.Tests/                  # Unit Tests
    ├── ServiceTests/
    └── ControllerTests/
```

---

## 6. Technology Stack Recommendations

| Layer | Technology |
|-------|------------|
| **Frontend** | Bootstrap 5, jQuery or vanilla JS (existing), or upgrade to Vue.js/React |
| **Backend** | ASP.NET Core 8.0 MVC |
| **Database** | SQL Server / Azure SQL / PostgreSQL |
| **ORM** | Entity Framework Core |
| **Authentication** | ASP.NET Core Identity + JWT |
| **Excel Processing** | ClosedXML or EPPlus |
| **Logging** | Serilog |
| **Validation** | FluentValidation |

---

## 7. Migration Path

### Phase 1: Setup & Infrastructure
1. Create ASP.NET Core MVC project
2. Setup database with Entity Framework Core
3. Implement authentication system
4. Create basic layout and navigation

### Phase 2: Core Features
1. Implement Attendee CRUD
2. Implement Event CRUD
3. Implement Attendance tracking
4. Implement Attendance summary

### Phase 3: Data Migration
1. Create import functionality from Excel
2. Migrate existing data from current localStorage/Excel files
3. Test data integrity

### Phase 4: Enhanced Features
1. User management (Admin)
2. Export functionality
3. Advanced filtering and search
4. Responsive design optimization

### Phase 5: Testing & Deployment
1. Unit and integration testing
2. User acceptance testing
3. Performance optimization
4. Deployment to production

---

## 8. Summary

This MVC revamp will transform the current client-side HTML application into a robust, multi-user web application with:

- ✅ Persistent database storage
- ✅ User authentication and authorization
- ✅ Role-based access control
- ✅ RESTful API endpoints
- ✅ Maintainable MVC architecture
- ✅ Excel import/export capability
- ✅ Audit trail (CreatedBy, UpdatedAt)
- ✅ Soft delete for data safety

