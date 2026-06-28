import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ShoppingBag, ChevronLeft, Check } from "lucide-react";
import { useGetProduct, useListProducts, useAddToCart, getGetCartQueryKey, getGetProductQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import ProductCard from "@/components/ProductCard";
import { Link } from "wouter";

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const [, navigate] = useLocation();
  const sessionId = useSession();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) },
  });
  const { data: allProducts = [] } = useListProducts();
  const addToCart = useAddToCart();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);

  const related = allProducts.filter(
    (p) => p.id !== productId && p.categoryId === product?.categoryId
  ).slice(0, 4);

  const displayPrice = product ? (product.price * 50).toLocaleString("en-EG") : "";
  const allImages = product
    ? [product.imageUrl, ...(product.images ?? [])].filter(Boolean) as string[]
    : [];

  function handleAddToCart() {
    if (!product) return;
    addToCart.mutate(
      {
        data: {
          productId: product.id,
          quantity: 1,
          size: selectedSize || undefined,
          color: selectedColor || undefined,
          sessionId,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ session_id: sessionId }) });
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <div className="animate-pulse text-5xl font-serif text-muted-foreground/30">NŌKA</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Product not found.</p>
          <Link href="/shop">
            <button className="text-primary hover:underline text-sm">Back to shop</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <Link href="/shop">
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to shop
          </button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted mb-4">
              {allImages.length > 0 ? (
                <img
                  src={allImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl font-serif text-muted-foreground/30">NŌKA</span>
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-3">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-20 rounded-md overflow-hidden border-2 transition-all ${
                      selectedImage === i ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col"
          >
            {product.categoryName && (
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">{product.categoryName}</p>
            )}
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">{product.name}</h1>

            {(product.isNew) && (
              <span className="inline-block bg-primary/10 text-primary text-xs px-3 py-1 rounded-full mb-3 w-fit font-semibold tracking-wide uppercase">
                New Arrival
              </span>
            )}

            <p className="text-3xl font-bold text-primary mb-6">{displayPrice} EGP</p>

            <p className="text-muted-foreground leading-relaxed mb-8 text-base">{product.description}</p>

            {/* Colors */}
            {product.colors.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
                  Color {selectedColor && <span className="text-muted-foreground font-normal normal-case tracking-normal">— {selectedColor}</span>}
                </p>
                <div className="flex gap-3">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                        selectedColor === c ? "border-primary scale-110" : "border-border"
                      }`}
                      title={c}
                      style={{
                        backgroundColor: c.toLowerCase().startsWith("#") ? c : undefined,
                        background: !c.toLowerCase().startsWith("#")
                          ? `linear-gradient(135deg, #d4b896, #b8956a)`
                          : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div className="mb-8">
                <p className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Size</p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-4 py-2 border rounded-md text-sm font-medium transition-all duration-200 ${
                        selectedSize === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            {product.inStock ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={addToCart.isPending}
                className={`flex items-center justify-center gap-3 w-full py-4 rounded-full font-semibold tracking-wide text-sm transition-all shadow-md ${
                  added
                    ? "bg-green-600 text-white"
                    : "bg-primary text-primary-foreground hover:shadow-lg"
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    Add to Cart
                  </>
                )}
              </motion.button>
            ) : (
              <button
                disabled
                className="w-full py-4 rounded-full bg-muted text-muted-foreground font-semibold tracking-wide text-sm cursor-not-allowed"
              >
                Out of Stock
              </button>
            )}

          </motion.div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-24">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-8">You may also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
