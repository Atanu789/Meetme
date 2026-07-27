# Extractable Components

## AppChrome
- Source: `components/AppChrome.tsx`
- Category: layout
- Description: App-wide visual background and fixed navigation.
- Extractable props: none.
- Hardcoded: background animation and Navbar.

## LmsShell
- Source: `components/lms/LmsShell.tsx`
- Category: layout
- Description: Workspace hero and responsive content container.
- Extractable props: `kicker`, `title`, `description`, `stats`.
- Hardcoded: dark header treatment, cyan/mint accents, title typography.

## GlowCard
- Source: `components/ui/glow-card.tsx`
- Category: basic
- Description: Reusable elevated bordered content surface.
- Extractable props: `className`, children.
- Hardcoded: glow and hover styling.

## GradientBorderButton
- Source: `components/ui/gradient-border-button.tsx`
- Category: basic
- Description: Primary interaction button.
- Extractable props: standard button props and className.
- Hardcoded: gradient border treatment.
