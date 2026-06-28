import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import {
  useGetCart,
  useUpdateCartItem,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";

export default function Cart() {
  const sessionId = useSession();
  const queryClient = useQueryClient();
  const { data: cart, isLoading } = useGetCart({ session_id: sessionId });
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  function invalidateCart() {
    queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ session_id: sessionId }) });
  }

  function handleQty(itemId: number, qty: number) {
    if (qty < 1) return;
    updateItem.mutate(
      { itemId, data: { quantity: qty, sessionId } },
      { onSuccess: invalidateCart }
    );
  }

  function handleRemove(itemId: number) {
    fetch(`/api/cart/items/${itemId}?session_id=${sessionId}`, { method: "DELETE" })
      .then(() => invalidateCart());
  }

  const displayTotal = ((cart?.total ?? 0) * 50).toLocaleString("en-EG");

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-serif font-bold text-foreground mb-10">Your Cart</h1>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse h-28 bg-muted rounded-xl" />
              ))}
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24"
            >
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-9 h-9 text-muted-foreground" />
              </div>
              <p className="text-xl font-serif text-muted-foreground mb-2">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mb-8">Start shopping to add items here</p>
              <Link href="/shop">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium tracking-wide text-sm"
                >
                  Shop Now
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="space-y-4 mb-10">
                <AnimatePresence mode="popLayout">
                  {cart.items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className="flex gap-4 p-4 bg-card border border-border rounded-xl"
                    >
                      {/* Image */}
                      <div className="w-20 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs font-serif text-muted-foreground/30">NŌKA</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-sm leading-snug mb-1 truncate">{item.productName}</h3>
                        {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
                        {item.color && <p className="text-xs text-muted-foreground">Color: {item.color}</p>}
                        <p className="text-primary font-semibold text-sm mt-2">{(item.price * 50).toLocaleString("en-EG")} EGP</p>
                      </div>

                      {/* Controls */}
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 border border-border rounded-full px-2 py-1">
                          <button
                            onClick={() => handleQty(item.id, item.quantity - 1)}
                            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQty(item.id, item.quantity + 1)}
                            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Summary */}
              <div className="border-t border-border pt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground text-sm">Subtotal ({cart.itemCount} items)</span>
                  <span className="font-semibold text-foreground">{displayTotal} EGP</span>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-muted-foreground text-sm">Shipping</span>
                  <span className="text-sm text-green-600 font-medium">Calculated at checkout</span>
                </div>
                <Link href="/checkout">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-full font-semibold tracking-wide text-sm shadow-md hover:shadow-lg transition-shadow"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
                <Link href="/shop">
                  <p className="text-center text-sm text-muted-foreground hover:text-foreground mt-4 cursor-pointer transition-colors">
                    Continue Shopping
                  </p>
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
