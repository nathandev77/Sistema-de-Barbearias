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
  const [moves, setMoves] = useState([]); // Placeholder para movimentos de estoque se suportado
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("todos");
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
      if (tipo !== "todos" && p.category !== tipo) return false;
      if (!q) return true;
      return normalizeText(p.name).includes(q);
    });
  }, [products, search, tipo]);

  const baixoEstoque = products.filter((p) => p.stock <= (p.stockMin || 5)).length;
  const valorEstoque = products.reduce((s, p) => s + (p.stock || 0) * (p.cost || 0), 0);

  return (
    <PageShell>
      <PageHeader title="Produtos" subtitle="Toda venda atualiza estoque, receita de produto, comissão e Controle Geral." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-8 pb-6">
        <StatCard label="Produtos" value={products.length} icon={ShoppingBag} tone="sky" />
        <StatCard label="Para levar" value={products.filter((p) => p.category === "levar").length} icon={ShoppingBag} tone="violet" />
        <StatCard label="Estoque baixo" value={baixoEstoque} icon={AlertTriangle} tone="rose" />
        <StatCard label="Valor em estoque" value={formatBRL(valorEstoque)} icon={ShoppingBag} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-8 pb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar produto" />
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="h-10 w-[190px] rounded-full bg-card/70 border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as categorias</SelectItem>
              <SelectItem value="levar">Para levar</SelectItem>
              <SelectItem value="consumo">Consumo no local</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="rounded-full h-10 px-5 gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      <div className="px-8 pb-16 space-y-4">
        <SectionCard>
          <SectionHeader title="Produtos" count={rows.length} />
          <DataTable
            widths={["20%", "14%", "12%", "12%", "14%", "12%", "16%"]}
            head={<><Th>Produto</Th><Th>Categoria</Th><Th>Custo</Th><Th>Preço</Th><Th>Estoque</Th><Th>Comissão</Th><Th className="text-right">Ações</Th></>}
          >
            {loading ? (
                <EmptyRow colSpan={7} title="Carregando produtos..." />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={7} title="Nenhum produto encontrado." hint="Cadastre um produto ou ajuste os filtros." />
            ) : rows.map((p) => (
              <Row key={p.id}>
                <Td className="font-semibold truncate">{p.name}</Td>
                <Td className="text-muted-foreground">{p.category === "levar" ? "Para levar" : "Consumo no local"}</Td>
                <Td className="tabular-nums">{formatBRL(p.cost)}</Td>
                <Td className="tabular-nums">{formatBRL(p.price)}</Td>
                <Td>
                  <span className="inline-flex items-center gap-2">
                    <span className="tabular-nums">{p.stock || 0}</span>
                    {(p.stock || 0) <= (p.stockMin || 5) && <Pill tone="rose">Baixo</Pill>}
                  </span>
                </Td>
                <Td className="tabular-nums">{p.commission_pct || 0}%</Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <IconBtn label="Movimentar estoque" onClick={() => setStockProduct(p)}><ArrowDownUp className="h-4 w-4" /></IconBtn>
                    <IconBtn label="Editar" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></IconBtn>
                    <IconBtn label="Excluir" danger onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4" /></IconBtn>
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
            <AlertDialogTitle>Excluir este produto?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não poderá ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (deleteId) {
                await Product.delete(deleteId);
                await load();
              }
              setDeleteId(null);
            }} className="bg-destructive text-white hover:bg-destructive/90">
              <Trash2 className="h-4 w-4" /> Excluir
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
        alert("Erro ao salvar produto: " + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">{product ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Produtos geram Receita de Produto ao serem vendidos.</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
          <FormField label="Nome" required>
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Categoria">
            <Select value={form.category} onValueChange={(v) => set({ category: v })}>
              <SelectTrigger className="h-10 bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="levar">Para levar</SelectItem>
                <SelectItem value="consumo">Consumo no local</SelectItem>
                <SelectItem value="cabelo">Cabelo</SelectItem>
                <SelectItem value="barba">Barba</SelectItem>
                <SelectItem value="acessorio">Acessório</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Custo (R$)">
            <Input type="number" value={form.cost} onChange={(e) => set({ cost: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Preço (R$)">
            <Input type="number" value={form.price} onChange={(e) => set({ price: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Estoque">
            <Input type="number" value={form.stock} onChange={(e) => set({ stock: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Estoque mínimo">
            <Input type="number" value={form.stockMin} onChange={(e) => set({ stockMin: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Comissão (%)">
            <Input type="number" value={form.commission_pct} onChange={(e) => set({ commission_pct: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Status">
            <Select value={form.is_active ? "Ativo" : "Inativo"} onValueChange={(v) => set({ is_active: v === "Ativo" })}>
              <SelectTrigger className="h-10 bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/60 bg-card/60">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Voltar</Button>
          <Button onClick={save} className="bg-primary hover:bg-primary/90">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StockDialog({ product, onOpenChange, onSave }) {
  const [tipo, setTipo] = useState("Entrada");
  const [qtd, setQtd] = useState("1");
  const [motivo, setMotivo] = useState("");

  const handleSave = async () => {
    if (!product) return;
    const qtyNum = Number(qtd);
    if (qtyNum <= 0) return;
    
    let newStock = product.stock || 0;
    if (tipo === "Entrada") newStock += qtyNum;
    else if (tipo === "Saída") newStock -= qtyNum;
    else newStock = qtyNum; // Ajuste
    
    try {
        await Product.update(product.id, { stock: Math.max(0, newStock) });
        onOpenChange(false);
        onSave();
    } catch(err) {
        alert("Erro ao ajustar estoque: " + err.message);
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">Movimentar estoque</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {product?.name} — estoque atual: {product?.stock || 0}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          <FormField label="Tipo de movimento">
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="h-10 bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Entrada">Entrada (adiciona)</SelectItem>
                <SelectItem value="Saída">Saída (remove)</SelectItem>
                <SelectItem value="Ajuste">Ajuste (define total)</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Quantidade" required>
            <Input type="number" value={qtd} onChange={(e) => setQtd(e.target.value)} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Motivo (Opcional)">
            <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} className="h-10 bg-background border-border" placeholder="Ex: Compra de fornecedor, perda..." />
          </FormField>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/60 bg-card/60">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Voltar</Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">Confirmar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
