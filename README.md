# Exam Ranking System
A full-stack mobile-responsive web application for collecting, managing, and calculating student exam rankings built with Next.js 14, TailwindCSS, and Supabase.

## Technologies Used
- Next.js 14 (App Router, Server Actions)
- TypeScript
- TailwindCSS & Radix UI (shadcn/ui parts)
- Supabase (PostgreSQL Database, Realtime Subscriptions)

## Quick Start
1. Run `npm install` inside the root folder
2. Create a Supabase project at [supabase.com](https://supabase.com)
3. Connect your project to the Database and execute the SQL script located in `supabase/schema.sql`.
4. Run `npm run dev` to start the frontend.

## Environment variables
Create a `.env.local` file with the following variables based on `.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=your_db_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_db_anon_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## User Flows
- Home Page (`/`): Contains the main navigation points.
- Enter Marks (`/enter-marks`): Allows inputting student results (NIC, Name, Geography, Category, Marks).
- Check Result (`/check-results`): Input NIC to observe results. Wait for loading bar if calculated.
- Admin Panel (`/admin`): Live update dashboard where results can be exported. Default credentials above.

## Ranking Logic Rules
- **Island Rank**: Ranked among all students.
- **Province Rank**: Ranked among students in the same province.
- **District Rank**: Ranked among students in the same district.
Rankings are dynamically calculated by comparing total_marks. If total candidates are 5 and a student has greater total_marks than 4 candidates, their rank is 1.

## Deployment
1. Connect this repository to Vercel via the Vercel Dashboard.
2. In Vercel Project Settings > Environment Variables, add the `.env` attributes shown above.
3. Deploy! Next.js and Vercel natively understand App router Server Actions and Supabase fetching.

## Developer Note
Admin ranking real-time auto-refreshes using `Supabase Realtime Subscriptions` tracking changes on `students_results`.
