# PowerShell script to set environment variables in Vercel
$env:VERCEL_ENV_API_KEY = "AIzaSyCsALtmxjmilhge-PJVdWsY1-LnRAmWTJQ"
$env:VERCEL_ENV_AUTH_DOMAIN = "discover-music-mnl.firebaseapp.com"
$env:VERCEL_ENV_PROJECT_ID = "discover-music-mnl"
$env:VERCEL_ENV_STORAGE_BUCKET = "discover-music-mnl.firebasestorage.app"
$env:VERCEL_ENV_MESSAGING_SENDER_ID = "389933742382"
$env:VERCEL_ENV_APP_ID = "1:389933742382:web:6f08291373d8a442bfe2bf"
$env:VERCEL_ENV_MEASUREMENT_ID = "G-QP2ZQV7CWG"

Write-Host "Environment variables set for this session"
Write-Host "API Key: $env:VERCEL_ENV_API_KEY"
Write-Host "Auth Domain: $env:VERCEL_ENV_AUTH_DOMAIN"
Write-Host "Project ID: $env:VERCEL_ENV_PROJECT_ID"