# RentMaster
Property Management System
A scalable, maintainable web application for managing properties, tenants, leases, payments, and more. The backend is built with Node.js, TypeScript, and Express, using Prisma for database operations, Joi for validation, JWT for authentication, and Swagger for API documentation. The frontend is developed with React, Vite, TypeScript, and Tailwind CSS, leveraging Shadcn/UI for components and React Query for data fetching. The system follows a modular architecture with a focus on clean code, security, and modern UI/UX principles.
Features

User Management: Register, login, and role-based access (admin, manager).
Property Management: CRUD operations for properties and their locals (units).
Tenant Management: Manage tenant details (individuals or companies).
Lease Management: Create and track leases with billing cycles and statuses.
Payments: Record payments with modes (e.g., bank transfer, cash) and document uploads.
Documents: Upload and manage files (e.g., lease contracts, payment proofs) with S3 integration (optional).
Notifications: Send email, SMS, or system notifications with retry logic.
Audit Logs: Track user actions (create, update, delete, login, etc.) for accountability.
UI/UX: Responsive, accessible interface with intuitive navigation, forms, and data tables.
API Docs: Interactive Swagger UI for backend API exploration.

Tech Stack
Backend

Node.js: Runtime environment.
TypeScript: Static typing for maintainability.
Express: Web framework for API routes.
Prisma: ORM for PostgreSQL database interactions.
Joi: Input validation.
JWT: Token-based authentication.
Bcrypt: Password hashing.
Swagger: API documentation (swagger-ui-express, swagger-jsdoc).
Winston: Logging for debugging and audits.
Helmet: Security headers.
CORS: Frontend-backend communication.

Frontend

React: UI library.
Vite: Fast build tool.
TypeScript: Type safety.
Tailwind CSS: Utility-first CSS for styling.
Shadcn/UI: Customizable UI components.
React Router: Client-side routing.
React Hook Form + Zod: Form handling and validation.
React Query: Data fetching and caching.
Axios: API requests with JWT interceptors.

Database

PostgreSQL: Relational database with UUID, JSONB, and TIMESTAMP support.

Prerequisites

Node.js (>= 18)
PostgreSQL (create a database, e.g., property_management)
Yarn or npm
Optional: AWS S3 for document storage, email/SMS provider for notifications

Installation
Backend

Clone the repository:git clone https://github.com/andremugabo/RentMaster.git
cd backend


Install dependencies:npm install


Set up environment variables in .env (see .env.example):PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/property_management
JWT_SECRET=your-secret-key


Initialize Prisma and run migrations:npx prisma generate
npx prisma migrate dev --name init


Start the server:npm run dev  # Development with ts-node
npm run build && npm start  # Production


Access API at http://localhost:5000/api and Swagger docs at http://localhost:5000/api-docs.

Frontend

Navigate to the frontend directory:cd frontend


Install dependencies:npm install


Set up Tailwind CSS and Shadcn/UI (follow their docs for initialization).
Configure API base URL in src/services/api.ts:const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});


Start the development server:npm run dev


Access the app at http://localhost:5173.

Folder Structure
Backend
backend/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── config/            # Environment and Swagger config
│   ├── controllers/       # HTTP request handlers
│   ├── middlewares/       # Auth, validation, error handling
│   ├── routes/            # Express routers
│   ├── services/          # Business logic
│   ├── utils/             # JWT, logging helpers
│   ├── app.ts             # Express app setup
│   └── server.ts          # Entry point
├── .env                   # Environment variables
├── tsconfig.json
└── package.json

Frontend
frontend/
├── src/
│   ├── assets/            # Images, icons
│   ├── components/        # Reusable UI (Shadcn, custom)
│   ├── features/          # Entity-specific components (auth, users, etc.)
│   ├── hooks/             # Custom hooks
│   ├── layouts/           # Dashboard layout
│   ├── pages/             # Top-level routes
│   ├── services/          # API client
│   ├── store/             # State management
│   ├── utils/             # Helpers
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.js
├── vite.config.ts
└── package.json

Usage

Login: Access /login to authenticate. Admins can manage all entities; managers have restricted access.
Dashboard: View and manage properties, locals, tenants, leases, payments, and documents.
Notifications: System sends notifications for payment due dates, lease updates, etc.
Documents: Upload contracts or payment proofs (integrate with S3 for production).
Audit Logs: View user actions in the admin panel.

API Endpoints

Auth: POST /auth/login (email, password)
Users: GET/POST/PUT/DELETE /users (admin-only for some)
Properties: GET/POST/PUT/DELETE /properties
Locals: GET/POST/PUT/DELETE /locals
Tenants: GET/POST/PUT/DELETE /tenants
Leases: GET/POST/PUT/DELETE /leases
Payments: GET/POST/PUT/DELETE /payments
Documents: POST /documents (file upload), GET /documents
Notifications: GET/POST /notifications
Audit Logs: GET /audit-logs (admin-only)

See Swagger UI at /api-docs for detailed specs.
UI/UX Highlights

Responsive: Mobile-friendly with Tailwind CSS.
Accessible: ARIA labels, keyboard navigation.
Intuitive: Sidebar navigation, clear forms, and data tables with sorting/pagination.
Feedback: Loading spinners, error toasts, and success messages.
Role-Based: Admin sees all features; managers see restricted views.

Scaling and Maintenance

Backend:
Add Redis for caching.
Use PM2 or Docker for production deployment.
Implement rate limiting for APIs.
Add indexes in Prisma schema for frequent queries.


Frontend:
Lazy-load components for performance.
Use React Query for caching and optimistic updates.
Add ESLint/Prettier for code consistency.


Database: Regular backups, optimize queries with Prisma's query logging.

Security

Backend:
JWT for auth with role-based access control.
Password hashing with bcrypt.
Input validation with Joi.
Helmet for secure headers.


Frontend:
Store JWT securely (localStorage or httpOnly cookies).
Validate forms with Zod to match backend Joi schemas.
Sanitize inputs to prevent XSS.



Future Enhancements

Analytics: Dashboard with charts for payment trends, occupancy rates.
Multi-Tenancy: Support multiple organizations.
Notifications: Integrate with SendGrid/Twilio for email/SMS.
File Storage: AWS S3 for document uploads.
Testing: Add Jest for backend, Vitest/Cypress for frontend.

Contributing

Fork the repository.
Create a feature branch: git checkout -b feature-name.
Commit changes: git commit -m "Add feature".
Push to branch: git push origin feature-name.
Open a pull request.

License
MIT License. See LICENSE file for details.