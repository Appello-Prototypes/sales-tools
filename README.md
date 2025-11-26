# Appello Pre-Demo Assessment Application

A modern, multi-step assessment form application built with Next.js, MongoDB, and TypeScript. This application guides prospects through 23 questions across 5 sections, with auto-save functionality and a comprehensive admin dashboard.

## Features

- ✅ Multi-step form (5 sections, 23 questions)
- ✅ Auto-save progress
- ✅ Conditional logic (skip union questions if not unionized)
- ✅ Form validation with Zod
- ✅ Progress tracking with visual indicators
- ✅ Responsive design (mobile-friendly)
- ✅ MongoDB integration for data persistence
- ✅ Admin dashboard (coming soon)

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **UI Components**: ShadCN/UI
- **Form Management**: React Hook Form + Zod
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Database**: MongoDB with Mongoose
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ installed
- MongoDB running locally OR MongoDB Atlas account
- npm or yarn package manager

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# MongoDB Connection
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/appello-assessment

# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/appello-assessment

# JWT Secret (for admin authentication - generate a random string)
JWT_SECRET=your-secret-key-change-in-production

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start MongoDB (if using local)

**macOS (using Homebrew):**
```bash
brew services start mongodb-community
```

**Or run MongoDB manually:**
```bash
mongod --dbpath /path/to/data/directory
```

**Windows:**
```bash
net start MongoDB
```

**Linux:**
```bash
sudo systemctl start mongod
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
appello-assessment/
├── app/
│   ├── api/
│   │   └── assessments/        # API routes
│   ├── assessment/             # Assessment pages
│   └── page.tsx                # Home page
├── components/
│   ├── assessment/             # Assessment components
│   └── ui/                     # ShadCN UI components
├── lib/
│   ├── mongodb.ts              # MongoDB connection
│   └── store/                  # Zustand stores
├── models/                     # Mongoose models
├── types/                      # TypeScript types
└── public/                     # Static assets
```

## API Endpoints

### Form Endpoints

- `POST /api/assessments/start` - Initialize new assessment
- `POST /api/assessments/[submissionId]/save` - Save progress
- `POST /api/assessments/[submissionId]/submit` - Submit assessment
- `GET /api/assessments/[submissionId]` - Retrieve assessment

## Form Flow

1. **Section 1: Company Basics** (Questions 1-3)
   - Trade/specialty
   - Field workers count
   - Role

2. **Section 2: Pain Point Discovery** (Questions 4-7)
   - Operational challenges
   - Magic wand question
   - Urgency scale
   - Cost quantification

3. **Section 3: Current State Assessment** (Questions 8-11)
   - Timesheet method
   - Union status (conditional)
   - Accounting/payroll software
   - Construction software
   - Gaps identification

4. **Section 4: Demo Customization** (Questions 12-15)
   - Demo focus areas
   - Evaluators
   - Tech comfort level
   - Smartphone availability

5. **Section 5: Decision Intelligence** (Questions 16-20)
   - Timeline
   - Competitors evaluating
   - Next steps
   - Likelihood to implement
   - Specific questions

## Database Schema

### Assessment Collection

Stores all assessment responses with:
- Submission ID (unique identifier)
- All 5 sections of responses
- Metadata (started/completed times, IP, user agent)
- Status (in_progress, completed, abandoned)
- Admin fields (assigned to, notes)

### User Collection (Admin)

Stores admin users for dashboard access:
- Email (unique)
- Password hash
- Name
- Role (admin, sales, viewer)
- Active status

## Development

### Adding New Questions

1. Update the form schema in the step component
2. Update the MongoDB model if needed
3. Update the TypeScript types
4. Update the store if needed

### Styling

The app uses Tailwind CSS with custom Appello brand colors:
- Primary Blue: `#0046AD`
- Secondary Blue: `#3B71F4`
- Accent: `#00C4CC`

## Testing

To test the application:

1. Start MongoDB
2. Run `npm run dev`
3. Navigate to http://localhost:3000
4. Click "Start Assessment"
5. Complete the form
6. Check MongoDB to see saved data

## Deployment

### MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Get connection string
4. Update `MONGODB_URI` in environment variables

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Next Steps

- [ ] Admin dashboard with authentication
- [ ] Analytics dashboard
- [ ] Export to CSV functionality
- [ ] Email notifications
- [ ] Media integration (images/videos)
- [ ] Educational content sidebar
- [ ] HubSpot integration

## Support

For questions or issues, contact:
- Email: corey@useappello.com

## License

Private - Appello Inc.
