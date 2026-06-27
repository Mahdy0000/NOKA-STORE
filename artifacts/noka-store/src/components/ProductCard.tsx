import { Link } from "wouter";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@workspace/api-client-react";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const displayPrice = (product.price * 50).toLocaleString("en-EG");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-card border border-border rounded-lg overflow-hidden cursor-pointer"
    >
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-[3/4] bg-muted overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <span className="text-4xl font-serif text-muted-foreground opacity-30">NŌKA</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded tracking-wider uppercase font-semibold">
                New
              </span>
            )}
            {!product.inStock && (
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded tracking-wider uppercase">
                Sold Out
              </span>
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-2 bg-background text-foreground text-sm px-4 py-2 rounded-full shadow-md font-medium tracking-wide">
              <ShoppingBag className="w-4 h-4" />
              View Product
            </div>
          </div>
        </div>

        <div className="p-4">
          {product.categoryName && (
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{product.categoryName}</p>
          )}
          <h3 className="font-medium text-foreground text-sm leading-snug mb-2">{product.name}</h3>

          {/* Color dots */}
          {product.colors.length > 0 && (
            <div className="flex gap-1.5 mb-3">
              {product.colors.slice(0, 5).map((c) => (
                <span
                  key={c}
                  className="w-3.5 h-3.5 rounded-full border border-border inline-block"
                  style={{ backgroundColor: c.toLowerCase().startsWith("#") ? c : undefined }}
                  title={c}
                />
              ))}
            </div>
          )}

          <p className="text-primary font-semibold text-base">{displayPrice} EGP</p>
        </div>
      </Link>
    </motion.div>
  );
}
