# Talent Hub

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/fatima-salmans-projects-a99a0b46/recruiting-platform-dashboard)

## Deployment

Your project is live at:

**[https://talent-hub-dashboard.vercel.app/](https://talent-hub-dashboard.vercel.app/)**


# TalentHub Recruiting Platform

A modern, full-featured recruitment and candidate management platform built with Next.js, Supabase, and Stripe. TalentHub helps recruiters streamline their hiring process from job posting to candidate placement.

![TalentHub Dashboard](https://img.shields.io/badge/TalentHub-Recruiting_Platform-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Stripe](https://img.shields.io/badge/Stripe-Payments-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 🌟 Features

### Core Features
- **Candidate Management** - Store, search, and manage candidate profiles with detailed information
- **Job Posting** - Create and manage job listings with custom fields
- **Application Tracking** - Track candidate applications through customizable stages
- **Interview Scheduling** - Schedule and manage interviews with calendar integration
- **Team Collaboration** - Multi-user support with role-based permissions

### Advanced Features
- **AI-Powered Matching** - Smart candidate-job matching algorithms
- **Analytics Dashboard** - Comprehensive recruitment analytics and reporting
- **Multi-language Support** - Built-in internationalization (i18n)
- **Subscription Management** - Tiered pricing plans with Stripe integration
- **Email Communication** - Built-in email templates and communication tracking
- **Document Management** - Resume and cover letter storage

### Technical Features
- **Real-time Updates** - Live data synchronization
- **Responsive Design** - Mobile-friendly interface
- **Dark/Light Mode** - Theme support
- **Secure Authentication** - Email/password and Google OAuth
- **File Upload** - Resume and document uploads
- **API Integration** - Ready for third-party integrations

## 📋 Prerequisites

Before you begin, ensure you have installed:
- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

## 🚀 Quick Start

### 1. Clone the Repository

- **git clone <your-repository-url>** 
- **cd recruiting-platform-dashboard** 

### 2. Install Dependencies

- **npm install**

### 3. Environment Setup
- **Create a .env.local file in the root directory with the following variables:**

  #### Supabase Configuration
  - **NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url**
  - **NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key**
  - **SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key**
  
  #### Stripe Configuration
  - **STRIPE_SECRET_KEY=your_stripe_secret_key**
  - **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key**
  - **NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret**
  
  #### App Configuration
  - **NEXT_PUBLIC_APP_URL=http://localhost:3000**
  - **NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard**
  
  #### Stripe Price IDs (for subscription plans)
  - **STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxxx**
  - **STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_xxxx**
  - **STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_xxxx**

### 4. Database Setup

- **Run the SQL migration scripts in order:**

- **Navigate to the scripts/ directory**

- **Execute the scripts in numerical order:**

  - ***001_create_profiles.sql***
  - ***002_create_jobs.sql***
  - ***003_create_candidates.sql***
  - ***004_create_applications.sql***
  - ***005_create_interviews.sql***
  - ***006_create_subscriptions.sql***
  - ***007_handle_free_trial.sql***
  - ***008_create_communications.sql***
  - ***009_enhance_candidates_and_applications.sql***
  - ***010_create_support_tickets.sql***
- **You can run these in your Supabase SQL editor or via the Supabase CLI.**

### 5. Development Server

- **Start the development server:**

  - ***npm run dev***
  - ***Open http://localhost:3000 in your browser.***

### 6. Build for Production

- **npm run build**
- **npm start**

### 📁 Project Structure
```markdown
recruiting-platform-dashboard/
├── app/                    # Next.js 15 app router pages
│   ├── actions/           # Server actions
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Dashboard pages
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── ui/              # Shadcn/ui components
│   └── feature-specific/ # Feature components
├── lib/                  # Utility functions
│   ├── supabase/        # Supabase client setup
│   └── utils/           # Helper functions
├── public/              # Static assets
├── scripts/             # Database migration scripts
└── ...config files
🔧 Configuration
```
### Supabase Setup

- **Create a new project at supabase.com**

- **Copy your project URL and anon key**

- **Set up the required tables using the migration scripts**

### Stripe Setup

- **Create a Stripe account at stripe.com**

- **Create subscription products and copy their price IDs**

- **Set up webhooks for payment processing**

### Google OAuth

- **Follow the instructions in GOOGLE_OAUTH_SETUP.md to configure Google authentication.**

### 📊 Database Schema

- **Key tables:**

  - ***profiles - User profiles***
  
  - ***jobs - Job listings***
  
  - ***candidates - Candidate information***
  
  - ***applications - Job applications***
  
  - ***interviews - Interview scheduling***
  
  - ***subscriptions - User subscription plans***
  
  - ***communications - Communication history***

### 🎨 UI Components

- **The project uses shadcn/ui for consistent, accessible components including:**

  - ***Cards, Buttons, Forms***
  
  - ***Data Tables, Badges***
  
  - ***Dialogs, Alerts***
  
  - ***Navigation, Layout components***

### 🔐 Authentication

- **Supports multiple authentication methods:**

  - ***Email/Password***
  
  - ***Google OAuth***
  
  - ***Session management with Supabase Auth***

### 💳 Subscription Plans

- **Three subscription tiers:**

  - ***Free Trial - Basic features, limited records***
  
  - ***Starter - Enhanced features, CSV exports***
  
  - ***Professional - Advanced analytics, PDF/Excel exports***
  
  - ***Enterprise - Predictive analytics, unlimited data***

### 🌐 Internationalization

- **Built-in support for multiple languages:**

  - ***English (default)***
  
  - ***Arabic (RTL support)***
  
  - ***Easy to extend to other languages***


### 📈 Analytics

- **The platform includes comprehensive analytics:**

  - ***Conversion funnels***
  
  - ***Source effectiveness***
  
  - ***Interviewer performance***
  
  - ***Time-to-hire metrics***
  
  - ***Quality metrics***
  
  - ***Predictive analytics (Enterprise tier)***

### 🤝 Contributing

- **Fork the repository**

- **Create a feature branch**

- **Commit your changes**

- **Push to the branch**

- **Open a Pull Request**

### 👥 Team

- **Fatima Salman - Project Lead & Developer**

### 🙏 Acknowledgments

- **Next.js - React framework**

- **Supabase - Backend as a service**

- **Stripe - Payment processing**

- **shadcn/ui - UI components**

- **Tailwind CSS - Styling**
