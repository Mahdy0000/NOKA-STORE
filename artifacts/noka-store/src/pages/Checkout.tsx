import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useGetCart, useCreateOrder, useListDeliveryZones, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";

const GOVERNORATES = [
  "Cairo", "Giza", "Alexandria", "Dakahlia", "Red Sea", "Beheira", "Fayoum",
  "Gharbia", "Ismailia", "Menofia", "Minya", "Qaliubiya", "New Valley", "Suez",
  "Aswan", "Assiut", "Beni Suef", "Port Said", "Damietta", "Sharkia",
  "South Sinai", "Kafr El Sheikh", "Matruh", "Luxor", "Qena",
  "North Sinai", "Sohag",
];

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  governorate: string;
  notes: string;
}

export default function Checkout() {
  const [, navigate] = useLocation();
  const sessionId = useSession();
  const queryClient = useQueryClient();

  const { data: cart } = useGetCart({ session_id: sessionId });
  const { data: deliveryZones = [] } = useListDeliveryZones();
  const createOrder = useCreateOrder();

  const [form, setForm] = useState<FormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    city: "",
    governorate: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  function validate() {
    const e: Partial<FormData> = {};
    if (!form.customerName.trim()) e.customerName = "Required";
    if (!form.customerPhone.trim()) e.customerPhone = "Required";
    if (!form.address.trim()) e.address = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.governorate) e.governorate = "Required";
    return e;
  }

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  const zoneMap = new Map(deliveryZones.map((z) => [z.name, z]));
  const selectedZone = zoneMap.get(form.governorate);
  const subtotal = (cart?.total ?? 0) * 50;
  const deliveryFee = selectedZone ? selectedZone.fee * 50 : 0;
  const displayTotal = (subtotal + deliveryFee).toLocaleString("en-EG");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    createOrder.mutate(
      {
        data: {
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone,
          address: form.address,
          city: form.city,
          governorate: form.governorate,
          sessionId,
          deliveryZoneId: selectedZone?.id,
          notes: form.notes || undefined,
        },
      },
      {
        onSuccess: (order) => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ session_id: sessionId }) });
          navigate(`/order-confirmation/${order.id}`);
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-10">Checkout</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* Form fields */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-5 font-serif">Contact Details</h2>
                  <div className="space-y-4">
                    {([
                      { field: "customerName", label: "Full Name", type: "text", placeholder: "Ahmed Hassan" },
                      { field: "customerEmail", label: "Email", type: "email", placeholder: "ahmed@example.com" },
                      { field: "customerPhone", label: "Phone Number", type: "tel", placeholder: "01xxxxxxxxx" },
                    ] as const).map(({ field, label, type, placeholder }) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
                        <input
                          type={type}
                          placeholder={placeholder}
                          value={form[field]}
                          onChange={(e) => handleChange(field, e.target.value)}
                          className={`w-full border rounded-lg px-4 py-3 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors[field] ? "border-destructive" : "border-border"}`}
                        />
                        {errors[field] && <p className="text-xs text-destructive mt-1">{errors[field]}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-5 font-serif">Delivery Address</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Street Address</label>
                      <input
                        type="text"
                        placeholder="123 El Tahrir St, Apt 4"
                        value={form.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        className={`w-full border rounded-lg px-4 py-3 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.address ? "border-destructive" : "border-border"}`}
                      />
                      {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">City</label>
                        <input
                          type="text"
                          placeholder="Cairo"
                          value={form.city}
                          onChange={(e) => handleChange("city", e.target.value)}
                          className={`w-full border rounded-lg px-4 py-3 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.city ? "border-destructive" : "border-border"}`}
                        />
                        {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Governorate</label>
                        <select
                          value={form.governorate}
                          onChange={(e) => handleChange("governorate", e.target.value)}
                          className={`w-full border rounded-lg px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.governorate ? "border-destructive" : "border-border"}`}
                        >
                          <option value="">Select...</option>
                          {GOVERNORATES.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                        {errors.governorate && <p className="text-xs text-destructive mt-1">{errors.governorate}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Order Notes (optional)</label>
                      <textarea
                        placeholder="Any special delivery instructions..."
                        value={form.notes}
                        onChange={(e) => handleChange("notes", e.target.value)}
                        rows={3}
                        className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="lg:col-span-2">
                <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                  <h2 className="text-lg font-semibold mb-5 font-serif">Order Summary</h2>
                  {cart?.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start py-2 border-b border-border last:border-0 text-sm">
                    <div className="flex-1 min-w-0 pr-4">
                         <p className="font-medium text-foreground truncate">{item.productName}</p>
                         <p className="text-muted-foreground text-xs">
                           {[item.size, item.color].filter(Boolean).join(" / ")} &times; {item.quantity}
                         </p>
                       </div>
                       <p className="text-foreground font-medium whitespace-nowrap">{(item.price * item.quantity * 50).toLocaleString("en-EG")} EGP</p>
                     </div>
                   ))}
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-muted-foreground">Subtotal</span>
                     <span className="text-foreground">{(cart?.total ?? 0) * 50 === 0 ? "—" : `${((cart?.total ?? 0) * 50).toLocaleString("en-EG")} EGP`}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-muted-foreground">Delivery{form.governorate ? ` (${form.governorate})` : ""}</span>
                     <span className="text-foreground">{form.governorate ? `${deliveryFee.toLocaleString("en-EG")} EGP` : "—"}</span>
                   </div>
                   <div className="border-t border-border pt-4 mt-4 flex justify-between items-center">
                     <span className="font-semibold text-foreground">Total</span>
                     <span className="text-xl font-bold text-primary">{displayTotal} EGP</span>
                   </div>
                  <p className="text-xs text-muted-foreground mt-2 mb-6">Cash on delivery available</p>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={createOrder.isPending || !cart?.items.length}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-full font-semibold tracking-wide text-sm shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createOrder.isPending ? "Placing Order..." : "Place Order"}
                  </motion.button>

                  <Link href="/cart">
                    <p className="text-center text-xs text-muted-foreground hover:text-foreground mt-4 cursor-pointer transition-colors">
                      Edit Cart
                    </p>
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
