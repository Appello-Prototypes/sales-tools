# Admin Dashboard Setup

## Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file:
   ```
   MONGODB_URI=mongodb://localhost:27017/appello-assessment
   JWT_SECRET=your-secret-key-change-in-production
   ```

3. **Seed admin user:**
   ```bash
   npm run seed-admin
   ```
   
   Default credentials:
   - Email: `admin@useappello.com`
   - Password: `admin123`
   
   **⚠️ IMPORTANT: Change the password after first login!**

## Accessing the Admin Dashboard

1. Navigate to `/admin/login`
2. Login with admin credentials
3. View all assessments at `/admin/dashboard`

## Features

- **View all assessments** with filtering and search
- **See opportunity scores** (0-100) and grades (A+ to D)
- **View priority rankings** (High/Medium/Low)
- **Access detailed assessment reports** with ROI calculations
- **View customer-facing reports** to see what prospects see

## API Endpoints

- `GET /api/admin/assessments` - List all assessments (with filters)
- `GET /api/admin/assessments/[submissionId]` - Get detailed assessment
- `PATCH /api/admin/assessments/[submissionId]` - Update assessment (notes, assignment)
- `GET /api/admin/me` - Get current admin user
- `POST /api/admin/login` - Login
- `POST /api/admin/logout` - Logout

## Scoring System

Opportunities are scored 0-100 based on:
- **Urgency** (20 points): How urgent is solving challenges?
- **Pain Severity** (20 points): Number and severity of pain points
- **Company Size** (15 points): Field workers count (indicates budget)
- **Timeline** (15 points): Decision timeline
- **Likelihood** (15 points): Likelihood to implement
- **Current State** (10 points): Manual systems = higher score
- **Budget Indicators** (5 points): Software evaluation, next steps

**Grade Scale:**
- A+: 90-100
- A: 85-89
- B+: 75-84
- B: 65-74
- C+: 55-64
- C: 45-54
- D: 0-44

**Priority:**
- High: 75+
- Medium: 55-74
- Low: <55

