import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="page-shell flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_0.85fr] lg:items-center">
        <div className="space-y-5">
          <p className="section-kicker">Welcome back</p>
          <h1 className="section-title font-display text-5xl font-semibold text-slate-950">
            Sign in to manage your rooms.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-slate-600">
            Access your meetings, review chat history, and re-open private rooms from one place.
          </p>
        </div>
        <div className="surface-strong rounded-[2rem] p-4 sm:p-6">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            appearance={{
              variables: {
                colorPrimary: '#0f172a',
                colorText: '#0f172a',
                colorBackground: '#ffffff',
                colorInputBackground: '#f8fafc',
                borderRadius: '16px',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
