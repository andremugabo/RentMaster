# RentMaster

## Property Management System

**RentMaster** is a scalable and maintainable web application designed to streamline the management of properties, tenants, leases, payments, and more. Built with modern technologies like Node.js, TypeScript, Express, React, and Tailwind CSS, this system is optimized for performance, security, and a seamless user experience.

### Tech Stack

#### Backend

* **Node.js**: Runtime environment for scalable applications.
* **TypeScript**: Adds static typing for improved maintainability.
* **Express**: Lightweight web framework for API routes.
* **Prisma**: ORM for PostgreSQL database interactions.
* **Joi**: Schema validation for input.
* **JWT**: Token-based authentication.
* **Bcrypt**: Password hashing for security.
* **Swagger**: API documentation with interactive UI.
* **Winston**: Logging utility for debugging and audits.
* **Helmet**: Secures HTTP headers.
* **CORS**: Manages frontend-backend communication.

#### Frontend

* **React**: UI library for building user interfaces.
* **Vite**: Fast build tool for development.
* **Tailwind CSS**: Utility-first CSS for rapid styling.
* **Shadcn/UI**: Customizable UI components for building clean interfaces.
* **React Router**: Client-side routing.
* **React Hook Form + Zod**: Efficient form handling and validation.
* **React Query**: Data fetching and caching.
* **Axios**: API requests with JWT interceptors.

#### Database

* **PostgreSQL**: Relational database supporting UUID, JSONB, and TIMESTAMP types.

---

### Features

* **User Management**: Role-based access (Admin, Manager) with registration and login.
* **Property Management**: Create, read, update, and delete properties and their local units.
* **Tenant Management**: Manage tenant details (individuals or companies).
* **Lease Management**: Create and track leases with billing cycles and statuses.
* **Payments**: Record and track payments (bank transfer, cash) and document uploads.
* **Document Management**: Upload and manage files (e.g., lease contracts, payment proofs), with optional S3 integration.
* **Notifications**: Email, SMS, or system notifications with retry logic.
* **Audit Logs**: Track all user actions for accountability.
* **UI/UX**: A responsive and intuitive interface with clean navigation, forms, and data tables.
* **API Documentation**: Interactive Swagger UI for easy API exploration.

---

### Installation

#### Backend

1. **Clone the repository**:

   ```bash
   git clone https://github.com/andremugabo/RentMaster.git
   cd backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file and define the following variables:

   ```env
   PORT=5000
   DATABASE_URL=postgresql://user:password@localhost:5432/property_management
   JWT_SECRET=your-secret-key
   ```

4. **Initialize Prisma and run migrations**:

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Start the server**:

   * Development:

     ```bash
     npm run dev
     ```
   * Production:

     ```bash
     npm run build && npm start
     ```

6. **Access the API**:

   * API: `http://localhost:5000/api`
   * Swagger Docs: `http://localhost:5000/api-docs`

#### Frontend

1. **Navigate to the frontend directory**:

   ```bash
   cd frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up Tailwind CSS and Shadcn/UI**:
   Follow the documentation for initializing Tailwind CSS and Shadcn/UI in your project.

4. **Configure API base URL**:
   In `src/services/api.ts`, update the API base URL:

   ```typescript
   const api = axios.create({
     baseURL: 'http://localhost:5000/api',
   });
   ```

5. **Start the development server**:

   ```bash
   npm run dev
   ```

6. **Access the app**:
   Visit `http://localhost:5173` in your browser.

---

### Folder Structure

#### Backend

```plaintext
backend/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── config/            # Configuration files (env, swagger)
│   ├── controllers/       # Handlers for HTTP requests
│   ├── middlewares/       # Auth, validation, error handling
│   ├── routes/            # Express routers
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions (JWT, logging)
│   ├── app.ts             # Express app setup
│   └── server.ts          # Entry point
├── .env                   # Environment variables
├── tsconfig.json
└── package.json
```

#### Frontend

```plaintext
frontend/
├── src/
│   ├── assets/            # Images, icons
│   ├── components/        # Reusable UI components
│   ├── features/          # Entity-specific components (auth, users, etc.)
│   ├── hooks/             # Custom hooks
│   ├── layouts/           # Dashboard layout
│   ├── pages/             # Top-level routes
│   ├── services/          # API client
│   ├── store/             # State management
│   ├── utils/             # Helper functions
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

### Usage

* **Login**: Access `/login` to authenticate. Admins can manage all entities, while managers have restricted access.
* **Dashboard**: View and manage properties, tenants, leases, payments, and documents.
* **Notifications**: The system sends notifications for upcoming payment due dates, lease renewals, and more.
* **Audit Logs**: View detailed logs of user actions in the admin panel.

---

### API Endpoints

* **Auth**: `POST /auth/login` (email, password)
* **Users**: `GET/POST/PUT/DELETE /users` (admin-only for some)
* **Properties**: `GET/POST/PUT/DELETE /properties`
* **Locals**: `GET/POST/PUT/DELETE /locals`
* **Tenants**: `GET/POST/PUT/DELETE /tenants`
* **Leases**: `GET/POST/PUT/DELETE /leases`
* **Payments**: `GET/POST/PUT/DELETE /payments`
* **Documents**: `POST /documents` (file upload), `GET /documents`
* **Notifications**: `GET/POST /notifications`
* **Audit Logs**: `GET /audit-logs` (admin-only)

For detailed specifications, check Swagger UI at `/api-docs`.

---

### UI/UX Highlights

* **Responsive**: Fully optimized for mobile and desktop, built with Tailwind CSS.
* **Accessible**: Designed with accessibility in mind, including ARIA labels and keyboard navigation.
* **Intuitive**: Easy-to-navigate sidebar, well-structured forms, and data tables with sorting and pagination.
* **User Feedback**: Real-time feedback with loading spinners, error toasts, and success messages.
* **Role-Based Access**: Admins have full access, while managers have restricted views.

---

### Security

* **Backend**:

  * JWT for authentication with role-based access.
  * Password hashing using bcrypt.
  * Input validation with Joi.
  * Helmet for HTTP header security.

* **Frontend**:

  * Store JWT securely (use `httpOnly` cookies or localStorage).
  * Validate forms using Zod, ensuring they match backend Joi schemas.
  * Sanitize user inputs to prevent XSS attacks.

---

### Scaling and Maintenance

#### Backend

* Add **Redis** for caching.
* Use **PM2** or **Docker** for deployment in production.
* Implement **rate limiting** for API requests.
* Optimize queries with **Prisma** indexing.

#### Frontend

* **Lazy-load** components to improve load times.
* Use **React Query** for caching and optimistic updates.
* Ensure **code consistency** with ESLint/Prettier.

#### Database

* Regular **backups** and query optimizations.

---

### Future Enhancements

* **Analytics**: Dashboard with charts for trends in payments and occupancy.
* **Multi-Tenancy**: Support for managing multiple organizations.
* **Notifications**: Integrate with services like **SendGrid** or **Twilio** for email/SMS.
* **File Storage**: Integrate with **AWS S3** for file uploads.
* **Testing**: Add **Jest** for backend and **Vitest/Cypress** for frontend testing.

---

### Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m "Add feature"`.


4. Push to your branch: `git push origin feature-name`.
5. Open a pull request to merge your changes.

---

### License

MIT License. See the LICENSE file for details.

---

### Visual Enhancements

* **Screenshots**:
 
* **Videos**:
  
