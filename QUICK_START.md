# Quick Start Guide

## Prerequisites

1. **MongoDB** - Either:
   - Local MongoDB installed and running
   - MongoDB Atlas account (free tier available)

2. **Node.js 18+** installed

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

The `.env.local` file is already created with default local MongoDB settings. If using MongoDB Atlas, update it:

```bash
# Edit .env.local and update MONGODB_URI:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/appello-assessment
```

### 3. Start MongoDB (Local Only)

**macOS:**
```bash
brew services start mongodb-community
```

**Or check if MongoDB is running:**
```bash
mongosh --eval "db.version()"
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Open Browser

Navigate to: http://localhost:3000

## Testing the Application

1. Click "Start Assessment" on the home page
2. Complete the form step by step
3. Progress is auto-saved as you move between steps
4. Submit the final step
5. You'll see a thank you page

## Viewing Data in MongoDB

### Using MongoDB Compass (GUI)

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to: `mongodb://localhost:27017`
3. Navigate to `appello-assessment` database
4. View `assessments` collection

### Using MongoDB Shell

```bash
mongosh
use appello-assessment
db.assessments.find().pretty()
```

## Project Status

✅ **Completed:**
- Multi-step form (5 sections, 23 questions)
- Auto-save functionality
- MongoDB integration
- Form validation
- Progress tracking
- Conditional logic (union questions)
- Thank you page

⏳ **Coming Soon:**
- Admin dashboard
- Authentication
- Analytics
- Media integration
- Export functionality

## Troubleshooting

### MongoDB Connection Error

If you see "MongoServerError: connect ECONNREFUSED":
- Make sure MongoDB is running: `brew services list` (macOS)
- Check MongoDB is listening on port 27017
- Verify MONGODB_URI in `.env.local`

### Port Already in Use

If port 3000 is busy:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Next Steps

Once you've tested locally and approved the concept:

1. Set up MongoDB Atlas (if not already)
2. Update environment variables for production
3. Deploy to Vercel
4. Add admin dashboard
5. Add analytics

## Support

For questions: corey@useappello.com

