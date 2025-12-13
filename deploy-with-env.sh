#!/bin/bash
# Deployment script with environment variables

# Set environment variables for this deployment
export NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyCsALtmxjmilhge-PJVdWsY1-LnRAmWTJQ"
export NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="discover-music-mnl.firebaseapp.com"
export NEXT_PUBLIC_FIREBASE_PROJECT_ID="discover-music-mnl"
export NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="discover-music-mnl.firebasestorage.app"
export NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="389933742382"
export NEXT_PUBLIC_FIREBASE_APP_ID="1:389933742382:web:6f08291373d8a442bfe2bf"
export NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-QP2ZQV7CWG"

echo "Environment variables set for deployment"
echo "Building and deploying..."

# Build and deploy
npm run build
npx vercel --prod --yes