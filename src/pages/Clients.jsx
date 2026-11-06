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

// ── Helpers to integrate with the real database instead of mocks ──

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

  // Adaptations for the Lovable front end
  // The current saas-barber backend does not return the "plan" in Client.list() by default
  // If it does, it would be in c.plan. We assume the basic data comes from Client.list().
  // To mock the ideal view, we use Lovable's UI structure.

  const rows = useMemo(() => {
    const q = normalizeText(search).trim();
    return clients
      .filter((c) => {
        const plano = c.plan || null; // Assuming the backend returns it, otherwise it will be null
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
      <PageHeader title="Clients" subtitle="Registration, plans and history for each client." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-8 pb-6">
        <StatCard label="Registered clients" value={clients.length} icon={Users} tone="sky" />
        <StatCard label="With active plan" value={comPlano} icon={Star} tone="amber" />
        <StatCard label="Without plan" value={clients.length - comPlano} icon={Users} tone="slate" />
        <StatCard label="Available plans" value={plans.length} icon={Star} tone="violet" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-8 pb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or phone" />
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="h-10 w-[170px] rounded-full bg-card/70 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">All clients</SelectItem>
              <SelectItem value="com">With plan</SelectItem>
              <SelectItem value="sem">Without plan</SelectItem>
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
          New client
        </Button>
      </div>

      <div className="px-8 pb-16">
        <SectionCard>
          <SectionHeader title="Clients" count={rows.length} />
          <DataTable
            widths={["20%", "14%", "14%", "16%", "10%", "12%", "14%"]}
            head={
              <>
                <Th>Client</Th>
                <Th>Phone</Th>
                <Th>Last visit</Th>
                <Th>Plan</Th>
                <Th>Credits</Th>
                <Th>Expires</Th>
                <Th className="text-right">Actions</Th>
              </>
            }
          >
            {loading ? (
              <EmptyRow colSpan={7} title="Loading clients..." />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={7} title="No clients found." hint="Adjust your search or register a new client." />
            ) : (
              rows.map((c) => {
                const plano = c.plan || null;
                // Simulating history if the backend does not provide it yet
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
                        <IconBtn label="Sell plan" onClick={() => setPlanClient(c)}>
                          <Star className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn
                          label="Edit"
                          onClick={() => {
                            setEditing(c);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn label="Delete" danger onClick={() => setDeleteId(c.id)}>
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
            <AlertDialogTitle>Delete this client?</AlertDialogTitle>
            <AlertDialogDescription>
              The client will be permanently deleted from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
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
              Delete
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
        alert("Error saving: " + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {client ? "Edit client" : "New client"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Fill in the client's details.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          <FormField label="Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="E-mail">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Notes">
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
            Back
          </Button>
          <Button onClick={save} className="bg-primary hover:bg-primary/90">
            Save
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
        alert('Plan linked successfully!');
        onOpenChange(false);
        onSave();
    } catch (error) {
        alert('Error linking plan: ' + error.message);
    }
  };

  return (
    <Dialog open={!!client} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Sell / renew plan
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {client?.name} — the sale generates Plan Revenue and reloads the credits.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          {atual && (
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/5 px-4 py-3 text-sm">
              Current plan: <span className="font-medium">{atual.name}</span> •{" "}
              {atual.credits} credit(s) • expires {formatDate(atual.expiresAt)}
            </div>
          )}
          <FormField label="Plan" required>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger className="h-10 bg-background border-border">
                <SelectValue placeholder="Select a plan" />
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
            Back
          </Button>
          <Button
            disabled={!planId}
            onClick={handleSubscribe}
            className="bg-emerald-500 hover:bg-emerald-400 text-white"
          >
            Confirm sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClientDetailDialog({ client, onOpenChange }) {
  if (!client) return null;
  const plano = client.plan || null;
  
  // The backend does not yet provide the full history this way, but we leave the UI ready:
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
            Client profile and service history.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-2">
              <KV label="Phone" value={client.phone ?? "—"} />
              <KV label="E-mail" value={client.email ?? "—"} />
              <KV label="Total spent" value={formatBRL(stats.totalGasto)} />
              <KV label="Services" value={stats.atendimentos.length} />
            </div>
            <div className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-2">
              <KV label="Plan" value={plano ? plano.name : "No plan"} />
              <KV label="Remaining credits" value={plano ? plano.credits : "—"} />
              <KV label="Barbers" value={stats.barbeiros.join(", ") || "—"} />
            </div>
          </div>

          {client.notes && (
            <div className="rounded-lg border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
              {client.notes}
            </div>
          )}

          <div className="rounded-lg border border-border/60 overflow-hidden">
            <div className="px-4 py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
              Service history
            </div>
            <DataTable
              head={
                <>
                  <Th>Date</Th>
                  <Th>Services</Th>
                  <Th>Barber</Th>
                  <Th className="text-right">Price</Th>
                </>
              }
            >
              {stats.atendimentos.length === 0 ? (
                <EmptyRow colSpan={4} title="No services recorded." />
              ) : (
                stats.atendimentos.map((a) => (
                  <Row key={a.id}>
                    <Td className="text-muted-foreground">{formatSmart(a.dataHora)}</Td>
                    <Td className="truncate">{a.servicos.join(", ")}</Td>
                    <Td>{a.barbeiro}</Td>
                    <Td className="text-right tabular-nums">
                      {a.plano ? <Pill tone="amber">Plan</Pill> : formatBRL(a.valor)}
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
