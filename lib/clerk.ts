// Clerk configuration is handled via environment variables
// The @clerk/nextjs package will automatically use these:
// - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
// - CLERK_SECRET_KEY

export const clerkConfig = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
};
