# Career Portal - Assessment Platform

A full-stack career assessment platform with AI-powered quiz generation, role-based access, and comprehensive analytics.

## Features

- ✨ **Interactive Quizzes**: Multiple assessment types (MCQ, written, audio)
- 🤖 **AI Quiz Generation**: Auto-generate quizzes using HuggingFace API
- 👤 **Role-Based Access**: Separate user and admin portals with protected routes
- 📊 **Analytics Dashboard**: Track user progress and assessments
- 🎨 **Neon UI Design**: Modern, animated dark/light theme
- 🌓 **Theme Toggle**: Global light/dark mode support
- 🎯 **Career Recommendations**: Personalized career path suggestions
- ⚡ **Fast Development**: React 19 + Vite with hot reload
- 🔐 **Secure Auth**: Session-based authentication with captcha

## Tech Stack

### Frontend
- React 19
- Vite 8 (build tool)
- React Router v7 (navigation)
- CSS3 with custom animations

### Backend
- Spring Boot 4.0.2
- Spring Data JPA
- MySQL 8.0
- Spring Mail (Gmail SMTP)
- HuggingFace API integration

### Deployment
- **Frontend**: GitHub Pages
- **Backend**: Render
- **Database**: MySQL on Render
- **CI/CD**: GitHub Actions

## Deployment Scope
- Authentication screens: login and signup.
- Route protection via role-aware guards.
- User journey pages:
	- Home
	- User Portal
	- Dashboard
	- Quiz
	- Career Explorer
	- My Results
- Admin journey pages:
	- Admin Portal
	- Admin Analytics

### Technical Stack
- React 19
- Vite 8
- React Router DOM 7
- ESLint 9

### Architecture Notes
- Routing is centralized in `src/App.jsx`.
- Access control is enforced by `src/components/ProtectedRoute.jsx`.
- API/auth behavior is isolated in `src/services/`:
	- `api.js`
	- `auth.js`
	- `recommendations.js`
	- `userProgress.js`
- Global visual tokens and shared UI behavior are in `src/styles/global.css`.

### Environment Assumptions
- Backend endpoints are consumed via service-layer functions.
- Authentication state uses token/session + role metadata.
- If backend session checks fail, frontend falls back to locally stored auth context.

## Local Development

### Prerequisites
- Node.js 18+
- npm 9+

### Install
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint
```bash
npm run lint
```

## Current Folder Structure

```text
src/
	App.jsx
	main.jsx
	components/
		ProtectedRoute.jsx
	pages/
		Home.jsx
		Login.jsx
		Signup.jsx
		UserPortal.jsx
		Dashboard.jsx
		Quiz.jsx
		CareerExplorer.jsx
		MyResults.jsx
		AdminPortal.jsx
		AdminAnalytics.jsx
	services/
		api.js
		auth.js
		recommendations.js
		userProgress.js
	styles/
		global.css
```

## Next Recommended Enhancements
- Add centralized error boundary and loading skeletons.
- Add unit/integration tests for protected route flows.
- Add API base URL via environment variables for easier deployment.
