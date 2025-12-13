#!/bin/bash
# Script to set all Firebase environment variables in Vercel

echo "Setting Firebase environment variables in Vercel production..."

# Set each environment variable
echo "AIzaSyCsALtmxjmilhge-PJVdWsY1-LnRAmWTJQ" | npx vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
echo "discover-music-mnl.firebaseapp.com" | npx vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
echo "discover-music-mnl" | npx vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
echo "discover-music-mnl.firebasestorage.app" | npx vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
echo "389933742382" | npx vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
echo "1:389933742382:web:6f08291373d8a442bfe2bf" | npx vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
echo "G-QP2ZQV7CWG" | npx vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production

echo "All environment variables set!"