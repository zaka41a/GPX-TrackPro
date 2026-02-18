import { Link } from "react-router-dom";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-100 bg-[hsl(216,30%,98.5%)]">
      <div className="container py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <img src="/logo-gpx-trackpro.png" alt="GPX TrackPro" className="h-7 w-7 rounded-md object-cover" />
          <span className="font-bold text-slate-700 text-sm">GPX TrackPro</span>
        </div>
        <nav className="flex gap-6 text-sm text-slate-400">
          <Link to="/" className="hover:text-slate-700 transition-colors">Home</Link>
          <Link to="/about" className="hover:text-slate-700 transition-colors">About</Link>
          <Link to="/contact" className="hover:text-slate-700 transition-colors">Contact</Link>
          <Link to="/login" className="hover:text-slate-700 transition-colors">Sign In</Link>
        </nav>
        <p className="text-xs text-slate-400">&copy; 2026 GPX TrackPro. All rights reserved.</p>
      </div>
    </footer>
  );
}
