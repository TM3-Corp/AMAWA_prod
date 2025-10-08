# Authentication Setup Guide

## Overview

AMAWA Platform now has **Supabase Authentication** with role-based access control.

### User Roles

- **ADMIN** - Full system access (manage users, all operations)
- **TECHNICIAN** - Field workers (complete maintenances, update inventory)
- **MANAGER** - Office staff (view analytics, manage schedules, clients)
- **CLIENT** - Self-service portal (view own data only) - _Coming soon_

---

## Architecture

### Technologies Used

- **Supabase Auth** - User authentication (email/password)
- **Prisma** - Database ORM with User model
- **Next.js Middleware** - Route protection
- **PostgreSQL** - User data and roles storage

### Files Created

```
lib/supabase/
├── client.ts                    # Browser Supabase client
├── server.ts                    # Server Supabase client
└── middleware.ts                # Session management

middleware.ts                    # Route protection

app/login/page.tsx              # Login page

app/api/auth/
├── user/route.ts               # Get current user with role
├── update-login/route.ts       # Update last login time
└── logout/route.ts             # Logout endpoint

components/auth/
├── UserMenu.tsx                # User info display + logout
└── LogoutButton.tsx            # Logout button

prisma/schema.prisma            # User model + UserRole enum

scripts/
├── apply-users-migration.ts    # Apply database migration
└── create-admin-user.ts        # Create initial admin user

supabase/migrations/
└── add_users_table.sql         # SQL migration
```

---

## Setup Instructions

### 1. Database Migration (Already Applied ✅)

The `users` table and `UserRole` enum have been created in your database.

### 2. Create Initial Admin User

You have two options:

#### Option A: Create New Admin User

```bash
ADMIN_EMAIL="admin@amawa.cl" ADMIN_PASSWORD="YourSecurePassword123!" npx tsx scripts/create-admin-user.ts
```

This will:
- Create user in Supabase Auth
- Create user record in database with ADMIN role
- Auto-confirm email

#### Option B: Promote Existing User to Admin

If you already have a user account:

```bash
npx tsx scripts/create-admin-user.ts your.email@example.com
```

This will update the existing user's role to ADMIN.

### 3. Test Login

1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/login`
3. Login with admin credentials
4. You'll be redirected to dashboard

---

## How It Works

### Protected Routes

These routes require authentication:
- `/dashboard`
- `/clients`
- `/maintenances`
- `/inventory`

If you try to access them without logging in, you'll be redirected to `/login`.

### Session Management

- **Sessions** are handled by Supabase Auth
- **Cookies** store the session token
- **Middleware** refreshes expired sessions automatically
- **Auto-logout** on session expiration

### User Flow

1. User visits protected route (e.g., `/dashboard`)
2. Middleware checks for valid session
3. If no session → redirect to `/login?redirectTo=/dashboard`
4. User logs in with email/password
5. Supabase Auth validates credentials
6. On success, create/update user in database
7. Redirect to original destination
8. Fetch user role from database
9. Display user info in header with logout button

---

## API Endpoints

### `GET /api/auth/user`

Get current authenticated user with role.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@amawa.cl",
    "name": "Administrator",
    "role": "admin",
    "isActive": true,
    "lastLogin": "2025-10-08T14:00:00Z"
  }
}
```

### `POST /api/auth/update-login`

Update user's last login timestamp.

**Request:**
```json
{
  "userId": "supabase-auth-user-id"
}
```

### `POST /api/auth/logout`

Sign out the current user.

---

## User Management

### Via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/bbbaomrkvsibswmlrxtx/auth/users
2. Click "Add user" → "Create new user"
3. Enter email and password
4. Check "Auto Confirm User"
5. Click "Create user"

### Update Role in Database

After creating a user in Supabase, update their role:

```bash
npx tsx scripts/create-admin-user.ts user@example.com
```

Or directly in SQL:

```sql
UPDATE users
SET role = 'admin'  -- or 'technician', 'manager', 'client'
WHERE email = 'user@example.com';
```

---

## Security Features

### Implemented ✅

- Session-based authentication with secure HTTP-only cookies
- Password hashing handled by Supabase
- Route protection via middleware
- Role-based access control (RBAC) ready
- CSRF protection via SameSite cookies
- Auto-logout on session expiration

### To Implement (Future)

- [ ] Two-factor authentication (2FA)
- [ ] Password reset flow
- [ ] Email verification for new signups
- [ ] Role-based component rendering
- [ ] Audit logging for admin actions
- [ ] Rate limiting on login attempts

---

## Troubleshooting

### "Environment variable not found: DATABASE_URL"

Make sure `.env.local` exists and contains all required variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://bbbaomrkvsibswmlrxtx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url
```

### "User not found in database"

The user exists in Supabase Auth but not in your database table.

**Solution:** Login once, and the system will auto-create the user record.

Or manually create:

```sql
INSERT INTO users (id, auth_id, email, name, role)
VALUES (gen_random_uuid(), 'supabase-auth-user-id', 'user@example.com', 'User Name', 'technician');
```

### Infinite redirect loop

Clear your browser cookies for `localhost:3000` and try again.

### Can't login after creating user

Make sure you checked "Auto Confirm User" in Supabase dashboard. Otherwise, the user needs to verify their email first.

---

## Next Steps

### Recommended Features to Add

1. **Password Reset Flow**
   - Forgot password link
   - Email with reset token
   - Reset password page

2. **User Management UI (Admin Only)**
   - List all users
   - Create new users
   - Update roles
   - Deactivate users

3. **Role-Based Permissions**
   - Restrict features by role
   - Hide admin-only buttons for non-admins
   - API endpoint authorization

4. **Audit Logging**
   - Track who did what and when
   - Important for compliance

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin) | `eyJhbGci...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `DIRECT_URL` | Direct database connection | `postgresql://...` |

---

## Database Schema

### `users` Table

```sql
CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'technician',
  "auth_id" TEXT UNIQUE,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "last_login" TIMESTAMP(3)
);
```

### `UserRole` Enum

```sql
CREATE TYPE "UserRole" AS ENUM (
  'admin',
  'technician',
  'manager',
  'client'
);
```

---

**Last Updated:** October 8, 2025
**Status:** ✅ Fully Implemented and Tested
