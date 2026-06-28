import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Package, ShoppingBag, Tags, Ruler, Truck, X, ChevronDown, Eye, Pencil, Upload
} from "lucide-react";
import {
  useListProducts,
  useListCategories,
  useListOrders,
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
  getListProductsQueryKey,
  getGetStoreSummaryQueryKey,
  useListDeliveryZones,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const ADMIN_PIN = "noka2024";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const GOVERNORATES = [
  "Cairo", "Giza", "Alexandria", "Dakahlia", "Red Sea", "Beheira", "Fayoum",
  "Gharbia", "Ismailia", "Menofia", "Minya", "Qaliubiya", "New Valley", "Suez",
  "Aswan", "Assiut", "Beni Suef", "Port Said", "Damietta", "Sharkia",
  "South Sinai", "Kafr El Sheikh", "Matruh", "Luxor", "Qena",
  "North Sinai", "Sohag",
];

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  imageUrls: string[];
  categoryId: string;
  sizes: string[];
  colors: string;
  inStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
}

const EMPTY_FORM: ProductFormData = {
  name: "",
  description: "",
  price: "",
  imageUrls: [],
  categoryId: "",
  sizes: [],
  colors: "",
  inStock: true,
  isFeatured: false,
  isNew: false,
};

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [tab, setTab] = useState<"products" | "categories" | "sizes" | "orders" | "delivery">("products");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { data: products = [], isLoading: loadingProducts } = useListProducts();
  const { data: categories = [], refetch: refetchCategories } = useListCategories();
  const { data: orders = [], isLoading: loadingOrders } = useListOrders();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  // Category form state
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catImage, setCatImage] = useState("");
  const [editingCat, setEditingCat] = useState<number | null>(null);
  const [catSaving, setCatSaving] = useState(false);
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<number | null>(null);

  // Order status change state
  const [changingStatus, setChangingStatus] = useState<number | null>(null);

  // Sizes state
  const [allSizes, setAllSizes] = useState<{ id: number; name: string }[]>([]);
  const [showSizeForm, setShowSizeForm] = useState(false);
  const [sizeName, setSizeName] = useState("");
  const [editingSize, setEditingSize] = useState<number | null>(null);
  const [sizeSaving, setSizeSaving] = useState(false);
  const [deleteSizeConfirm, setDeleteSizeConfirm] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delivery zones state
  const { data: deliveryZones = [], refetch: refetchDeliveryZones } = useListDeliveryZones();
  const [deliveryFeeInputs, setDeliveryFeeInputs] = useState<Record<string, string>>({});
  const [savingFee, setSavingFee] = useState<string | null>(null);
  const [savedFee, setSavedFee] = useState<string | null>(null);
  const zoneMap = new Map(deliveryZones.map((z) => [z.name, z]));
  const deliveryRows = GOVERNORATES.map((name) => {
    const zone = zoneMap.get(name);
    return { name, id: zone?.id, fee: zone?.fee ?? 0 };
  });

  async function fetchSizes() {
    try {
      const res = await fetch("/api/sizes");
      setAllSizes(await res.json());
    } catch {}
  }

  useEffect(() => { if (authed) fetchSizes(); }, [authed]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setAuthed(true);
      setPinError(false);
      localStorage.setItem("noka_admin", "true");
    } else {
      setPinError(true);
    }
  }

  function invalidateProducts() {
    queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStoreSummaryQueryKey() });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const colors = form.colors
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price) / 50,
      imageUrl: form.imageUrls[0] || undefined,
      images: form.imageUrls.slice(1),
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      sizes: form.sizes,
      colors,
      inStock: form.inStock,
      isFeatured: form.isFeatured,
      isNew: form.isNew,
    };

    if (editingProduct) {
      updateProduct.mutate(
        { id: editingProduct, data: payload },
        {
          onSuccess: () => {
            invalidateProducts();
            setShowForm(false);
            setEditingProduct(null);
            setForm(EMPTY_FORM);
          },
        }
      );
    } else {
      createProduct.mutate(
        { data: payload },
        {
          onSuccess: () => {
            invalidateProducts();
            setShowForm(false);
            setForm(EMPTY_FORM);
          },
        }
      );
    }
  }

  function handleDelete(id: number) {
    deleteProduct.mutate(
      { id },
      {
        onSuccess: () => {
          invalidateProducts();
          setDeleteConfirm(null);
        },
      }
    );
  }

  function toggleStock(id: number, current: boolean) {
    updateProduct.mutate(
      { id, data: { inStock: !current } },
      { onSuccess: invalidateProducts }
    );
  }

  function toggleSize(s: string) {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(s)
        ? prev.sizes.filter((x) => x !== s)
        : [...prev.sizes, s],
    }));
  }

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setForm((p) => ({ ...p, imageUrls: [...p.imageUrls, data.url] }));
    } catch {} finally { setUploading(false); }
  }

  function removeImage(idx: number) {
    setForm((p) => ({ ...p, imageUrls: p.imageUrls.filter((_, i) => i !== idx) }));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  async function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCatSaving(true);
    try {
      const body = { name: catName, slug: catSlug || undefined, imageUrl: catImage || null };
      if (editingCat) {
        await fetch(`/api/categories/${editingCat}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/categories", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      }
      setShowCatForm(false);
      setEditingCat(null);
      setCatName(""); setCatSlug(""); setCatImage("");
      refetchCategories();
    } catch (e) {
      console.error("Category save failed", e);
    } finally {
      setCatSaving(false);
    }
  }

  async function handleDeleteCat(id: number) {
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      setDeleteCatConfirm(null);
      refetchCategories();
    } catch (e) {
      console.error("Category delete failed", e);
    }
  }

  function openCatEdit(cat: typeof categories[number]) {
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatImage(cat.imageUrl ?? "");
    setEditingCat(cat.id);
    setShowCatForm(true);
  }

  async function handleStatusChange(orderId: number, status: string) {
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setChangingStatus(null);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    } catch (e) {
      console.error("Status update failed", e);
    }
  }

  async function syncSheet() {
    try {
      const res = await fetch("/api/orders/sync-sheet", { method: "POST" });
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    } catch (e) {
      console.error("Sheet sync failed", e);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-lg"
        >
          <h1 className="text-3xl font-serif font-bold text-foreground mb-1">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mb-6">NŌKA Store Management</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setPinError(false); }}
                placeholder="Enter admin PIN"
                className={`w-full border rounded-lg px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 ${pinError ? "border-destructive" : "border-border"}`}
              />
              {pinError && <p className="text-xs text-destructive mt-1">Incorrect PIN</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-3 rounded-full font-semibold text-sm tracking-wide"
            >
              Login
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your NŌKA store</p>
          </div>
          <button
            onClick={() => { setAuthed(false); localStorage.removeItem("noka_admin"); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-border px-4 py-2 rounded-full"
          >
            Log out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          {(["products", "categories", "sizes", "delivery", "orders"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "products" ? <Package className="w-4 h-4" /> : t === "categories" ? <Tags className="w-4 h-4" /> : t === "sizes" ? <Ruler className="w-4 h-4" /> : t === "delivery" ? <Truck className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              {t}
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-normal">
                {t === "products" ? products.length : t === "categories" ? categories.length : t === "sizes" ? allSizes.length : t === "delivery" ? deliveryRows.length : orders.length}
              </span>
            </button>
          ))}
        </div>

        {/* Products tab */}
        {tab === "products" && (
          <div>
            <div className="flex justify-end mb-5">
              <button
                onClick={() => { setShowForm(true); setEditingProduct(null); setForm(EMPTY_FORM); }}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
                  onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingProduct(null); } }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-background rounded-2xl border border-border w-full max-w-2xl my-8 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                      <h2 className="text-lg font-semibold font-serif">{editingProduct ? "Edit Product" : "Add New Product"}</h2>
                      <button onClick={() => { setShowForm(false); setEditingProduct(null); }} className="p-1.5 hover:bg-muted rounded-full">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium mb-1.5">Product Name *</label>
                          <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="e.g. Linen Shirt" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium mb-1.5">Description *</label>
                          <textarea required rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Describe the product..." className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1.5">Price (EGP) *</label>
                          <input required type="number" min="0" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                            placeholder="200" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1.5">Category</label>
                          <select value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                            className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                            <option value="">None</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium mb-1.5">Images</label>
                          <div className="space-y-3">
                            {form.imageUrls.length > 0 && (
                              <div className="flex flex-wrap gap-3">
                                {form.imageUrls.map((url, i) => (
                                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                                    <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removeImage(i)}
                                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                                      <X className="w-3 h-3" />
                                    </button>
                                    {i === 0 && <span className="absolute bottom-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Main</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div
                              onDrop={handleDrop}
                              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                              onDragLeave={() => setDragOver(false)}
                              onClick={() => fileInputRef.current?.click()}
                              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                            >
                              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                              {uploading ? (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                  <span className="text-sm text-muted-foreground">Uploading...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <Upload className="w-8 h-8 text-muted-foreground/50" />
                                  <p className="text-sm text-muted-foreground"><span className="text-primary font-medium">Click to browse</span> or drag & drop</p>
                                  <p className="text-xs text-muted-foreground/60">JPG, PNG, WebP up to 10MB</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium mb-2">Sizes</label>
                          <div className="flex flex-wrap gap-2">
                            {allSizes.map((s) => (
                              <button key={s.id} type="button" onClick={() => toggleSize(s.name)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${form.sizes.includes(s.name) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                                {s.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium mb-1.5">Colors (comma-separated)</label>
                          <input value={form.colors} onChange={(e) => setForm((p) => ({ ...p, colors: e.target.value }))}
                            placeholder="بنى, بيبى بلو, ابيض, اسود..." className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>

                        <div className="sm:col-span-2 flex gap-6 flex-wrap">
                          {([
                            { key: "inStock", label: "In Stock" },
                            { key: "isFeatured", label: "Featured" },
                            { key: "isNew", label: "New Arrival" },
                          ] as const).map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                              <input type="checkbox" checked={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                                className="w-4 h-4 accent-primary" />
                              <span className="text-sm">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2 border-t border-border">
                        <button type="button" onClick={() => { setShowForm(false); setEditingProduct(null); }}
                          className="flex-1 border border-border text-muted-foreground py-2.5 rounded-full text-sm font-medium hover:bg-muted transition-colors">
                          Cancel
                        </button>
                        <button type="submit" disabled={createProduct.isPending || updateProduct.isPending}
                          className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-semibold disabled:opacity-50">
                          {createProduct.isPending || updateProduct.isPending ? "Saving..." : editingProduct ? "Save Changes" : "Add Product"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {loadingProducts ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-20 bg-muted rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl"
                  >
                    <div className="w-14 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs font-serif text-muted-foreground/30">N</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.categoryName || "No category"} &bull; {(product.price * 50).toLocaleString("en-EG")} EGP
                      </p>
                      {product.colors.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">{product.colors.length} color{product.colors.length !== 1 ? "s" : ""}</p>
                      )}
                    </div>

                    <button
                      onClick={() => toggleStock(product.id, product.inStock)}
                      className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 transition-colors ${
                        product.inStock ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-700"
                      }`}
                    >
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </button>

                    <button
                      onClick={() => {
                        const imgs = [product.imageUrl, ...(product.images ?? [])].filter(Boolean) as string[];
                        setEditingProduct(product.id);
                        setForm({
                          name: product.name,
                          description: product.description ?? "",
                          price: String(product.price * 50),
                          imageUrls: imgs,
                          categoryId: product.categoryId?.toString() ?? "",
                          sizes: product.sizes,
                          colors: product.colors.join(", "),
                          inStock: product.inStock,
                          isFeatured: product.isFeatured,
                          isNew: product.isNew,
                        });
                        setShowForm(true);
                      }}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors flex-shrink-0 rounded-lg hover:bg-primary/5"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {deleteConfirm === product.id ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => handleDelete(product.id)}
                          className="text-xs px-3 py-1.5 bg-destructive text-destructive-foreground rounded-full font-medium">Confirm</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(product.id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Categories tab */}
        {tab === "categories" && (
          <div>
            <div className="flex justify-end mb-5">
              <button
                onClick={() => { setShowCatForm(true); setEditingCat(null); setCatName(""); setCatSlug(""); setCatImage(""); }}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            <AnimatePresence>
              {showCatForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
                  onClick={(e) => { if (e.target === e.currentTarget) { setShowCatForm(false); setEditingCat(null); } }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-background rounded-2xl border border-border w-full max-w-lg my-8 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                      <h2 className="text-lg font-semibold font-serif">{editingCat ? "Edit Category" : "Add Category"}</h2>
                      <button onClick={() => { setShowCatForm(false); setEditingCat(null); }} className="p-1.5 hover:bg-muted rounded-full">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <form onSubmit={handleCatSubmit} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Name *</label>
                        <input required value={catName} onChange={(e) => setCatName(e.target.value)}
                          placeholder="e.g. T-Shirts" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Slug</label>
                        <input value={catSlug} onChange={(e) => setCatSlug(e.target.value)}
                          placeholder="t-shirts (auto-generated if empty)" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Image URL</label>
                        <input type="url" value={catImage} onChange={(e) => setCatImage(e.target.value)}
                          placeholder="https://..." className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div className="flex gap-3 pt-2 border-t border-border">
                        <button type="button" onClick={() => { setShowCatForm(false); setEditingCat(null); }}
                          className="flex-1 border border-border text-muted-foreground py-2.5 rounded-full text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                        <button type="submit" disabled={catSaving}
                          className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-semibold disabled:opacity-50">
                          {catSaving ? "Saving..." : editingCat ? "Save Changes" : "Add Category"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {categories.length === 0 ? (
              <div className="text-center py-20">
                <Tags className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No categories yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((cat) => (
                  <motion.div
                    key={cat.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tags className="w-5 h-5 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                    </div>
                    <button onClick={() => openCatEdit(cat)}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors flex-shrink-0 rounded-lg hover:bg-primary/5">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {deleteCatConfirm === cat.id ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => handleDeleteCat(cat.id)}
                          className="text-xs px-3 py-1.5 bg-destructive text-destructive-foreground rounded-full font-medium">Confirm</button>
                        <button onClick={() => setDeleteCatConfirm(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteCatConfirm(cat.id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sizes tab */}
        {tab === "sizes" && (
          <div>
            <div className="flex justify-end mb-5">
              <button
                onClick={() => { setShowSizeForm(true); setEditingSize(null); setSizeName(""); }}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
              >
                <Plus className="w-4 h-4" /> Add Size
              </button>
            </div>

            <AnimatePresence>
              {showSizeForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
                  onClick={(e) => { if (e.target === e.currentTarget) { setShowSizeForm(false); setEditingSize(null); } }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-background rounded-2xl border border-border w-full max-w-sm my-8 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                      <h2 className="text-lg font-semibold font-serif">{editingSize ? "Edit Size" : "Add Size"}</h2>
                      <button onClick={() => { setShowSizeForm(false); setEditingSize(null); }} className="p-1.5 hover:bg-muted rounded-full">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <form onSubmit={async (e) => {
                      e.preventDefault(); setSizeSaving(true);
                      try {
                        const body = { name: sizeName };
                        if (editingSize) {
                          await fetch(`/api/sizes/${editingSize}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                        } else {
                          await fetch("/api/sizes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                        }
                        setShowSizeForm(false); setEditingSize(null); setSizeName("");
                        fetchSizes();
                      } catch {} finally { setSizeSaving(false); }
                    }} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Size Name *</label>
                        <input required value={sizeName} onChange={(e) => setSizeName(e.target.value)}
                          placeholder="e.g. XL, مقاس 3" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div className="flex gap-3 pt-2 border-t border-border">
                        <button type="button" onClick={() => { setShowSizeForm(false); setEditingSize(null); }}
                          className="flex-1 border border-border text-muted-foreground py-2.5 rounded-full text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                        <button type="submit" disabled={sizeSaving}
                          className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-semibold disabled:opacity-50">
                          {sizeSaving ? "Saving..." : editingSize ? "Save Changes" : "Add Size"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {allSizes.length === 0 ? (
              <div className="text-center py-20">
                <Ruler className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No sizes yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allSizes.map((s) => (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{s.name}</p>
                    </div>
                    <button onClick={() => { setEditingSize(s.id); setSizeName(s.name); setShowSizeForm(true); }}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors flex-shrink-0 rounded-lg hover:bg-primary/5">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {deleteSizeConfirm === s.id ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={async () => {
                          try { await fetch(`/api/sizes/${s.id}`, { method: "DELETE" }); setDeleteSizeConfirm(null); fetchSizes(); } catch {}
                        }} className="text-xs px-3 py-1.5 bg-destructive text-destructive-foreground rounded-full font-medium">Confirm</button>
                        <button onClick={() => setDeleteSizeConfirm(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteSizeConfirm(s.id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delivery Zones tab */}
        {tab === "delivery" && (
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold font-serif">Delivery Fees by Governorate</h2>
            </div>
            <div className="space-y-2">
              {deliveryRows.map((row) => (
                <div key={row.name} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{row.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="relative">
                      <input
                        type="number" min="0"
                        value={deliveryFeeInputs[row.name] ?? String(row.fee * 50)}
                        onChange={(e) => setDeliveryFeeInputs((p) => ({ ...p, [row.name]: e.target.value }))}
                        className="w-24 border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">EGP</span>
                    </div>
                    <button
                      disabled={savingFee === row.name}
                      onClick={async () => {
                        setSavingFee(row.name);
                        const fee = Number(deliveryFeeInputs[row.name] ?? row.fee * 50) / 50;
                        try {
                          if (row.id) {
                            await fetch(`/api/delivery-zones/${row.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fee }) });
                          } else {
                            const res = await fetch("/api/delivery-zones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: row.name, fee }) });
                            row.id = (await res.json()).id;
                          }
                          setDeliveryFeeInputs((p) => { const n = { ...p }; delete n[row.name]; return n; });
                          setSavedFee(row.name);
                          setTimeout(() => setSavedFee(null), 2000);
                          refetchDeliveryZones();
                        } catch {} finally { setSavingFee(null); }
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold disabled:opacity-50 transition-colors"
                      style={{ backgroundColor: savedFee === row.name ? "#22c55e" : undefined, color: savedFee === row.name ? "#fff" : undefined }}
                    >
                      {savingFee === row.name ? "Saving..." : savedFee === row.name ? "Saved!" : "Save"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders tab */}
        {tab === "orders" && (
          <div>
            <div className="flex justify-end mb-5">
              <button onClick={syncSheet}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-shadow">
                <Upload className="w-4 h-4" /> Sync from Sheet
              </button>
            </div>
            {loadingOrders ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-20 bg-muted rounded-xl" />)}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    className="bg-card border border-border rounded-xl overflow-hidden"
                  >
                    <button
                      className="w-full flex items-center gap-4 p-4 text-left"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-foreground text-sm">Order #{order.id}</p>
                          {changingStatus === order.id ? (
                            <select
                              value={order.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="text-xs border border-border rounded-full px-2 py-0.5 bg-background"
                              autoFocus
                              onBlur={() => setChangingStatus(null)}
                            >
                              {ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setChangingStatus(order.id); }}
                              className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize transition-colors hover:opacity-80 ${STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"}`}
                            >
                              {order.status}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {order.customerName} &bull; {order.customerPhone} &bull; {order.governorate}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary text-sm">{(order.total * 50).toLocaleString("en-EG")} EGP</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-EG")}</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${expandedOrder === order.id ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {expandedOrder === order.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                            <div className="text-sm text-muted-foreground">
                              <p><span className="font-medium text-foreground">Address:</span> {order.address}, {order.city}, {order.governorate}</p>
                              <p><span className="font-medium text-foreground">Email:</span> {order.customerEmail}</p>
                            </div>
                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span className="text-foreground">{item.productName} {item.size ? `(${item.size})` : ""} &times; {item.quantity}</span>
                                  <span className="font-medium">{(item.price * item.quantity * 50).toLocaleString("en-EG")} EGP</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
