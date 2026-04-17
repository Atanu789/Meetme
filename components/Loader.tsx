'use client';

export function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent">
      <div className="rounded-3xl border border-slate-200 bg-white/85 px-8 py-7 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-slate-950 border-r-slate-950 animate-spin"></div>
          </div>
          <div>
            <p className="font-display text-base font-semibold text-slate-950">Loading</p>
            <p className="text-sm text-slate-500">Preparing your workspace</p>
          </div>
        </div>
      </div>
    </div>
  );
}
