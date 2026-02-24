# Career Assessment Frontend

Frontend application for a career guidance and assessment platform with role-based access for users and admins.

## Project Specifications

### Product Goals
- Help users evaluate strengths through guided quizzes.
- Recommend suitable career paths and show progress over time.
- Provide admin workflows for oversight and analytics.

### User Roles
- USER:
	- Access quiz, dashboard, career explorer, and results views.
	- Track personal progress and recommendations.
- ADMIN:
	- Access admin portal and analytics views.
	- Monitor platform-level data and user outcomes.

### Functional Scope
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
