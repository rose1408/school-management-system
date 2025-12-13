# Vercel Environment Variables Setup

## Required Environment Variables for Production

After deploying to Vercel, you'll need to set these environment variables in your Vercel dashboard:

### Firebase Configuration (Public - Safe to expose)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCsALtmxjmilhge-PJVdWsY1-LnRAmWTJQ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=discover-music-mnl.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=discover-music-mnl
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=discover-music-mnl.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=389933742382
NEXT_PUBLIC_FIREBASE_APP_ID=1:389933742382:web:6f08291373d8a442bfe2bf
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-QP2ZQV7CWG
```

### Base URL (Will be updated after deployment)
```
NEXT_PUBLIC_BASE_URL=https://your-vercel-domain.vercel.app
```

### Google Sheets API (Private - Keep these secret)
```
GOOGLE_SHEETS_PRIVATE_KEY=your-private-key
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account-email
GOOGLE_SHEETS_SHEET_ID=your-sheet-id
```

## Steps to Set Environment Variables in Vercel:

1. Go to your Vercel dashboard (https://vercel.com/dashboard)
2. Click on your deployed project
3. Go to Settings → Environment Variables
4. Add each variable one by one
5. Set them for "Production", "Preview", and "Development" environments

## After Setting Environment Variables:
1. Redeploy your application
2. Update NEXT_PUBLIC_BASE_URL with your actual Vercel domain
3. Test all functionality including Google Sheets integration