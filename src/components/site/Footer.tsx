import { Link } from "@tanstack/react-router";
import { Github, Instagram } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 glass">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <Logo className="h-10 w-10" />
            <div>
              <div className="font-bold">Radian Forge Labs</div>
              <div className="text-xs text-muted-foreground">Technology Company</div>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            Building professional software through RFL Studios and immersive gaming experiences through RFL Entertainment.
          </p>

          <div className="mt-4 flex gap-2">
            <a href="https://github.com/RadianForgeLabs-RFL" target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-lg glass hover:text-blue-500"><Github className="h-4 w-4" /></a>
            <a href="https://instagram.com/radianforgelabs" target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-lg glass hover:text-rose-500"><Instagram className="h-4 w-4" /></a>
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-blue-500">Divisions</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/studios" className="hover:text-blue-500">RFL Studios</Link></li>
            <li><Link to="/entertainment" className="hover:text-rose-500">RFL Entertainment</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-purple-500">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/community" className="hover:text-blue-500">Community</Link></li>
            <li><Link to="/about" className="hover:text-blue-500">About</Link></li>
            <li><Link to="/support" className="hover:text-purple-500">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-rose-500">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-blue-500">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 px-4 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Radian Forge Labs. All rights reserved.
      </div>
    </footer>
  );
}
