# Azaire Fleet Manager v7.0

A comprehensive fleet management solution built with Next.js 15, designed specifically for the Zimbabwean market. Manage your vehicles, drivers, and finances efficiently with a modern, offline-capable Progressive Web App.

## 🚀 Features

### Core Functionality
- **Multi-tenant SaaS Architecture** - Secure tenant isolation with PostgreSQL RLS
- **Progressive Web App (PWA)** - Works offline with background sync
- **Real-time Dashboard** - Comprehensive fleet overview and analytics
- **Vehicle Management** - Track registration, maintenance, and status
- **Driver Management** - Digital contracts and payment tracking
- **Financial Tracking** - Income, expenses, and profitability analytics
- **Offline Support** - Queue actions when offline, sync when online

### Technical Features
- **Next.js 15** with App Router and Server Components
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL
- **BetterAuth** for authentication
- **Tailwind CSS** for styling
- **Google Analytics 4** integration
- **Two-layer security** (Prisma Extension + PostgreSQL RLS)

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL 17
- **ORM:** Prisma 5+
- **Authentication:** BetterAuth
- **Styling:** Tailwind CSS
- **PWA:** next-pwa
- **State Management:** Zustand + React Context
- **Forms:** React Hook Form + Zod
- **UI Components:** Radix UI + shadcn/ui

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL 17+
- Redis (optional, for background jobs)
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd azaire-fleet-manager
npm install
```

### 2. Environment Setup

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/azaire_dev"

# BetterAuth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Optional services (for production)
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
REDIS_URL="redis://localhost:6379"
RESEND_API_KEY="your-resend-key"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with sample data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Project Structure

```
azaire-fleet-manager/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── api/               # API route handlers
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   ├── dashboard/         # Dashboard components
│   │   └── ui/                # Reusable UI components
│   ├── lib/                   # Utility functions
│   │   ├── prisma.ts          # Prisma client
│   │   ├── auth.ts            # BetterAuth config
│   │   └── tenant.ts          # Tenant utilities
│   ├── hooks/                 # Custom React hooks
│   └── server/                # Server-side utilities
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
└── public/
    ├── manifest.json          # PWA manifest
    └── icons/                 # PWA icons
```

## 🔐 Security Architecture

### Two-Layer Protection Model

1. **Application Layer (Prisma Extension)**
   - Automatic tenant scoping in all queries
   - Prevents developer mistakes
   - Type-safe implementation

2. **Database Layer (PostgreSQL RLS)**
   - Physical enforcement at database level
   - Works even with raw SQL or external tools
   - Mandatory for production deployment

### Multi-Tenancy

- **Single Database, Shared Tables** with `tenant_id` column
- **Row-Level Security (RLS)** policies for tenant isolation
- **Prisma Client Extensions** for automatic scoping
- **Session-based tenant context** via middleware

## 📱 Progressive Web App

### Offline Capabilities
- **Service Worker** caches assets and API responses
- **IndexedDB** for offline data storage
- **Background Sync** queues actions when offline
- **Push Notifications** for important updates

### PWA Features
- Installable on mobile and desktop
- Works without internet connection
- Automatic updates
- Native app-like experience

## 🎯 Key Modules

### 1. Tenant Management
- Multi-tenant architecture
- Subscription plans (Free, Basic, Premium)
- Tenant settings and customization
- Branding and invoice customization

### 2. Vehicle Management
- Vehicle registration and tracking
- Maintenance scheduling
- Mileage tracking
- Status management (Active, Maintenance, Decommissioned)

### 3. Driver Management
- Driver profiles and contracts
- Payment model configuration
- Digital contract signing
- Performance tracking

### 4. Financial Management
- Income and expense tracking
- Remittance management
- Profit/loss analytics
- Automated reporting

### 5. Dashboard & Analytics
- Real-time fleet overview
- Key performance indicators
- Recent activity feed
- Quick actions

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
```

### Database Management

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="secure-random-string"
BETTER_AUTH_URL="https://your-domain.com"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
REDIS_URL="redis://..."
RESEND_API_KEY="..."
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-..."
```

### Database Setup for Production

1. Create PostgreSQL database
2. Enable Row-Level Security (RLS)
3. Create application user with limited privileges
4. Set up RLS policies for tenant isolation

## 📊 Analytics

### Google Analytics 4 Integration
- Page view tracking
- Custom event tracking
- User behavior analytics
- Performance monitoring

### Custom Events Tracked
- User registrations
- Vehicle additions
- Driver assignments
- Remittance submissions
- Maintenance records

## 🔒 Security Best Practices

1. **Environment Variables** - Never commit secrets
2. **Database Security** - Use RLS and limited privileges
3. **Authentication** - BetterAuth with CSRF protection
4. **Data Validation** - Zod schemas for all inputs
5. **HTTPS** - Always use in production
6. **Regular Updates** - Keep dependencies updated

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the PRD v7.0 for detailed specifications

## 🗺️ Roadmap

### Q1 2026
- Advanced reporting features
- Mobile app (React Native)
- WhatsApp integration
- Payment gateway integration

### Q2 2026
- AI-powered maintenance predictions
- Advanced analytics dashboard
- Multi-language support
- API for third-party integrations

---

**Built with ❤️ for the Zimbabwean fleet management market**