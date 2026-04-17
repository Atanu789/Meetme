import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="page-shell flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_0.85fr] lg:items-center">
        <div className="space-y-5">
          <p className="section-kicker">Get started</p>
          <h1 className="section-title font-display text-5xl font-semibold text-slate-950">
            Create a professional meeting workspace.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-slate-600">
            Build private rooms, store chats, and keep meeting history in a clean interface your team can trust.
          </p>
        </div>
        <div className="surface-strong rounded-[2rem] p-4 sm:p-6">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
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
