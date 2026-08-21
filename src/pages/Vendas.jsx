import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Plus, Trash2, ShoppingCart, DollarSign, Package } from "lucide-react";

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

import { Product, Sale, Barber } from "@/api/base44Client";

const EMPTY_SALE = { productId: "", barberId: "", quantity: 1 };

export default function VendasPage() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
        const [prods, sls, brbs] = await Promise.all([Product.list(), Sale.list(), Barber.list()]);
        setProducts(prods.filter(p => p.name !== 'Assinatura de Plano').sort((a, b) => a.name?.localeCompare(b.name)));
        setSales(sls.sort((a, b) => (b.date || "").localeCompare(a.date || "")));
        setBarbers(brbs.filter(b => b.is_active !== false));
    } catch(err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const q = normalizeText(search).trim();
    return sales
      .filter((s) => {
        if (!q) return true;
        return normalizeText(s.productName || "").includes(q) || normalizeText(s.barberName || "").includes(q);
      });
  }, [sales, search]);

  const total = rows.reduce((s, v) => s + (v.total || 0), 0);
  const itens = rows.reduce((s, v) => s + (v.quantity || 1), 0);
  // Aproximação de comissão: se houver product e ele tiver commission_pct
  const comissaoTotal = rows.reduce((s, v) => {
      const p = products.find(prod => prod.id === v.product_id);
      if(p && p.commission_pct) {
          return s + (v.total * (p.commission_pct / 100));
      }
      return s;
  }, 0);

  return (
    <PageShell>
      <PageHeader title="Histórico de Vendas" subtitle="Vendas realizadas na Loja ou via Agendamento." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-8 pb-6">
        <StatCard label="Vendas" value={rows.length} icon={ShoppingCart} tone="sky" />
        <StatCard label="Itens vendidos" value={itens} icon={Package} tone="violet" />
        <StatCard label="Receita Bruta" value={formatBRL(total)} icon={DollarSign} tone="emerald" />
        <StatCard label="Comissões (Est.)" value={formatBRL(comissaoTotal)} icon={DollarSign} tone="amber" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-8 pb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar por produto ou vendedor" />
        </div>
        <Button onClick={() => setOpen(true)} className="rounded-full h-10 px-5 gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Nova venda avulsa
        </Button>
      </div>

      <div className="px-8 pb-16">
        <SectionCard>
          <SectionHeader title="Vendas registradas" count={rows.length} />
          <DataTable
            widths={["16%", "20%", "20%", "12%", "16%", "16%"]}
            head={<><Th>Data</Th><Th>Produto</Th><Th>Vendedor</Th><Th>Qtd</Th><Th>Total</Th><Th className="text-right">Ações</Th></>}
          >
            {loading ? (
                <EmptyRow colSpan={6} title="Carregando vendas..." />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={6} title="Nenhuma venda registrada." />
            ) : rows.map((s) => (
              <Row key={s.id}>
                <Td className="text-muted-foreground tabular-nums truncate">{s.date ? new Date(s.date).toLocaleDateString('pt-BR') : "N/A"}</Td>
                <Td className="font-medium truncate">{s.productName}</Td>
                <Td className="truncate">{s.barberName || <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Sem Vendedor</span>}</Td>
                <Td className="tabular-nums">{s.quantity}</Td>
                <Td className="tabular-nums font-bold text-emerald-400">{formatBRL(s.total)}</Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <IconBtn label="Excluir" danger onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4" /></IconBtn>
                  </div>
                </Td>
              </Row>
            ))}
          </DataTable>
        </SectionCard>
      </div>

      <VendaForm 
        open={open} 
        onOpenChange={setOpen} 
        products={products}
        barbers={barbers}
        onSave={load} 
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Estornar venda?</AlertDialogTitle>
            <AlertDialogDescription>A venda será cancelada. O estoque NÃO será retornado automaticamente nesta versão.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (deleteId) {
                await Sale.delete(deleteId);
                await load();
              }
              setDeleteId(null);
            }} className="bg-destructive text-white hover:bg-destructive/90">
              <Trash2 className="h-4 w-4" /> Estornar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function VendaForm({ open, onOpenChange, products, barbers, onSave }) {
  const [form, setForm] = useState(EMPTY_SALE);
  const [sig, setSig] = useState("");
  
  const signature = `${open}`;
  if (sig !== signature) { setSig(signature); setForm(EMPTY_SALE); }

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.productId) return;
    try {
        const prod = products.find(p => p.id === form.productId);
        if(!prod) return;
        const qty = Number(form.quantity);
        
        await Sale.create({
            productId: form.productId,
            barberId: form.barberId || null,
            quantity: qty,
            unitPrice: prod.price,
            date: new Date().toISOString().slice(0, 10)
        });

        if (prod.stock !== undefined) {
            await Product.update(prod.id, { stock: Math.max(0, (prod.stock || 0) - qty) });
        }
        onOpenChange(false);
        onSave();
    } catch(err) {
        alert("Erro ao salvar: " + err.message);
    }
  };

  const selectedProd = products.find(p => p.id === form.productId);
  const total = (selectedProd?.price || 0) * (form.quantity || 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">Nova Venda Avulsa</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Registre uma venda manual de produtos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save}>
          <div className="px-6 py-5 space-y-4">
            
            <FormField label="Produto" required>
              <Select value={form.productId} onValueChange={(v) => set({ productId: v })}>
                <SelectTrigger className="h-10 bg-background border-border"><SelectValue placeholder="Selecione um produto..." /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} — {formatBRL(p.price)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Quantidade" required>
                <Input type="number" min="1" value={form.quantity} onChange={(e) => set({ quantity: Number(e.target.value) })} className="h-10 bg-background border-border" />
              </FormField>
              
              <FormField label="Vendedor (Comissão)">
                <Select value={form.barberId} onValueChange={(v) => set({ barberId: v })}>
                  <SelectTrigger className="h-10 bg-background border-border"><SelectValue placeholder="Sem vendedor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem vendedor</SelectItem>
                    {barbers.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {selectedProd && (
              <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">Total da venda</p>
                    <p className="text-2xl font-bold text-primary">{formatBRL(total)}</p>
                </div>
              </div>
            )}
            
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/60 bg-card/60">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Voltar</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={!form.productId}>Confirmar Venda</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
