# Career Portal - Full Stack Deployment Guide

Complete setup for deploying Career Assessment Platform with React frontend on GitHub Pages and Spring Boot backend on Render.

## Project Structure

```
career-portal/
├── frontend/               # React + Vite application
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── ...
├── backend/               # Spring Boot API server  
│   ├── src/
│   ├── pom.xml
│   ├── mvnw
│   └── ...
├── render.yaml           # Render deployment blueprint
├── .github/
│   └── workflows/
│       └── deploy.yml    # GitHub Actions CI/CD
└── README.md
```

## Deployment Architecture

- **Frontend**: React + Vite → GitHub Pages (`https://lokesh15kl.github.io/career-portal`)
- **Backend**: Spring Boot → Render (`https://career-portal-api.onrender.com`)
- **Database**: MySQL on Render
- **CI/CD**: GitHub Actions (auto-deploy on push)

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `career-portal`
3. Visibility: **Public** (required for free GitHub Pages)
4. Click "Create repository"

## Step 2: Initial GitHub Push

```bash
cd C:\Users\bhaga\career-portal
git remote add origin https://github.com/[YOUR_USERNAME]/career-portal.git
git branch -M main
git push -u origin main
```

## Step 3: Enable GitHub Pages

1. Go to repository → Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: **gh-pages**
4. Root path: **/(root)**
5. Custom domain: (optional, if you have one)

## Step 4: Deploy Backend on Render

### Option A: Using Render Blueprint (Automatic)

1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect your GitHub account
4. Select `career-portal` repository
5. Click "Apply"
6. Configure environment variables:
   - `SMTP_USERNAME`: Your Gmail address
   - `SMTP_PASSWORD`: Your Gmail app password
   - `HUGGINGFACE_API_KEY`: (optional, for AI quiz generation)

### Option B: Manual Setup

1. Create web service on Render
2. Build command: `./backend/mvnw clean package -DskipTests=true`
3. Start command: `cd backend && java -jar target/full-project-0.0.1-SNAPSHOT.jar`
4. Set environment variables (see Step 5)

## Step 5: Configure Environment Variables

### On Render Dashboard (Backend):

| Variable | Value | Example |
|----------|-------|---------|
| `PORT` | `8080` | *(auto-set)* |
| `DATABASE_URL` | MySQL JDBC URL | `jdbc:mysql://host:3306/career_db` |
| `DATABASE_USERNAME` | MySQL user | `root` |
| `DATABASE_PASSWORD` | MySQL password | `****` |
| `SMTP_USERNAME` | Gmail address | `youremail@gmail.com` |
| `SMTP_PASSWORD` | Gmail app password | `xxxx xxxx xxxx xxxx` |
| `HUGGINGFACE_API_KEY` | API key (optional) | `hf_xxxxx` |
| `FRONTEND_ORIGINS` | Frontend URL | `https://lokesh15kl.github.io/career-portal` |

### Get Gmail App Password:

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy the generated 16-character password
4. Use in `SMTP_PASSWORD`

### Get HuggingFace API Key (Optional):

1. Go to https://huggingface.co/settings/tokens
2. Create new token with read access
3. Copy and use in `HUGGINGFACE_API_KEY`

## Step 6: Setup MySQL Database

### Option A: Render Managed Database
- Render blueprint includes MySQL database provisioning
- Database credentials auto-injected as `DATABASE_URL`

### Option B: External MySQL Services

- **Aiven.io**: Free tier available
- **PlanetScale**: Serverless MySQL
- **Railway**: MySQL with free tier
- **AWS RDS**: Free tier for 12 months

Example connection strings:
```
jdbc:mysql://host:3306/dbname?useSSL=true&serverTimezone=UTC
```

## Step 7: Local Development

### Terminal 1: Backend Server

```bash
cd backend
./mvnw spring-boot:run
```

Backend runs on `http://localhost:8080`

### Terminal 2: Frontend Dev Server

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### Terminal 3: Build Production (Optional)

```bash
npm run build
```

Creates optimized build in `dist/` folder and pushes to GitHub Pages via GitHub Actions.

## Deployment After Push

When you push to `main` branch:

1. **GitHub Actions** automatically runs
2. Builds frontend with `npm run build`
3. Deploys to GitHub Pages via `gh-pages` branch
4. Render auto-redeploys backend if relevant files changed

Monitor deployments:
- GitHub: Repository → Actions tab
- Render: Dashboard → Service logs

## Environment Setup Checklist

- [ ] GitHub repository created
- [ ] Repository linked locally via `git remote`
- [ ] GitHub Pages enabled (Settings → Pages)
- [ ] Render account created (https://render.com)
- [ ] MySQL database provisioned
- [ ] Environment variables secured in Render
- [ ] Gmail app password configured
- [ ] First deployment completed
- [ ] Frontend accessible at `https://lokesh15kl.github.io/career-portal`
- [ ] Backend API accessible from frontend

## Troubleshooting

### Frontend not loading (404)

- Check `vite.config.js` `base` setting matches repo name
- Verify GitHub Pages branch is `gh-pages` and root is `/`

### Backend CORS errors

- Ensure `FRONTEND_ORIGINS` env var includes GitHub Pages URL
- Check `WebConfig.java` CORS mappings

### Login/OTP not working

- Verify `SMTP_USERNAME` and `SMTP_PASSWORD` are correct
- Check Gmail account has 2FA enabled
- Use app-specific password, not regular password

### Database connection failed

- Verify `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`
- Check database is accessible from Render (firewall rules)
- Ensure database exists

## Support & Resources

- React + Vite: https://vitejs.dev
- Spring Boot: https://spring.io/projects/spring-boot
- Render Docs: https://render.com/docs
- GitHub Pages: https://pages.github.com

## Quick Commands

```bash
# Start all services locally
npm run dev          # Frontend on localhost:5173
# (in another terminal)
cd backend && ./mvnw spring-boot:run  # Backend on localhost:8080

# Build for production
npm run build

# Deploy frontend to GitHub Pages
npm run deploy

# Deploy backend (via Render dashboard or git push)
git add . && git commit -m "Deploy changes" && git push origin main
```

