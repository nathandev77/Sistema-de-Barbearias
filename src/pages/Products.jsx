import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Plus, Trash2, Pencil, ShoppingBag, AlertTriangle, ArrowDownUp } from "lucide-react";

import {
  DataTable, EmptyRow, FormField, IconBtn, KV, PageHeader, PageShell, Pill, Row,
  SearchInput, SectionCard, SectionHeader, StatCard, Td, Th,
} from "@/components/shell/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatBRL, formatSmart, normalizeText } from "@/lib/formatters";
import { Product } from "@/api/base44Client";

const EMPTY = {
  name: "", category: "levar", cost: 0, price: 0, stock: 0, stockMin: 5, commission_pct: 10, is_active: true,
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [moves, setMoves] = useState([]); // Placeholder for stock movements if supported
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await Product.list();
      setProducts(data.sort((a, b) => (a.name || "").localeCompare(b.name || "")));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = normalizeText(search).trim();
    return products.filter((p) => {
      if (categoryFilter !== "todos" && p.category !== categoryFilter) return false;
      if (!q) return true;
      return normalizeText(p.name).includes(q);
    });
  }, [products, search, categoryFilter]);

  const baixoEstoque = products.filter((p) => p.stock <= (p.stockMin || 5)).length;
  const valorEstoque = products.reduce((s, p) => s + (p.stock || 0) * (p.cost || 0), 0);

  return (
    <PageShell>
      <PageHeader title="Products" subtitle="Every sale updates stock, product revenue, commission and the General Overview." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-8 pb-6">
        <StatCard label="Products" value={products.length} icon={ShoppingBag} tone="sky" />
        <StatCard label="Take-home" value={products.filter((p) => p.category === "levar").length} icon={ShoppingBag} tone="violet" />
        <StatCard label="Low stock" value={baixoEstoque} icon={AlertTriangle} tone="rose" />
        <StatCard label="Stock value" value={formatBRL(valorEstoque)} icon={ShoppingBag} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-8 pb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <SearchInput value={search} onChange={setSearch} placeholder="Search product" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-10 w-[190px] rounded-full bg-card/70 border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">All categories</SelectItem>
              <SelectItem value="levar">Take-home</SelectItem>
              <SelectItem value="consumo">On-site consumption</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="rounded-full h-10 px-5 gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New product
        </Button>
      </div>

      <div className="px-8 pb-16 space-y-4">
        <SectionCard>
          <SectionHeader title="Products" count={rows.length} />
          <DataTable
            widths={["20%", "14%", "12%", "12%", "14%", "12%", "16%"]}
            head={<><Th>Product</Th><Th>Category</Th><Th>Cost</Th><Th>Price</Th><Th>Stock</Th><Th>Commission</Th><Th className="text-right">Actions</Th></>}
          >
            {loading ? (
                <EmptyRow colSpan={7} title="Loading products..." />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={7} title="No products found." hint="Add a product or adjust the filters." />
            ) : rows.map((p) => (
              <Row key={p.id}>
                <Td className="font-semibold truncate">{p.name}</Td>
                <Td className="text-muted-foreground">{p.category === "levar" ? "Take-home" : "On-site consumption"}</Td>
                <Td className="tabular-nums">{formatBRL(p.cost)}</Td>
                <Td className="tabular-nums">{formatBRL(p.price)}</Td>
                <Td>
                  <span className="inline-flex items-center gap-2">
                    <span className="tabular-nums">{p.stock || 0}</span>
                    {(p.stock || 0) <= (p.stockMin || 5) && <Pill tone="rose">Low</Pill>}
                  </span>
                </Td>
                <Td className="tabular-nums">{p.commission_pct || 0}%</Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <IconBtn label="Adjust stock" onClick={() => setStockProduct(p)}><ArrowDownUp className="h-4 w-4" /></IconBtn>
                    <IconBtn label="Edit" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></IconBtn>
                    <IconBtn label="Delete" danger onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4" /></IconBtn>
                  </div>
                </Td>
              </Row>
            ))}
          </DataTable>
        </SectionCard>
      </div>

      <ProductForm open={open} onOpenChange={setOpen} product={editing} onSave={load} />
      
      <StockDialog product={stockProduct} onOpenChange={(o) => !o && setStockProduct(null)} onSave={load} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (deleteId) {
                await Product.delete(deleteId);
                await load();
              }
              setDeleteId(null);
            }} className="bg-destructive text-white hover:bg-destructive/90">
              <Trash2 className="h-4 w-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function ProductForm({ open, onOpenChange, product, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [sig, setSig] = useState("");
  const signature = `${open}-${product?.id ?? "novo"}`;
  if (sig !== signature) { 
    setSig(signature); 
    setForm(product ? { 
        name: product.name,
        category: product.category,
        cost: product.cost || 0,
        price: product.price || 0,
        stock: product.stock || 0,
        stockMin: product.stockMin || 5,
        commission_pct: product.commission_pct || 10,
        is_active: product.is_active !== false
    } : EMPTY); 
  }
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.name.trim()) return;
    try {
        const payload = {
            ...form,
            cost: Number(form.cost),
            price: Number(form.price),
            stock: Number(form.stock),
            commission_pct: Number(form.commission_pct)
        };
        if (product) await Product.update(product.id, payload);
        else await Product.create(payload);
        onOpenChange(false);
        onSave();
    } catch(err) {
        alert("Error saving product: " + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">{product ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Products generate Product Revenue when sold.</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
          <FormField label="Name" required>
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Category">
            <Select value={form.category} onValueChange={(v) => set({ category: v })}>
              <SelectTrigger className="h-10 bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="levar">Take-home</SelectItem>
                <SelectItem value="consumo">On-site consumption</SelectItem>
                <SelectItem value="cabelo">Hair</SelectItem>
                <SelectItem value="barba">Beard</SelectItem>
                <SelectItem value="acessorio">Accessory</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Cost (R$)">
            <Input type="number" value={form.cost} onChange={(e) => set({ cost: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Price (R$)">
            <Input type="number" value={form.price} onChange={(e) => set({ price: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Stock">
            <Input type="number" value={form.stock} onChange={(e) => set({ stock: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Minimum stock">
            <Input type="number" value={form.stockMin} onChange={(e) => set({ stockMin: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Commission (%)">
            <Input type="number" value={form.commission_pct} onChange={(e) => set({ commission_pct: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Status">
            <Select value={form.is_active ? "Ativo" : "Inativo"} onValueChange={(v) => set({ is_active: v === "Ativo" })}>
              <SelectTrigger className="h-10 bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Active</SelectItem>
                <SelectItem value="Inativo">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/60 bg-card/60">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Back</Button>
          <Button onClick={save} className="bg-primary hover:bg-primary/90">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StockDialog({ product, onOpenChange, onSave }) {
  const [movementType, setMovementType] = useState("in");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");

  const handleSave = async () => {
    if (!product) return;
    const qtyNum = Number(quantity);
    if (qtyNum <= 0) return;
    
    let newStock = product.stock || 0;
    if (movementType === "in") newStock += qtyNum;
    else if (movementType === "out") newStock -= qtyNum;
    else newStock = qtyNum; // Adjustment
    
    try {
        await Product.update(product.id, { stock: Math.max(0, newStock) });
        onOpenChange(false);
        onSave();
    } catch(err) {
        alert("Error adjusting stock: " + err.message);
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">Adjust stock</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {product?.name} — current stock: {product?.stock || 0}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          <FormField label="Movement type">
            <Select value={movementType} onValueChange={setMovementType}>
              <SelectTrigger className="h-10 bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Stock in (adds)</SelectItem>
                <SelectItem value="out">Stock out (removes)</SelectItem>
                <SelectItem value="adjust">Adjustment (sets total)</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Quantity" required>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Reason (Optional)">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 bg-background border-border" placeholder="e.g. Supplier purchase, loss..." />
          </FormField>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/60 bg-card/60">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Back</Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
