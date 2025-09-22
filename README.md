# RentMaster

## Property Management System

**RentMaster** is a modern, scalable property management platform designed to manage **properties, tenants, leases, payments, and documents** with ease.
Built with **Node.js, TypeScript, Prisma, React, and Tailwind**, it provides a secure, maintainable, and developer-friendly experience.

---

### 🚀 Tech Stack

**Backend**

* Node.js + TypeScript – Runtime and type safety
* Express – REST API framework
* Prisma – Type-safe ORM for PostgreSQL
* Joi – Input validation
* JWT + Bcrypt – Authentication & password security
* Winston – Structured logging
* Swagger – Interactive API documentation
* Helmet & CORS – Security middleware

**Frontend**

* React + Vite – UI & development tooling
* Tailwind CSS + Shadcn/UI – Fast, clean, customizable styling
* React Query – Data fetching and caching
* React Hook Form + Zod – Form handling and validation
* Axios – API requests with interceptors

**Database**

* PostgreSQL – Relational database with UUID & JSONB support

---

### 📦 Features

* 👥 **User Management** – Role-based access (Admin, Manager)
* 🏢 **Property Management** – Properties, locals, and their statuses
* 🧾 **Lease Management** – Billing cycles, statuses, and renewals
* 💳 **Payments** – Record transactions and upload proofs
* 📂 **Documents** – Lease contracts, payment receipts (S3-ready)
* 🔔 **Notifications** – Email, SMS, or system alerts
* 🛡 **Audit Logs** – Track user actions for security
* 📊 **Reports** – Payments, occupancy, and performance dashboards
* 📱 **Responsive UI** – Mobile- and desktop-friendly

---

### 🗄 Example Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password_hash String
  full_name     String
  role          Role
  is_active     Boolean  @default(true)
  created_at    DateTime @default(now())
  leases        Lease[]
}

model Property {
  id          String  @id @default(uuid())
  name        String
  location    String
  description String?
  locals      Local[]
  created_at  DateTime @default(now())
}

model Local {
  id             String   @id @default(uuid())
  reference_code String   @unique
  status         LocalStatus
  size_m2        Float?
  property       Property @relation(fields: [property_id], references: [id])
  property_id    String
  leases         Lease[]
}

model Lease {
  id         String   @id @default(uuid())
  start_date DateTime
  end_date   DateTime
  status     LeaseStatus
  local      Local    @relation(fields: [local_id], references: [id])
  local_id   String
  tenant     Tenant   @relation(fields: [tenant_id], references: [id])
  tenant_id  String
  payments   Payment[]
  documents  Document[] @relation("LeaseDocuments")
}

model Payment {
  id             String       @id @default(uuid())
  amount         Float
  date           DateTime     @default(now())
  payment_mode   PaymentMode  @relation(fields: [payment_mode_id], references: [id])
  payment_mode_id String
  lease          Lease        @relation(fields: [lease_id], references: [id])
  lease_id       String
  documents      Document[]   @relation("PaymentDocuments")
}

model Document {
  id         String   @id @default(uuid())
  file_url   String
  file_type  String
  uploaded_at DateTime @default(now())
  owner_id   String
  lease      Lease?   @relation("LeaseDocuments", fields: [owner_id], references: [id], map: "lease_documents_fkey")
  payment    Payment? @relation("PaymentDocuments", fields: [owner_id], references: [id], map: "payment_documents_fkey")
}

model PaymentMode {
  id            String  @id @default(uuid())
  code          String  @unique
  display_name  String
  requires_proof Boolean @default(false)
  payments      Payment[]
}

model Tenant {
  id        String   @id @default(uuid())
  name      String
  email     String?
  phone     String?
  leases    Lease[]
}

enum Role {
  ADMIN
  MANAGER
}

enum LocalStatus {
  AVAILABLE
  OCCUPIED
  UNDER_MAINTENANCE
}

enum LeaseStatus {
  ACTIVE
  EXPIRED
  TERMINATED
}
```

---

### 📊 Prisma ERD (Entity-Relationship Diagram)

You can automatically generate a visual ERD from the Prisma schema.

#### 1️⃣ Install ERD Generator

```bash
npm install --save-dev prisma-erd-generator @mermaid-js/mermaid-cli
```

Then add this to your `schema.prisma`:

```prisma
generator erd {
  provider = "prisma-erd-generator"
  output   = "./ERD.svg"
}
```

#### 2️⃣ Generate ERD

```bash
npx prisma generate
```

This will create `ERD.svg` inside your project.
Open it in any browser or markdown preview to visualize your database model.

---

### ⚙️ Installation

#### Backend Setup

```bash
git clone https://github.com/andremugabo/RentMaster.git
cd backend
npm install
npm install --save-dev nodemon
```

Create a `.env` file:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:123@localhost:5432/rentmaster_db?schema=public
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=1h
```

Run migrations & generate client:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Seed database with initial data:

```bash
npx prisma db seed
```

Start the server:

```bash
npm run dev   # Development
npm run build && npm start  # Production
```

---

### 🔑 Prisma Cheat Sheet

| Task             | Command                                            |
| ---------------- | -------------------------------------------------- |
| Format schema    | `npx prisma format`                                |
| Generate client  | `npx prisma generate`                              |
| Create migration | `npx prisma migrate dev --name <name>`             |
| View DB in GUI   | `npx prisma studio`                                |
| Seed database    | `npx prisma db seed`                               |
| Generate ERD     | `npx prisma generate` (after installing generator) |

---

### 📈 Scaling & Maintenance

* Caching with **Redis**
* Containerization with **Docker**
* Background jobs (queues) for heavy tasks
* Indexing and query optimization for performance

---

### 🤝 Contributing

1. Fork & clone repo
2. Create a branch `git checkout -b feature-name`
3. Commit changes `git commit -m "Add feature"`
4. Push branch `git push origin feature-name`
5. Open a pull request

---

### 📜 License

MIT License – free to use and modify.

