# Layouts

## `app/layout.tsx`
The root layout wraps every route in `Providers`, `ThemeInitializer`, and `AppChrome`, then renders the page below the fixed navigation in `main.app-main.pt-16`.

## `components/AppChrome.tsx`
Renders `BackgroundGradientAnimation` and `Navbar` on non-auth routes. Full implementation is recorded in [components.md](components.md).

## `components/lms/LmsShell.tsx`
Renders the LMS workspace header and child content grid. Full implementation is recorded in [components.md](components.md).
