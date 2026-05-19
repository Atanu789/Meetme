export function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-600">
      <div className="page-shell flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="text-center sm:text-left">
          <p className="font-semibold text-slate-900">Melanam</p>
          <p className="mt-1">Secure rooms · Live captions · AI recaps</p>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <a href="/security" className="hover:underline">Security</a>
          <a href="/docs" className="hover:underline">Docs</a>
          <a href="/pricing" className="hover:underline">Pricing</a>
        </div>

        <div className="text-center sm:text-right text-xs text-slate-400">© {new Date().getFullYear()} Melanam</div>
      </div>
    </footer>
  );
}
