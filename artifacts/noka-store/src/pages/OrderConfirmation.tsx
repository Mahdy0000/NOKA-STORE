import { useParams } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, Package } from "lucide-react";
import { Link } from "wouter";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { data: order, isLoading } = useGetOrder(orderId, {
    query: { enabled: !!orderId, queryKey: getGetOrderQueryKey(orderId) },
  });

  return (
    <div className="min-h-screen bg-background pt-20 flex items-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        {isLoading ? (
          <div className="text-center">
            <div className="animate-pulse text-5xl font-serif text-muted-foreground/30">NŌKA</div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-serif font-bold text-foreground mb-3"
            >
              Order Placed!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-8 text-lg"
            >
              Thank you for your order. We will contact you to confirm delivery details.
            </motion.p>

            {order && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card border border-border rounded-xl p-6 text-left mb-8"
              >
                <div className="flex items-center gap-3 mb-5">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Order #{order.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="ml-auto bg-primary/10 text-primary text-xs px-3 py-1 rounded-full font-semibold capitalize">
                    {order.status}
                  </span>
                </div>

                <div className="space-y-3 mb-5">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-foreground">
                        {item.productName}
                        {item.size && ` (${item.size})`}
                        {" "}&times; {item.quantity}
                      </span>
                      <span className="font-medium text-foreground">
                        {(item.price * item.quantity * 50).toLocaleString("en-EG")} EGP
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-primary text-lg">
                    {(order.total * 50).toLocaleString("en-EG")} EGP
                  </span>
                </div>

                <div className="border-t border-border pt-4 mt-4 text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">Deliver to:</span> {order.customerName}</p>
                  <p>{order.address}, {order.city}, {order.governorate}</p>
                  <p>{order.customerPhone}</p>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Link href="/shop">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-primary text-primary-foreground px-10 py-3.5 rounded-full font-semibold tracking-wide text-sm shadow-md"
                >
                  Continue Shopping
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
