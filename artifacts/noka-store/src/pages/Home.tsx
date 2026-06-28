import { Suspense, lazy } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Package, Truck, Heart } from "lucide-react";
import { useGetFeaturedProducts, useGetNewArrivals } from "@workspace/api-client-react";
import ProductCard from "@/components/ProductCard";

const Hero3D = lazy(() => import("@/components/Hero3D"));

export default function Home() {
  const { data: featured = [] } = useGetFeaturedProducts();
  const { data: newArrivals = [] } = useGetNewArrivals();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-background via-secondary/40 to-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-24 pb-16">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm uppercase tracking-[0.3em] text-primary font-medium mb-4"
            >
              Cairo, Egypt
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-6xl sm:text-7xl lg:text-8xl font-serif font-bold leading-none tracking-tight text-foreground mb-6"
            >
              NŌKA
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-md"
            >
              Effortless unisex wear born in Cairo. Comfort that moves with you — from rooftops to streets, every day.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex gap-4"
            >
              <Link href="/shop">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-medium tracking-wide text-sm shadow-md hover:shadow-lg transition-shadow"
                >
                  Shop Now
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* 3D Scene */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.9 }}
            className="h-[420px] lg:h-[520px] w-full"
          >
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><span className="text-6xl font-serif text-muted-foreground/30">NŌKA</span></div>}>
              <Hero3D />
            </Suspense>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="w-0.5 h-12 bg-gradient-to-b from-primary to-transparent mx-auto"
          />
        </motion.div>
      </section>

      {/* Featured Collection */}
      {featured.length > 0 && (
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-end justify-between mb-12"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-2">Curated For You</p>
                <h2 className="text-4xl font-serif font-bold text-foreground">Featured Collection</h2>
              </div>
              <Link href="/shop">
                <span className="flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer tracking-wide">
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featured.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brand Story */}
      <section className="py-24 bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-4">Our Story</p>
              <h2 className="text-4xl font-serif font-bold text-foreground mb-6 leading-tight">
                Comfort is not a compromise
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6 text-base">
                NŌKA started with one idea: clothing that feels as good as it looks. No gender rules, no complicated silhouettes — just quality fabric, honest cuts, and designs that belong to everyone.
              </p>
              <p className="text-muted-foreground leading-relaxed text-base">
                Based in Egypt, shipping across the country. We believe comfortable style is a right, not a luxury.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="grid grid-cols-3 gap-6"
            >
              {[
                { icon: Package, title: "Quality First", desc: "Every piece carefully crafted" },
                { icon: Heart, title: "Unisex Design", desc: "Made for everyone" },
                { icon: Truck, title: "Egypt-Wide", desc: "Shipping to all governorates" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="text-center p-4 bg-background rounded-xl border border-border">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">{title}</h4>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-end justify-between mb-12"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-2">Just Dropped</p>
                <h2 className="text-4xl font-serif font-bold text-foreground">New Arrivals</h2>
              </div>
              <Link href="/shop">
                <span className="flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer tracking-wide">
                  Shop all <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newArrivals.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-serif font-bold mb-4">Wear your comfort</h2>
            <Link href="/shop">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-primary-foreground text-primary px-10 py-3.5 rounded-full font-semibold tracking-wide text-sm"
              >
                Explore the Collection
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-3xl font-serif font-bold mb-3 tracking-widest">NŌKA</h3>
              <p className="text-background/60 text-sm leading-relaxed">
                Casual unisex wear from Cairo.<br />Shipped across Egypt.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Shop</h4>
              <ul className="space-y-2">
                <li><Link href="/shop"><span className="text-background/60 hover:text-background text-sm cursor-pointer transition-colors">All Products</span></Link></li>
                <li><Link href="/shop"><span className="text-background/60 hover:text-background text-sm cursor-pointer transition-colors">New Arrivals</span></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Follow Us</h4>
              <p className="text-background/60 text-sm">Facebook: NŌKA Egypt</p>
              <p className="text-background/60 text-sm mt-1">Egypt — Shipping Nationwide</p>
            </div>
          </div>
          <div className="border-t border-background/10 mt-12 pt-8 text-center text-background/40 text-xs">
            &copy; {new Date().getFullYear()} NŌKA. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
