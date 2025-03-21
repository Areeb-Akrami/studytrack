# StudyTrack - Student Study Planner

A modern web application for students to manage their study schedules, track attendance, and plan their academic activities effectively.

## Features

- 📚 Study Timetable Generator
- 📊 Attendance Tracking
- 📝 Subject Management
- 🎯 Priority-based Study Planning
- 📱 Responsive Design
- 🌙 Modern UI/UX

## Tech Stack

- Frontend: HTML5, CSS3, JavaScript
- Backend: Supabase
- Authentication: Supabase Auth
- Database: PostgreSQL (via Supabase)
- Deployment: Vercel

## Prerequisites

Before deploying, make sure you have:

1. A [Supabase](https://supabase.com) account
2. A [Vercel](https://vercel.com) account
3. [Git](https://git-scm.com/) installed on your machine

## Deployment Steps

1. **Set up Supabase Project**

   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project
   - Note down your project URL and anon key
   - Create the following tables in your Supabase database:
     ```sql
     -- subjects table
     create table subjects (
       id uuid default uuid_generate_v4() primary key,
       user_id uuid references auth.users not null,
       name text not null,
       code text,
       total_classes integer default 0,
       created_at timestamp with time zone default timezone('utc'::text, now())
     );

     -- attendance table
     create table attendance (
       id uuid default uuid_generate_v4() primary key,
       user_id uuid references auth.users not null,
       subject_id uuid references subjects not null,
       date date not null,
       status text not null,
       created_at timestamp with time zone default timezone('utc'::text, now())
     );
     ```

2. **Update Configuration**

   Create a `supabase.js` file in your project root (if not exists) and update it with your Supabase credentials:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL'
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'
   
   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
   ```

3. **Deploy to Vercel**

   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Login to Vercel
   vercel login

   # Deploy
   vercel
   ```

   Alternatively, you can deploy directly from the Vercel dashboard:
   - Connect your GitHub repository
   - Import the project
   - Configure build settings (use the included vercel.json)
   - Deploy

4. **Environment Variables**

   Add the following environment variables in your Vercel project settings:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/studytrack.git
   cd studytrack
   ```

2. Install a local development server:
   ```bash
   npm install -g http-server
   ```

3. Run the development server:
   ```bash
   http-server
   ```

4. Open `http://localhost:8080` in your browser

## Security

- All database operations are protected by Supabase RLS (Row Level Security)
- Authentication is handled securely by Supabase Auth
- CORS is configured properly in production
- All API keys are stored as environment variables

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details 