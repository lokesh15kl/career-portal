#!/usr/bin/env pwsh

# Career Portal - GitHub Setup Script
# This script connects your local career-portal project to GitHub and enables deployment

Write-Host "=== Career Portal GitHub Setup ===" -ForegroundColor Cyan

# Step 1: Get GitHub credentials
$username = Read-Host "Enter your GitHub username"
$token = Read-Host "Enter your GitHub Personal Access Token (or press Enter to use SSH)" -AsSecureString
$plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($token))

# Step 2: Create repository via GitHub API
if ($plainToken -and $plainToken -ne "") {
    Write-Host "Creating GitHub repository..." -ForegroundColor Yellow
    
    $headers = @{
        Authorization = "Bearer $plainToken"
        "X-GitHub-Api-Version" = "2022-11-28"
    }
    
    $body = @{
        name = "career-portal"
        description = "Career Assessment Platform with React frontend and Spring Boot backend"
        private = $false
        has_issues = $true
        has_projects = $true
        has_downloads = $true
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" `
            -Method Post `
            -Headers $headers `
            -Body $body
        
        Write-Host "✓ Repository created successfully!" -ForegroundColor Green
        Write-Host "Repository URL: $($response.html_url)"
    }
    catch {
        Write-Host "✗ Failed to create repository: $_" -ForegroundColor Red
        Write-Host "You can create it manually at: https://github.com/new" -ForegroundColor Yellow
        exit 1
    }
}
else {
    Write-Host "Skipping auto-creation. Create repository manually:" -ForegroundColor Yellow
    Write-Host "1. Go to https://github.com/new" -ForegroundColor Cyan
    Write-Host "2. Repository name: career-portal" -ForegroundColor Cyan
    Write-Host "3. Description: Career Assessment Platform" -ForegroundColor Cyan
    Write-Host "4. Make it PUBLIC (required for GitHub Pages)" -ForegroundColor Cyan
    Write-Host "5. Click Create Repository" -ForegroundColor Cyan
}

# Step 3: Configure local git
Write-Host "`nConfiguring local repository..." -ForegroundColor Yellow

$repoUrl = "https://github.com/$username/career-portal.git"
Write-Host "Repository URL: $repoUrl"

# Set remote origin
git remote remove origin 2>$null
git remote add origin $repoUrl

# Verify
$currentRemote = git config --get remote.origin.url
if ($currentRemote -eq $repoUrl) {
    Write-Host "✓ Remote configured successfully" -ForegroundColor Green
}
else {
    Write-Host "✗ Failed to configure remote" -ForegroundColor Red
    exit 1
}

# Step 4: Push to GitHub
Write-Host "`nPushing code to GitHub..." -ForegroundColor Yellow

try {
    git branch -M main
    git push -u origin main
    Write-Host "✓ Code pushed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to push code: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Enable GitHub Pages
Write-Host "`n=== GitHub Pages Setup ===" -ForegroundColor Cyan
Write-Host "Configuring GitHub Pages for frontend deployment..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Complete these steps manually in GitHub:" -ForegroundColor Yellow
Write-Host "1. Go to: https://github.com/$username/career-portal" -ForegroundColor Cyan
Write-Host "2. Settings → Pages" -ForegroundColor Cyan
Write-Host "3. Source: Deploy from a branch" -ForegroundColor Cyan
Write-Host "4. Branch: gh-pages, Folder: / (root)" -ForegroundColor Cyan
Write-Host "5. Save" -ForegroundColor Cyan
Write-Host ""

# Step 6: Setup Render deployment
Write-Host "=== Render Backend Setup ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deploy backend to Render:" -ForegroundColor Yellow
Write-Host "1. Go to https://dashboard.render.com" -ForegroundColor Cyan
Write-Host "2. Click 'New +' → 'Blueprint'" -ForegroundColor Cyan
Write-Host "3. Connect GitHub account and select 'career-portal' repo" -ForegroundColor Cyan
Write-Host "4. Render will automatically use render.yaml for setup" -ForegroundColor Cyan
Write-Host "5. Configure environment variables in Render dashboard:" -ForegroundColor Cyan
Write-Host "   - SMTP_USERNAME: your-email@gmail.com" -ForegroundColor Cyan
Write-Host "   - SMTP_PASSWORD: your-app-password" -ForegroundColor Cyan
Write-Host "   - HUGGINGFACE_API_KEY: (optional)" -ForegroundColor Cyan
Write-Host ""

# Step 7: Local testing
Write-Host "=== Local Development ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Start local development servers:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Terminal 1 - Frontend:" -ForegroundColor Cyan
Write-Host "  npm install" -ForegroundColor Green
Write-Host "  npm run dev" -ForegroundColor Green
Write-Host "  → http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "Terminal 2 - Backend:" -ForegroundColor Cyan
Write-Host "  cd backend" -ForegroundColor Green
Write-Host "  .\mvnw spring-boot:run" -ForegroundColor Green
Write-Host "  → http://localhost:8080" -ForegroundColor Gray
Write-Host ""

# Final status
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Deployment Checklist:" -ForegroundColor Cyan
Write-Host "  ✓ Local git repository initialized" -ForegroundColor Green
Write-Host "  ✓ Code pushed to GitHub" -ForegroundColor Green
Write-Host "  ☐ GitHub Pages enabled (Settings → Pages)" -ForegroundColor Yellow
Write-Host "  ☐ Render deployment configured" -ForegroundColor Yellow
Write-Host "  ☐ Environment variables set in Render" -ForegroundColor Yellow
Write-Host "  ☐ MySQL database provisioned on Render" -ForegroundColor Yellow
Write-Host ""
Write-Host "After completing all steps:" -ForegroundColor Cyan
Write-Host "- Frontend: https://github.io/career-portal" -ForegroundColor Green
Write-Host "- Backend: https://career-portal-api.onrender.com" -ForegroundColor Green
Write-Host ""
Write-Host "See DEPLOYMENT.md for detailed instructions." -ForegroundColor Yellow
