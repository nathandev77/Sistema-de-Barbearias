import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Plus, Trash2, Pencil, Star, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DataTable,
  EmptyRow,
  IconBtn,
  KV,
  PageHeader,
  PageShell,
  Pill,
  Row,
  SearchInput,
  SectionCard,
  SectionHeader,
  StatCard,
  Td,
  Th,
  FormField,
} from "@/components/shell/PageShell";

import { formatBRL, formatDate, formatSmart, normalizeText } from "@/lib/formatters";
import { Client, fetchApi } from "@/api/base44Client";

// ── Helpers para integrar com o banco real em vez de mock ──

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // States
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos");
  
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  
  const [deleteId, setDeleteId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [planClient, setPlanClient] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await Client.list();
      setClients(data.sort((a, b) => (a.name || "").localeCompare(b.name || "")));
      
      const plansData = await fetchApi('/plans').catch(() => []);
      setPlans(plansData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Adaptações para o front lovable
  // O backend atual do saas-barber não traz o "plano" no Client.list() por padrão
  // Se trouxer, estaria em c.plan. Vamos assumir que os dados básicos vêm no Client.list().
  // Para mockar a visão perfeita, vamos usar a estrutura de UI do Lovable.

  const rows = useMemo(() => {
    const q = normalizeText(search).trim();
    return clients
      .filter((c) => {
        const plano = c.plan || null; // Supondo que backend traga, senao ficara null
        if (filtro === "com" && !plano) return false;
        if (filtro === "sem" && plano) return false;
        if (!q) return true;
        return normalizeText(c.name).includes(q) || normalizeText(c.phone ?? "").includes(q);
      })
      .sort((a, b) => (a.name||"").localeCompare(b.name||""));
  }, [clients, search, filtro]);

  const comPlano = clients.filter((c) => c.plan).length;

  return (
    <PageShell>
      <PageHeader title="Clientes" subtitle="Cadastro, planos e histórico de cada cliente." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-8 pb-6">
        <StatCard label="Clientes cadastrados" value={clients.length} icon={Users} tone="sky" />
        <StatCard label="Com plano ativo" value={comPlano} icon={Star} tone="amber" />
        <StatCard label="Sem plano" value={clients.length - comPlano} icon={Users} tone="slate" />
        <StatCard label="Planos disponíveis" value={plans.length} icon={Star} tone="violet" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-8 pb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar por nome ou telefone" />
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="h-10 w-[170px] rounded-full bg-card/70 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os clientes</SelectItem>
              <SelectItem value="com">Com plano</SelectItem>
              <SelectItem value="sem">Sem plano</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="rounded-full h-10 px-5 gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo cliente
        </Button>
      </div>

      <div className="px-8 pb-16">
        <SectionCard>
          <SectionHeader title="Clientes" count={rows.length} />
          <DataTable
            widths={["20%", "14%", "14%", "16%", "10%", "12%", "14%"]}
            head={
              <>
                <Th>Cliente</Th>
                <Th>Telefone</Th>
                <Th>Última visita</Th>
                <Th>Plano</Th>
                <Th>Créditos</Th>
                <Th>Vencimento</Th>
                <Th className="text-right">Ações</Th>
              </>
            }
          >
            {loading ? (
              <EmptyRow colSpan={7} title="Carregando clientes..." />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={7} title="Nenhum cliente encontrado." hint="Ajuste a pesquisa ou cadastre um novo cliente." />
            ) : (
              rows.map((c) => {
                const plano = c.plan || null;
                // Simulando historico se nao tiver do backend ainda
                const stats = { ultimaVisita: null };
                
                return (
                  <Row key={c.id} onClick={() => setDetail(c)}>
                    <Td className="font-semibold truncate">{c.name}</Td>
                    <Td className="text-muted-foreground truncate">{c.phone ?? "—"}</Td>
                    <Td className="text-muted-foreground truncate">
                      {stats.ultimaVisita ? formatSmart(stats.ultimaVisita) : "—"}
                    </Td>
                    <Td className="truncate">
                      {plano ? <Pill tone="amber">{plano.name}</Pill> : <span className="text-muted-foreground">—</span>}
                    </Td>
                    <Td className="tabular-nums">{plano ? plano.credits : "—"}</Td>
                    <Td className="text-muted-foreground">{plano ? formatDate(plano.expiresAt) : "—"}</Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <IconBtn label="Vender plano" onClick={() => setPlanClient(c)}>
                          <Star className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn
                          label="Editar"
                          onClick={() => {
                            setEditing(c);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn label="Excluir" danger onClick={() => setDeleteId(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </IconBtn>
                      </div>
                    </Td>
                  </Row>
                );
              })
            )}
          </DataTable>
        </SectionCard>
      </div>

      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editing}
        onSave={load}
      />

      <ClientDetailDialog client={detail} onOpenChange={(o) => !o && setDetail(null)} />

      <SellPlanDialog client={planClient} plans={plans} onOpenChange={(o) => !o && setPlanClient(null)} onSave={load} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              O cliente será excluído do sistema permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteId) {
                  await Client.delete(deleteId);
                  await load();
                }
                setDeleteId(null);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function ClientFormDialog({ open, onOpenChange, client, onSave }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [key, setKey] = useState("");

  const signature = `${open}-${client?.id ?? "novo"}`;
  if (key !== signature) {
    setKey(signature);
    setName(client?.name ?? "");
    setPhone(client?.phone ?? "");
    setNotes(client?.notes ?? "");
    setEmail(client?.email ?? "");
  }

  const save = async () => {
    if (!name.trim()) return;
    try {
        if (client?.id) {
            await Client.update(client.id, { name: name.trim(), phone, notes, email });
        } else {
            await Client.create({ name: name.trim(), phone, notes, email });
        }
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
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {client ? "Editar cliente" : "Novo cliente"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Preencha os dados do cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          <FormField label="Nome" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Telefone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="E-mail">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Observações">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="bg-background border-border resize-none"
            />
          </FormField>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/60 bg-card/60">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button onClick={save} className="bg-primary hover:bg-primary/90">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SellPlanDialog({ client, plans, onOpenChange, onSave }) {
  const [planId, setPlanId] = useState("");
  const atual = client ? client.plan : null;

  const handleSubscribe = async () => {
    if (!client || !planId) return;
    try {
        await fetchApi('/plans/subscribe', {
            method: 'POST',
            body: JSON.stringify({ clientId: client.id, planId: planId })
        });
        alert('Plano vinculado com sucesso!');
        onOpenChange(false);
        onSave();
    } catch (error) {
        alert('Erro ao vincular plano: ' + error.message);
    }
  };

  return (
    <Dialog open={!!client} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Vender / renovar plano
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {client?.name} — a venda gera Receita de Plano e recarrega os créditos.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          {atual && (
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/5 px-4 py-3 text-sm">
              Plano atual: <span className="font-medium">{atual.name}</span> •{" "}
              {atual.credits} crédito(s) • vence {formatDate(atual.expiresAt)}
            </div>
          )}
          <FormField label="Plano" required>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger className="h-10 bg-background border-border">
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                {plans
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {formatBRL(p.price)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/60 bg-card/60">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button
            disabled={!planId}
            onClick={handleSubscribe}
            className="bg-emerald-500 hover:bg-emerald-400 text-white"
          >
            Confirmar venda
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClientDetailDialog({ client, onOpenChange }) {
  if (!client) return null;
  const plano = client.plan || null;
  
  // O backend ainda não provê todo o histórico assim, mas deixaremos a interface pronta:
  const stats = {
      totalGasto: 0,
      atendimentos: [],
      ultimaVisita: null,
      barbeiros: [],
      produtos: []
  };

  return (
    <Dialog open={!!client} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">{client.name}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Perfil do cliente e histórico de atendimentos.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-2">
              <KV label="Telefone" value={client.phone ?? "—"} />
              <KV label="E-mail" value={client.email ?? "—"} />
              <KV label="Total gasto" value={formatBRL(stats.totalGasto)} />
              <KV label="Atendimentos" value={stats.atendimentos.length} />
            </div>
            <div className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-2">
              <KV label="Plano" value={plano ? plano.name : "Sem plano"} />
              <KV label="Créditos restantes" value={plano ? plano.credits : "—"} />
              <KV label="Barbeiros" value={stats.barbeiros.join(", ") || "—"} />
            </div>
          </div>

          {client.notes && (
            <div className="rounded-lg border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
              {client.notes}
            </div>
          )}

          <div className="rounded-lg border border-border/60 overflow-hidden">
            <div className="px-4 py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
              Histórico de atendimentos
            </div>
            <DataTable
              head={
                <>
                  <Th>Data</Th>
                  <Th>Serviços</Th>
                  <Th>Barbeiro</Th>
                  <Th className="text-right">Valor</Th>
                </>
              }
            >
              {stats.atendimentos.length === 0 ? (
                <EmptyRow colSpan={4} title="Nenhum atendimento registrado." />
              ) : (
                stats.atendimentos.map((a) => (
                  <Row key={a.id}>
                    <Td className="text-muted-foreground">{formatSmart(a.dataHora)}</Td>
                    <Td className="truncate">{a.servicos.join(", ")}</Td>
                    <Td>{a.barbeiro}</Td>
                    <Td className="text-right tabular-nums">
                      {a.plano ? <Pill tone="amber">Plano</Pill> : formatBRL(a.valor)}
                    </Td>
                  </Row>
                ))
              )}
            </DataTable>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
