# RentMaster - Property Management System

A comprehensive full-stack property management system built with modern technologies for efficient rental property management.

## 🚀 Features

### Core Functionality
- **Property Management**: Create and manage properties with multiple units
- **Tenant Management**: Handle individual and company tenants
- **Lease Management**: Create, update, and terminate lease agreements
- **Payment Tracking**: Record and track rental payments with multiple payment methods
- **Document Management**: Upload and organize property-related documents
- **Dashboard Analytics**: Real-time insights and reporting
- **User Management**: Role-based access control (Admin/Manager)

### Technical Features
- **Authentication**: JWT-based secure authentication
- **Real-time Updates**: Live data synchronization
- **Responsive Design**: Mobile-first responsive UI
- **File Upload**: Document management with file upload
- **Search & Filtering**: Advanced search and filtering capabilities
- **Audit Logging**: Complete activity tracking
- **API Documentation**: Swagger/OpenAPI documentation

## 🏗️ Architecture

### Backend (Node.js + TypeScript)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Bcrypt
- **Validation**: Joi
- **Logging**: Winston
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS

### Frontend (React + TypeScript)
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS + Shadcn/UI
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6
- **HTTP Client**: Axios

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL
- **Reverse Proxy**: Nginx
- **Process Management**: PM2 (production)

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RentMaster
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/docs

### Manual Setup

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

4. **Database setup**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. **Start the backend**
   ```bash
   npm run dev
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the frontend**
   ```bash
   npm run dev
   ```

## 🔐 Default Credentials

- **Admin**: admin@rentmaster.com / Admin@123
- **Manager**: manager@rentmaster.com / Manager@123

## 📁 Project Structure

```
RentMaster/
├── backend/
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middlewares/     # Express middlewares
│   │   ├── utils/           # Utility functions
│   │   └── config/          # Configuration
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Database seeding
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities and API client
│   │   ├── types/           # TypeScript types
│   │   └── contexts/        # React contexts
│   └── package.json
├── docker-compose.yml
├── nginx.conf
└── README.md
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Test Coverage
```bash
cd frontend
npm run test:coverage
```

## 📊 API Documentation

The API documentation is available at `/api/docs` when the backend is running. It includes:

- Authentication endpoints
- Property management APIs
- Tenant management APIs
- Lease management APIs
- Payment tracking APIs
- Document management APIs
- Dashboard analytics APIs

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/rentmaster_db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1h"
LOG_LEVEL="info"
```

#### Frontend (.env)
```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

## 🚀 Deployment

### Production Deployment

1. **Build the application**
   ```bash
   # Backend
   cd backend
   npm run build
   
   # Frontend
   cd frontend
   npm run build
   ```

2. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Environment-specific Configurations

- **Development**: Hot reload, debug logging
- **Production**: Optimized builds, security headers, SSL

## 📈 Monitoring & Logging

- **Application Logs**: Winston logging with file rotation
- **Audit Trail**: Complete user activity tracking
- **Error Tracking**: Comprehensive error logging
- **Performance**: Request/response timing

## 🔒 Security Features

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive input sanitization
- **Security Headers**: Helmet.js security middleware
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: API rate limiting (configurable)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api/docs`
- Review the code comments and documentation

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core property management
- ✅ Tenant management
- ✅ Lease management
- ✅ Payment tracking
- ✅ Document management
- ✅ Dashboard analytics

### Phase 2 (Planned)
- 🔄 Tenant portal
- 🔄 Mobile application
- 🔄 Advanced reporting
- 🔄 Email notifications
- 🔄 Maintenance requests
- 🔄 Financial reporting

### Phase 3 (Future)
- 🔄 Multi-language support
- 🔄 Advanced analytics
- 🔄 Third-party integrations
- 🔄 API marketplace
- 🔄 White-label solutions

---

**RentMaster** - Streamlining property management with modern technology.