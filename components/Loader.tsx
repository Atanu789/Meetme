'use client';

export function Loader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
      </div>
    </div>
  );
}
