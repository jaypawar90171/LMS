# Library Management System Backend

This is the backend API for the Library Management System.

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4 or higher)

### Installation

1. Clone the repository
2. Navigate to the backend directory
```
cd backend
```

3. Install dependencies
```
npm install
```

4. Create environment-specific `.env` files in the root directory:

   a. For development (`.env.development`):
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/library-management-dev
   JWT_SECRET=dev_jwt_secret_key_here
   JWT_EXPIRY=24h
   REFRESH_TOKEN_SECRET=dev_refresh_token_secret_here
   REFRESH_TOKEN_EXPIRY=7d
   
   # Email configuration
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USER=dev_email@example.com
   EMAIL_PASS=dev_email_password
   EMAIL_FROM=dev-noreply@library-management.com
   
   # Set to 'true' to mock emails instead of sending them
   USE_MOCK_EMAIL=true
   
   # Frontend URL for reset password links
   FRONTEND_URL=http://localhost:3000
   ```

   b. For testing (`.env.test`):
   ```
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/library-management-test
   JWT_SECRET=test_jwt_secret_key_here
   JWT_EXPIRY=1h
   REFRESH_TOKEN_SECRET=test_refresh_token_secret_here
   REFRESH_TOKEN_EXPIRY=1d
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USER=test_email@example.com
   EMAIL_PASS=test_email_password
   EMAIL_FROM=test-noreply@library-management.com
   ```

   c. For production (`.env.production`):
   ```
   PORT=8080
   MONGODB_URI=mongodb://localhost:27017/library-management-prod
   JWT_SECRET=prod_jwt_secret_key_here
   JWT_EXPIRY=12h
   REFRESH_TOKEN_SECRET=prod_refresh_token_secret_here
   REFRESH_TOKEN_EXPIRY=7d
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USER=prod_email@example.com
   EMAIL_PASS=prod_email_password
   EMAIL_FROM=noreply@library-management.com
   ```

5. Set up the database schema and indexes

   For development environment:
   ```
   npm run migrate:dev
   ```

   For test environment:
   ```
   npm run migrate:test
   ```

   For production environment:
   ```
   npm run migrate:prod
   ```

6. (Optional) Set up schema validation

   For development environment:
   ```
   npm run validate-schema:dev
   ```

   For test environment:
   ```
   npm run validate-schema:test
   ```

   For production environment:
   ```
   npm run validate-schema:prod
   ```

7. Initialize the database with default roles and a super admin user

   For development environment:
   ```
   npm run init-db:dev
   ```

   For test environment:
   ```
   npm run init-db:test
   ```

   For production environment:
   ```
   npm run init-db:prod
   ```

8. Start the server

   For production:
   ```
   npm start
   ```

   For development with auto-reload:
   ```
   npm run dev
   ```

   For test environment:
   ```
   npm run test-env
   ```

## API Documentation

### Authentication Endpoints

- **POST /api/admin/auth/login**
  - Description: Authenticates admin users and returns JWT token
  - Request: `{ emailOrUsername, password, rememberMe, captchaToken }`

- **POST /api/admin/auth/forgot-password**
  - Description: Initiates password reset process for admin users
  - Request: `{ email }`

- **GET /api/admin/auth/validate-reset-token**
  - Description: Validates password reset token before showing reset form
  - Query params: `token`

- **POST /api/admin/auth/reset-password**
  - Description: Resets admin user password using valid token
  - Request: `{ token, newPassword }`

- **POST /api/admin/auth/logout**
  - Description: Logs out admin user and invalidates tokens

### Dashboard Endpoints

- **GET /api/admin/dashboard-summary**
  - Description: Retrieves summary statistics and recent activities for admin dashboard

### User Management Endpoints

- **GET /api/admin/users**
  - Description: Lists users with filtering, sorting, and pagination
  - Query params: search, role, status, page, limit, sortBy, sortOrder

- **GET /api/admin/users/:userId**
  - Description: Retrieves detailed information for a specific user

- **POST /api/admin/users**
  - Description: Creates a new user account
  - Request: { fullName, employeeId, email, phoneNumber, dateOfBirth, address, relationshipType, employeeReference, roles }

- **PUT /api/admin/users/:userId**
  - Description: Updates an existing user's information
  - Request: { fullName, employeeId, email, phoneNumber, dateOfBirth, address, relationshipType, employeeReference, roles }

- **PATCH /api/admin/users/:userId/status**
  - Description: Activates or deactivates a user account
  - Request: { status }

- **POST /api/admin/users/:userId/reset-password**
  - Description: Admin-initiated password reset for a specific user

- **POST /api/admin/users/:userId/unlock**
  - Description: Unlocks a user account that was locked due to failed login attempts

### Role & Permission Management Endpoints

- **GET /api/admin/roles**
  - Description: Lists all roles with their descriptions and user counts

- **GET /api/admin/roles/:roleId**
  - Description: Retrieves detailed information for a specific role including permissions

- **POST /api/admin/roles**
  - Description: Creates a new role with specified permissions
  - Request: { name, description, permissions }

- **PUT /api/admin/roles/:roleId**
  - Description: Updates an existing role's information and permissions
  - Request: { name, description, permissions }

- **DELETE /api/admin/roles/:roleId**
  - Description: Deletes a role if no users are assigned to it

- **GET /api/admin/permissions**
  - Description: Lists all available system permissions grouped by module

- **POST /api/admin/roles/clone**
  - Description: Clones an existing role with a new name
  - Request: { sourceRoleId, name, description }

- **POST /api/admin/roles/compare**
  - Description: Compares permissions between multiple roles
  - Request: { roleIds }

- **GET /api/admin/roles/statistics**
  - Description: Retrieves statistics about roles and their usage

- **POST /api/admin/roles/assign**
  - Description: Assigns a role to multiple users
  - Request: { roleId, userIds }

- **POST /api/admin/roles/remove**
  - Description: Removes a role from multiple users
  - Request: { roleId, userIds }

- **GET /api/admin/roles/:roleId/users**
  - Description: Lists all users with a specific role
  - Query params: page, limit

## Email Configuration

The system can be configured to handle emails in different ways:

### Real Email Sending

To send actual emails, configure the following in your .env file:
```
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
EMAIL_FROM=noreply@your-domain.com
USE_MOCK_EMAIL=false
```

### Mock Email (Development Mode)

For development, you can use mock emails that are logged to the console instead of being sent:
```
USE_MOCK_EMAIL=true
```

### Testing Email Configuration

To test if your email configuration is working:
```
npm run test-email
```

If you encounter issues with email functionality, see `utils/EMAIL_TROUBLESHOOTING.md` for detailed troubleshooting steps.

## Database Schema

The system uses MongoDB with the following collections:

1. **users** - User accounts (admins, employees, family members)
2. **roles** - User roles and permissions
3. **tokens** - Authentication tokens
4. **items** - Inventory items (books, courses, toys)
5. **itemCopies** - Individual copies of items
6. **categories** - Item categories and subcategories
7. **transactions** - Item issues and returns
8. **fines** - Fines for overdue, damaged, or lost items
9. **donations** - Donation offers
10. **reminders** - Reminder rules
11. **reminderTemplates** - Templates for notifications
12. **queues** - Item waiting queues

For detailed information about the database schema and migration process, see `utils/DB_MIGRATION_README.md`.

For detailed information about the Role & Permission Management module, see `docs/ROLE_MANAGEMENT.md`.

For detailed information about the Inventory Management module, see `docs/INVENTORY_MANAGEMENT.md`.

For detailed information about the Library Operations module, see `docs/LIBRARY_OPERATIONS.md`.

For detailed information about the Fine Management module, see `docs/FINE_MANAGEMENT.md`.

For detailed information about the Reminder Management module, see `docs/REMINDER_MANAGEMENT.md`.

For detailed information about the Donation Management module, see `docs/DONATION_MANAGEMENT.md`.

For detailed information about the Reports module, see `docs/REPORTS.md`.

For detailed information about the Settings module, see `docs/SETTINGS.md`.

For detailed information about the Mobile App backend, see `docs/MOBILE_APP.md`.

## Default Super Admin Credentials

- Email: admin@library.com
- Password: Admin@123

**Important:** Change the default password after first login for security reasons.