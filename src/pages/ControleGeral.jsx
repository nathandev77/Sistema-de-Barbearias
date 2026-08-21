import React, { useMemo, useState, useCallback, useEffect } from "react";
import { DollarSign, TrendingUp, Wallet, Receipt, Star, ShoppingBag, Plus, Trash2 } from "lucide-react";

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
import { formatBRL, normalizeText } from "@/lib/formatters";

import { Appointment, Sale, Barber, Expense, fetchApi } from "@/api/base44Client";

const PERIODOS = ["hoje", "semana", "mes", "mes-anterior", "3meses", "ano"];
const PERIODO_LABELS = {
  "hoje": "Hoje",
  "semana": "Última Semana",
  "mes": "Mês Atual",
  "mes-anterior": "Mês Anterior",
  "3meses": "Últimos 3 Meses",
  "ano": "Este Ano"
};

function periodoRange(p) {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    
    if (p === "hoje") {
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
    } else if (p === "semana") {
        start.setDate(now.getDate() - 7);
        start.setHours(0,0,0,0);
    } else if (p === "mes") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (p === "mes-anterior") {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setHours(23,59,59,999);
    } else if (p === "3meses") {
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    } else if (p === "ano") {
        start = new Date(now.getFullYear(), 0, 1);
    }
    
    return { start, end };
}

export default function ControlePage() {
  const [appointments, setAppointments] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [planSales, setPlanSales] = useState([]); // from /plans/subscriptions
  
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("mes");
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
        const [appts, sls, exps, pSales] = await Promise.all([
            Appointment.list(), 
            Sale.list(),
            Expense.list(),
            fetchApi("/plans/subscriptions")
        ]);
        setAppointments(appts);
        setSales(sls);
        setExpenses(exps.sort((a, b) => (b.date || "").localeCompare(a.date || "")));
        setPlanSales(pSales);
    } catch(err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { start, end } = periodoRange(periodo);

  const fin = useMemo(() => {
      let receitaServicos = 0;
      let receitaProdutos = 0;
      let receitaPlanos = 0;
      let totalDespesas = 0;
      let totalBarbeiros = 0; // Aproximação de comissão: 40% servicos

      appointments.forEach(a => {
          if(a.status !== "concluido") return;
          const d = new Date(a.date);
          if (d >= start && d <= end) {
              receitaServicos += Number(a.price) || 0;
              totalBarbeiros += (Number(a.price) || 0) * 0.40;
          }
      });

      sales.forEach(s => {
          const d = new Date(s.date);
          if (d >= start && d <= end) {
              receitaProdutos += Number(s.total) || 0;
              // Produto pode ter comissão, mas como não temos na Venda o %, vamos fixar 10% se houver vendedor
              if(s.barberName) {
                  totalBarbeiros += (Number(s.total) || 0) * 0.10;
              }
          }
      });

      planSales.forEach(s => {
          if (s.status === "active" && s.startDate) {
              const d = new Date(s.startDate);
              if (d >= start && d <= end) {
                  receitaPlanos += s.plan ? Number(s.plan.price) : 0;
              }
          }
      });

      expenses.forEach(e => {
          const d = new Date(e.date);
          if (d >= start && d <= end) {
              totalDespesas += Number(e.amount) || 0;
          }
      });

      const receitaTotal = receitaServicos + receitaProdutos + receitaPlanos;
      const lucro = receitaTotal - totalDespesas - totalBarbeiros;

      return {
          receitaServicos,
          receitaProdutos,
          receitaPlanos,
          receitaTotal,
          despesas: totalDespesas,
          totalBarbeiros,
          lucro
      };
  }, [periodo, start, end, appointments, sales, planSales, expenses]);

  const despesasPeriodo = useMemo(() => {
    return expenses.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
    });
  }, [expenses, start, end]);

  const composicao = [
    { label: "Serviços", valor: fin.receitaServicos, tone: "sky" },
    { label: "Produtos", valor: fin.receitaProdutos, tone: "violet" },
    { label: "Planos", valor: fin.receitaPlanos, tone: "amber" },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Controle Geral"
        subtitle="Lucro Líquido = Receitas Totais − Despesas − Total a pagar aos barbeiros."
        actions={
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="h-10 w-[180px] rounded-full bg-card/70 border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODOS.map((p) => <SelectItem key={p} value={p}>{PERIODO_LABELS[p]}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 px-8 pb-6">
        <StatCard label="Receita de serviços" value={formatBRL(fin.receitaServicos)} icon={DollarSign} tone="sky" />
        <StatCard label="Receita de produtos" value={formatBRL(fin.receitaProdutos)} icon={ShoppingBag} tone="violet" />
        <StatCard label="Receita de planos" value={formatBRL(fin.receitaPlanos)} icon={Star} tone="amber" />
        <StatCard label="Despesas" value={formatBRL(fin.despesas)} icon={Receipt} tone="rose" />
        <StatCard label="Total aos barbeiros" value={formatBRL(fin.totalBarbeiros)} icon={Wallet} tone="slate" />
        <StatCard label="Lucro líquido" value={formatBRL(fin.lucro)} icon={TrendingUp} tone={fin.lucro >= 0 ? "emerald" : "rose"} />
      </div>

      <div className="px-8 pb-16 space-y-4">
        <SectionCard>
          <SectionHeader title="Composição da receita" right={<span className="text-sm text-muted-foreground font-medium">Total {formatBRL(fin.receitaTotal)}</span>} />
          <div className="px-5 py-4 space-y-3">
            {composicao.map((c) => {
              const pct = fin.receitaTotal > 0 ? (c.valor / fin.receitaTotal) * 100 : 0;
              let bg = "bg-sky-500";
              if (c.tone === "violet") bg = "bg-violet-500";
              else if (c.tone === "amber") bg = "bg-amber-500";

              return (
                <div key={c.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className="font-medium text-foreground">{formatBRL(c.valor)} <span className="text-muted-foreground ml-1">({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full ${bg} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between p-5 border-b border-border/60">
            <h3 className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
              Despesas registradas no período
              <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-bold">{despesasPeriodo.length}</span>
            </h3>
            <Button onClick={() => setOpen(true)} className="rounded-full h-8 px-4 gap-2 text-xs bg-primary hover:bg-primary/90">
              <Plus className="h-3 w-3" /> Lançar despesa
            </Button>
          </div>
          <DataTable
            widths={["16%", "40%", "18%", "16%", "10%"]}
            head={<><Th>Data</Th><Th>Descrição</Th><Th>Categoria</Th><Th>Valor</Th><Th className="text-right">Ações</Th></>}
          >
            {loading ? (
                <EmptyRow colSpan={5} title="Carregando despesas..." />
            ) : despesasPeriodo.length === 0 ? (
              <EmptyRow colSpan={5} title="Nenhuma despesa no período." hint="Use o botão acima para lançar contas pagas." />
            ) : despesasPeriodo.map((e) => (
              <Row key={e.id}>
                <Td className="text-muted-foreground tabular-nums truncate">{e.date ? new Date(e.date).toLocaleDateString('pt-BR') : "N/A"}</Td>
                <Td className="font-medium truncate">{e.description}</Td>
                <Td><Pill tone="slate">{e.category || "Outro"}</Pill></Td>
                <Td className="tabular-nums font-medium text-rose-400">{formatBRL(e.amount)}</Td>
                <Td>
                  <div className="flex items-center justify-end">
                    <IconBtn label="Excluir" danger onClick={() => setDeleteId(e.id)}><Trash2 className="h-4 w-4" /></IconBtn>
                  </div>
                </Td>
              </Row>
            ))}
          </DataTable>
        </SectionCard>
      </div>

      <DespesaForm open={open} onOpenChange={setOpen} onSave={load} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta despesa?</AlertDialogTitle>
            <AlertDialogDescription>Isso afetará o lucro do período.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (deleteId) {
                await Expense.delete(deleteId);
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

function DespesaForm({ open, onOpenChange, onSave }) {
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("aluguel");
  const [valor, setValor] = useState("");
  
  const [sig, setSig] = useState("");
  const signature = `${open}`;
  
  if (sig !== signature) {
      setSig(signature);
      setDescricao("");
      setCategoria("aluguel");
      setValor("");
  }

  const save = async (e) => {
    e.preventDefault();
    if (!descricao.trim()) return;
    try {
        await Expense.create({
            description: descricao,
            category: categoria,
            amount: Number(valor),
            date: new Date().toISOString().slice(0, 10),
            recurring: false
        });
        onOpenChange(false);
        onSave();
    } catch(err) {
        alert("Erro ao salvar: " + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">Lançar Despesa</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Registre aluguel, conta de luz, materiais, etc.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save}>
          <div className="px-6 py-5 space-y-4">
            <FormField label="Descrição" required>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="h-10 bg-background border-border" placeholder="Ex: Conta de Luz" />
            </FormField>
            
            <FormField label="Categoria">
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="h-10 bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aluguel">Aluguel</SelectItem>
                  <SelectItem value="material">Material / Produto</SelectItem>
                  <SelectItem value="utilidade">Conta (Luz, Água...)</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Valor (R$)" required>
              <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className="h-10 bg-background border-border" />
            </FormField>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/60 bg-card/60">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Voltar</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">Salvar Despesa</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
