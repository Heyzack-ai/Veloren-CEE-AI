# CEE Validation System

A comprehensive Next.js application for managing and validating CEE (Certificats d'Économies d'Énergie) dossiers.

## 🚀 Features

### Three User Roles

1. **Administrator** - Full system access
   - Dashboard with KPIs and analytics
   - Dossier management
   - Process configuration
   - Document type schemas
   - Validation rules
   - User and installer management
   - Billing and analytics

2. **Validator** - Quality control focus
   - Validation queue
   - Document review
   - Field verification
   - Signature comparison
   - Approval/rejection workflows

3. **Installer** - Submission portal
   - Upload new dossiers
   - Track submission status
   - View validation results
   - Download approved documents

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: Tanstack Query
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Date Handling**: date-fns
- **Charts**: Recharts

## 📦 Installation

```bash
npm install
```

## 🏃 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔐 Test Accounts

Use these credentials to test different roles:

- **Administrator**
  - Email: `admin@valoren.org`
  - Password: `password`

- **Validator**
  - Email: `validator@valoren.org`
  - Password: `password`

- **Installer**
  - Email: `installer@example.com`
  - Password: `password`

## 📁 Project Structure

```
cee-validation-app/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication pages
│   │   │   └── login/
│   │   ├── (app)/           # Protected app pages
│   │   │   ├── dashboard/
│   │   │   ├── dossiers/
│   │   │   ├── validation/
│   │   │   ├── config/
│   │   │   ├── users/
│   │   │   ├── installers/
│   │   │   ├── billing/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── layout/          # Layout components
│   │   ├── status-badge.tsx
│   │   └── confidence-indicator.tsx
│   ├── lib/
│   │   ├── auth-context.tsx # Authentication
│   │   ├── mock-auth.ts
│   │   └── mock-data/       # Mock data
│   └── types/               # TypeScript types
├── public/
└── package.json
```

## 🎨 Design System

### Colors

- **Primary**: Blue (#3B82F6) - Primary actions
- **Status Colors**:
  - Draft: Gray
  - Processing: Blue
  - Pending: Yellow
  - Approved: Green
  - Rejected: Red
  - Billed/Paid: Purple

### Typography

- **UI Font**: Inter
- **Heading Font**: Space Grotesk

## 🔄 Current Implementation Status

### ✅ Completed (Phase 1-2)

- [x] Project setup with Next.js 14
- [x] Tailwind CSS v4 configuration
- [x] shadcn/ui components installation
- [x] Custom theme with CEE colors
- [x] TypeScript types (User, Dossier, Process, Installer)
- [x] Authentication system with mock data
- [x] Auth context and session management
- [x] Login page
- [x] App layout (Header + Sidebar)
- [x] Role-based navigation
- [x] Administrator dashboard
- [x] Dossiers list page
- [x] Mock data (100+ dossiers)
- [x] Status badges
- [x] Confidence indicators

### 🚧 Next Phases

The foundation is complete. Upcoming development includes:

- [ ] Validator and Installer dashboards
- [ ] Dossier detail view
- [ ] Document viewer component
- [ ] Validation workflow screens
- [ ] Configuration screens (processes, rules, schemas)
- [ ] User and installer management
- [ ] Billing screens
- [ ] Analytics dashboard
- [ ] Settings screens
- [ ] Complete mock data system

## 🔧 Development

### Adding New Pages

1. Create page in appropriate route group:
   - `(auth)` for public pages
   - `(app)` for protected pages

2. Use existing components from `@/components/ui`

3. Follow the established patterns for layout and styling

### Mock Data

Mock data is located in `src/lib/mock-data/`. Currently includes:
- 100+ sample dossiers with realistic data
- 3 test users (admin, validator, installer)

## 📝 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 🚀 Deploy on Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/HeyZack-Domotique/Veloren-CEE-AI)

### Manual Deployment Steps

1. **Via Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import repository: `HeyZack-Domotique/Veloren-CEE-AI`
   - Vercel auto-detects Next.js settings
   - Click "Deploy"

2. **Via Vercel CLI**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy to preview
   vercel
   
   # Deploy to production
   vercel --prod
   ```

### Build Configuration

The app includes a `vercel.json` with optimized settings:
- Build command: `npm run build`
- Framework: Next.js
- Output directory: `.next`

### Environment Variables

For production deployment, configure these in Vercel dashboard:
```env
# Optional: Add your API endpoints when backend is ready
NEXT_PUBLIC_API_URL=your_api_url
```

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 📄 License

Proprietary - Valoren.org