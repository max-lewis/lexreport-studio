# LexReport Studio - Walking Skeleton (v0.1)

AI-powered structured legal report creation system with dual rendering (PDF + interactive web viewer).

## Current Status: Walking Skeleton ✅

This is **Session 1** - a minimal viable foundation demonstrating the core architecture end-to-end.

### What's Working Now:
- ✅ Complete database schema (Supabase PostgreSQL)
- ✅ Authentication (email/password signup/login)
- ✅ Create and list reports
- ✅ View individual reports
- ✅ Role-based access control (RLS policies)
- ✅ Responsive UI with Tailwind CSS
- ✅ Ready for Railway deployment

### Coming in Future Sessions:
- Session 2: Tiptap rich text editor + Section management
- Session 3: Claude AI integration + Citation management
- Session 4: PDF renderer (Puppeteer) + Interactive viewer (GSAP)

## Prerequisites

- Node.js 20+
- Supabase account (already configured)
- Railway account (for deployment)
- GitHub account (for version control)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

**Important**: The database migration needs to be applied manually.

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/ciwzpyvdegemugbamayx/sql)
2. Click "New query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the query
5. Verify all tables appear in the Table Editor

See `SETUP_DATABASE.md` for detailed instructions.

### 3. Environment Variables

The `.env.local` file is already configured with:
- Supabase URL and keys
- Claude API key
- App URL

For production deployment, you'll need to set these in Railway.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Railway

### Step 1: Create GitHub Repository

```bash
# Create a new private repo on GitHub (manually via github.com)
# Then connect your local repo:

git remote add origin https://github.com/YOUR_USERNAME/lexreport-studio.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `lexreport-studio`
5. Railway will auto-detect Next.js and deploy

### Step 3: Add Environment Variables in Railway

In Railway project settings → Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://ciwzpyvdegemugbamayx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
ANTHROPIC_API_KEY=<your_claude_key>
NEXT_PUBLIC_APP_URL=<your_railway_url>
```

### Step 4: Verify Deployment

Once deployed, Railway will provide a URL like: `lexreport-studio-production.up.railway.app`

Test the deployment:
1. Visit the URL
2. Click "Sign Up" and create an account
3. Create a test report
4. Verify it appears in your reports list

## Project Structure

```
lexreport-studio/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   └── reports/          # Reports list and detail pages
│   ├── api/                  # API routes
│   │   └── auth/             # Auth endpoints
│   ├── login/                # Login page
│   ├── signup/               # Signup page
│   └── page.tsx              # Landing page
├── components/
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── supabase/             # Supabase client utilities
│   └── utils.ts              # Helper functions
├── supabase/
│   └── migrations/           # Database schema
├── types/
│   └── database.ts           # TypeScript types
└── middleware.ts             # Auth middleware
```

## Database Schema

### Tables:
- `users` - User accounts and profiles
- `reports` - Report metadata and settings
- `sections` - Report sections (hierarchical)
- `citations` - Footnotes, exhibits, figures
- `visual_assets` - Images, charts, tables, videos
- `theme_configs` - Design tokens and themes
- `audit_logs` - Change tracking

All tables have Row Level Security (RLS) enabled.

## Features Implemented

### Authentication
- Email/password signup
- Email/password login
- Session management with Supabase Auth
- Protected routes via middleware
- Automatic user profile creation

### Reports
- Create new reports
- List all user reports
- View individual reports
- Soft delete (30-day retention)
- Slug generation for SEO-friendly URLs

### UI/UX
- Responsive design
- Clean, professional interface
- Loading states
- Error handling
- Form validation

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **Components**: Radix UI primitives
- **Deployment**: Railway

## Development Workflow

### Making Changes

```bash
# Create a feature branch
git checkout -b feature/your-feature

# Make your changes
# ...

# Commit and push
git add .
git commit -m "Add: your feature description"
git push origin feature/your-feature
```

### Deploying Changes

Railway auto-deploys from the `main` branch:

```bash
# Merge to main
git checkout main
git merge feature/your-feature
git push origin main
```

Railway will automatically build and deploy.

## Troubleshooting

### "User not found" error
- Make sure you've applied the database migration
- Check that the Supabase trigger is creating user profiles

### Auth not working
- Verify environment variables in `.env.local`
- Check Supabase dashboard for auth errors
- Clear browser cookies and try again

### Reports not loading
- Check RLS policies in Supabase
- Verify the user is authenticated
- Check browser console for errors

## Next Steps (Session 2)

The next development session will add:

1. **Tiptap Editor Integration**
   - Rich text editing
   - Custom extensions for citations
   - Footnote support
   - Section templates

2. **Section Management**
   - Create/edit/delete sections
   - Reorder sections
   - Section type templates
   - Content block management

3. **Basic Styling**
   - Theme system foundation
   - Typography controls
   - Layout options

## Contributing

This is a private project for BLG. All development happens in focused sessions with Claude Code.

## License

Proprietary - BLG Law

## Support

For issues or questions, refer to:
- `SETUP_DATABASE.md` - Database setup help
- `_development_log/` - Development decisions and notes
- Maxwell's notes in `0_References/`

---

**Version**: 0.1.0 (Walking Skeleton)
**Last Updated**: 2025-11-13
**Next Session**: Tiptap Editor + Section Management
