import { Link, useLocation } from "wouter";
import { ShoppingBag, Menu, X, Settings } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetCart } from "@workspace/api-client-react";
import { useSession } from "@/hooks/useSession";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const sessionId = useSession();
  const { data: cart } = useGetCart({ session_id: sessionId });
  const itemCount = cart?.itemCount ?? 0;

  const links = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <span className="text-2xl font-serif font-bold tracking-widest text-foreground cursor-pointer select-none">
              NŌKA
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link key={l.href} href={l.href}>
                <span
                  className={`text-sm tracking-wider uppercase cursor-pointer transition-colors duration-200 ${
                    location === l.href
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/cart">
              <button className="relative p-2 hover:text-primary transition-colors">
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </button>
            </Link>

            {localStorage.getItem("noka_admin") === "true" && (
              <Link href="/admin">
                <button
                  title="Admin Panel"
                  className={`p-2 transition-colors ${location === "/admin" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 hover:text-primary transition-colors"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="px-4 py-4 flex flex-col gap-4">
              {links.map((l) => (
                <Link key={l.href} href={l.href}>
                  <span
                    className="text-sm tracking-wider uppercase cursor-pointer text-muted-foreground hover:text-foreground block py-1"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
