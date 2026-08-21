import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Plus, Trash2, Pencil, Star, Users, DollarSign, CheckCircle2 } from "lucide-react";
import { fetchApi } from "@/api/base44Client";

import {
  DataTable, EmptyRow, FormField, IconBtn, KV, PageHeader, PageShell, Pill, Row,
  SearchInput, SectionCard, SectionHeader, StatCard, Td, Th,
} from "@/components/shell/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatBRL, normalizeText } from "@/lib/formatters";

const EMPTY = {
  name: "", description: "", price: "", serviceCount: ""
};

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansData, subsData] = await Promise.all([
        fetchApi("/plans"),
        fetchApi("/plans/subscriptions"),
      ]);
      setPlans(plansData);
      setSubscriptions(subsData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const intervalId = setInterval(loadData, 15000);
    return () => clearInterval(intervalId);
  }, [loadData]);

  const rows = useMemo(() => {
    const q = normalizeText(search).trim();
    return plans.filter((p) => (!q ? true : normalizeText(p.name).includes(q)));
  }, [plans, search]);

  const activeSubs = subscriptions.filter(s => s.status === "active").length;
  // Receita aproximada, apenas usando o valor do plano pros ativos
  const receitaTotal = subscriptions.reduce((acc, sub) => {
      if(sub.status === "active" && sub.plan) {
          return acc + Number(sub.plan.price);
      }
      return acc;
  }, 0);

  const handleDeleteSub = async (id) => {
    if (!window.confirm("Deseja realmente excluir ou recusar esta assinatura?")) return;
    try {
        await fetchApi(`/plans/subscriptions/${id}`, { method: 'DELETE' });
        loadData();
    } catch (error) {
        alert('Erro ao excluir: ' + error.message);
    }
  };

  const handleConfirmPayment = async (id) => {
      if (!window.confirm("Confirmar que o cliente pagou e ativar a assinatura?")) return;
      try {
          await fetchApi(`/plans/subscriptions/${id}/status`, {
              method: 'PUT',
              body: JSON.stringify({ status: 'active' })
          });
          loadData();
      } catch (error) {
          alert('Erro ao confirmar: ' + error.message);
      }
  };

  return (
    <PageShell>
      <PageHeader title="Planos" subtitle="Crie pacotes mensais, fidelize clientes e garanta receita recorrente." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-8 pb-6">
        <StatCard label="Planos criados" value={plans.length} icon={Star} tone="amber" />
        <StatCard label="Assinaturas ativas" value={activeSubs} icon={Users} tone="sky" />
        <StatCard label="Receita Recorrente" value={formatBRL(receitaTotal)} icon={DollarSign} tone="emerald" />
        <StatCard label="Total assinantes" value={subscriptions.length} icon={Star} tone="violet" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-8 pb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar plano" />
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="rounded-full h-10 px-5 gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Novo plano
        </Button>
      </div>

      <div className="px-8 pb-16 space-y-4">
        <SectionCard>
          <SectionHeader title="Planos cadastrados" count={rows.length} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {loading ? (
                <p className="text-muted-foreground text-sm">Carregando planos...</p>
            ) : rows.length === 0 ? (
                <EmptyRow colSpan={1} title="Nenhum plano cadastrado." hint="Crie um plano VIP para garantir receita mensal." />
            ) : rows.map((plan) => (
                <div key={plan.id} className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm relative group hover:border-primary/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                            <Star className="w-3.5 h-3.5" /> Mensal
                        </span>
                    </div>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-foreground pr-24 truncate">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1 min-h-[40px] line-clamp-2">{plan.description || 'Sem descrição'}</p>
                        
                        <div className="my-6">
                            <span className="text-3xl font-extrabold text-foreground">
                                {formatBRL(plan.price)}
                            </span>
                            <span className="text-sm text-muted-foreground font-medium"> /mês</span>
                        </div>

                        <ul className="space-y-3 mb-8">
                            <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                <span className="text-foreground font-medium">{plan.serviceCount} serviços</span> por mês
                            </li>
                            <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                Abate o valor no agendamento
                            </li>
                        </ul>

                        <button onClick={() => setDeleteId(plan)} className="w-full py-2.5 rounded-xl border border-destructive/20 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors">
                            Excluir Plano
                        </button>
                    </div>
                </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Assinantes e Adesões" count={subscriptions.length} />
          <DataTable
            widths={["18%", "16%", "14%", "14%", "14%", "10%", "14%"]}
            head={<><Th>Cliente</Th><Th>Plano</Th><Th>Status</Th><Th>Início</Th><Th>Vencimento</Th><Th>Restantes</Th><Th className="text-right">Ações</Th></>}
          >
            {subscriptions.length === 0 ? (
              <EmptyRow colSpan={7} title="Nenhuma assinatura ativa." />
            ) : subscriptions.map((sub) => {
              const isExpired = new Date(sub.endDate) < new Date();
              const isPendente = sub.status === 'pendente';
              const isAtivo = sub.status === 'active' && !isExpired;
              
              let tone = "slate";
              let label = "Cancelado";
              
              if (isPendente) { tone = "amber"; label = "Pendente"; }
              else if (isAtivo) { tone = "emerald"; label = "Pago / Ativo"; }
              else if (isExpired) { tone = "rose"; label = "Vencido"; }

              return (
                <Row key={sub.id}>
                  <Td className="font-medium text-foreground truncate">{sub.client?.name || "Cliente"}</Td>
                  <Td className="truncate">{sub.plan?.name || "Removido"}</Td>
                  <Td><Pill tone={tone}>{label}</Pill></Td>
                  <Td className="tabular-nums">{new Date(sub.startDate).toLocaleDateString('pt-BR')}</Td>
                  <Td className="tabular-nums">{new Date(sub.endDate).toLocaleDateString('pt-BR')}</Td>
                  <Td className="tabular-nums font-bold">
                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-md bg-primary/10 text-primary text-sm">
                      {sub.creditsLeft !== undefined ? sub.creditsLeft : '-'}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      {isPendente && (
                        <IconBtn label="Confirmar Pagamento" onClick={() => handleConfirmPayment(sub.id)}><CheckCircle2 className="h-4 w-4 text-emerald-500" /></IconBtn>
                      )}
                      {!isPendente && (
                        <IconBtn label="Excluir" danger onClick={() => handleDeleteSub(sub.id)}><Trash2 className="h-4 w-4" /></IconBtn>
                      )}
                      {isPendente && (
                        <IconBtn label="Recusar" danger onClick={() => handleDeleteSub(sub.id)}><Trash2 className="h-4 w-4" /></IconBtn>
                      )}
                    </div>
                  </Td>
                </Row>
              );
            })}
          </DataTable>
        </SectionCard>
      </div>

      <PlanForm open={open} onOpenChange={setOpen} onSave={loadData} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {deleteId?.name}?</AlertDialogTitle>
            <AlertDialogDescription>As assinaturas ativas serão mantidas, mas o plano não poderá mais ser vendido.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (deleteId) {
                  try {
                    await fetchApi(`/plans/${deleteId.id}`, { method: 'DELETE' });
                    await loadData();
                  } catch (e) {
                    alert('Erro ao excluir: ' + e.message);
                  }
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

function PlanForm({ open, onOpenChange, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [sig, setSig] = useState("");
  const signature = `${open}`;
  
  if (sig !== signature) { 
      setSig(signature); 
      setForm(EMPTY); 
  }

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    try {
        await fetchApi('/plans', {
            method: 'POST',
            body: JSON.stringify(form)
        });
        onOpenChange(false);
        onSave();
    } catch(err) {
        alert("Erro ao salvar plano: " + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">Novo plano</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Planos fidelizam o cliente com cobrança mensal.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save}>
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
            <div className="sm:col-span-2">
                <FormField label="Nome do plano" required>
                <Input value={form.name} onChange={(e) => set({ name: e.target.value })} className="h-10 bg-background border-border" placeholder="Ex: Plano VIP Mensal" required />
                </FormField>
            </div>
            
            <FormField label="Preço mensal (R$)" required>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => set({ price: e.target.value })} className="h-10 bg-background border-border" required />
            </FormField>
            
            <FormField label="Créditos de serviços mensais" required>
              <Input type="number" min="1" value={form.serviceCount} onChange={(e) => set({ serviceCount: e.target.value })} className="h-10 bg-background border-border" required />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Descrição (Opcional)">
                <Textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={2} className="bg-background border-border resize-none" placeholder="Benefícios e regras..." />
              </FormField>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/60 bg-card/60">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Voltar</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
