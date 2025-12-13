# PowerShell script for deploying with environment variables
Write-Host "Building and deploying to production..." -ForegroundColor Green

Write-Host "Building application..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Deploying to production..." -ForegroundColor Green
    npx vercel --prod --yes
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Deployment successful!" -ForegroundColor Green
        Write-Host "Live URL: https://discovermusic-live.vercel.app" -ForegroundColor Cyan
        Write-Host "Teachers: https://discovermusic-live.vercel.app/teachers" -ForegroundColor Cyan
        Write-Host "Debug: https://discovermusic-live.vercel.app/debug-firebase-live" -ForegroundColor Cyan
        Write-Host "Environment Check: https://discovermusic-live.vercel.app/api/check-env" -ForegroundColor Cyan
    } else {
        Write-Host "Deployment failed!" -ForegroundColor Red
    }
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}