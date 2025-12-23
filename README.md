# Smart Disaster Hub - Angular

Angular version of Smart Disaster Hub frontend application.

## Features

- Authentication (Login, Register)
- User Dashboard
- User Profile
- JWT Token-based Authentication
- HTTP Interceptors for API calls
- Route Guards for protected routes
- Modern, clean UI with CSS Variables theme system

## Development

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/app/
├── core/
│   ├── guards/          # Route guards (auth, guest)
│   ├── interceptors/    # HTTP interceptors (auth, error)
│   └── services/        # Core services (auth.service)
├── shared/
│   └── components/      # Shared components (BaseButton, AppHeader)
├── features/
│   ├── auth/            # Authentication features (Login, Register)
│   ├── dashboard/       # Dashboard feature
│   └── profile/         # Profile feature
├── models/              # TypeScript interfaces
├── constants/           # Constants (API endpoints, storage keys, roles)
└── app.routes.ts        # Route configuration
```

## API Configuration

Default API base URL: `http://localhost:8082`

Update in `src/app/core/services/auth.service.ts` if needed.

## Authentication

The app uses JWT tokens stored in localStorage. The AuthService manages authentication state and provides methods for login, register, and logout.

## Routing

- `/` - Redirects to `/dashboard`
- `/login` - Login page (guest only)
- `/register` - Registration page (guest only)
- `/dashboard` - Dashboard page (authenticated only)
- `/profile` - Profile page (authenticated only)

## Technologies

- Angular 20
- TypeScript
- RxJS
- Angular Reactive Forms
- CSS Variables (Theme System)
