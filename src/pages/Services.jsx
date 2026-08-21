import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Plus, Trash2, Pencil, Tag, Power } from "lucide-react";

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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatBRL, normalizeText } from "@/lib/formatters";
import { Service } from "@/api/base44Client";

const EMPTY = {
  name: "", description: "", duration_minutes: 30, durationMinutes: 30, price: 0,
  category: "Cabelo", is_active: true
};

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await Service.list();
      setServices(data.sort((a, b) => (a.name || "").localeCompare(b.name || "")));
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
    return services.filter((s) => {
      const isActive = s.isActive !== false && s.is_active !== false;
      const sStatus = isActive ? "Ativo" : "Inativo";
      if (statusFilter !== "todos" && sStatus !== statusFilter) return false;
      if (!q) return true;
      return normalizeText(s.name).includes(q) || normalizeText(s.category || "").includes(q);
    });
  }, [services, search, statusFilter]);

  const ativos = services.filter((s) => s.isActive !== false && s.is_active !== false).length;
  const ticketMedio = services.length ? services.reduce((a, s) => a + (s.price || 0), 0) / services.length : 0;

  return (
    <PageShell>
      <PageHeader title="Serviços" subtitle="Cadastre e gerencie os serviços prestados pela barbearia." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-8 pb-6">
        <StatCard label="Serviços" value={services.length} icon={Tag} tone="sky" />
        <StatCard label="Ativos" value={ativos} icon={Power} tone="emerald" />
        <StatCard label="Inclusos em planos" value={ativos} icon={Tag} tone="amber" />
        <StatCard label="Ticket médio" value={formatBRL(ticketMedio)} icon={Tag} tone="violet" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-8 pb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar serviço ou categoria" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-[160px] rounded-full bg-card/70 border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="Ativo">Ativos</SelectItem>
              <SelectItem value="Inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="rounded-full h-10 px-5 gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Novo serviço
        </Button>
      </div>

      <div className="px-8 pb-16">
        <SectionCard>
          <SectionHeader title="Serviços cadastrados" count={rows.length} />
          <DataTable
            widths={["22%", "16%", "12%", "12%", "14%", "12%", "12%"]}
            head={<><Th>Serviço</Th><Th>Categoria</Th><Th>Duração</Th><Th>Preço</Th><Th>Comissão</Th><Th>Status</Th><Th className="text-right">Ações</Th></>}
          >
            {loading ? (
                <EmptyRow colSpan={7} title="Carregando serviços..." />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={7} title="Nenhum serviço encontrado." hint="Cadastre um novo serviço para começar." />
            ) : rows.map((s) => {
              const duration = s.durationMinutes || s.duration_minutes || 30;
              const isActive = s.isActive !== false && s.is_active !== false;
              return (
                <Row key={s.id}>
                  <Td className="font-semibold truncate">
                    <div className="flex flex-col">
                      <span className="truncate">{s.name}</span>
                      {s.description && <span className="text-[11px] text-muted-foreground truncate">{s.description}</span>}
                    </div>
                  </Td>
                  <Td className="text-muted-foreground truncate">{s.category || "Cabelo"}</Td>
                  <Td className="tabular-nums font-medium">{duration} min</Td>
                  <Td className="tabular-nums font-semibold">{formatBRL(s.price)}</Td>
                  <Td className="text-muted-foreground tabular-nums">40%</Td> 
                  <Td><Pill tone={isActive ? "emerald" : "slate"}>{isActive ? "Ativo" : "Inativo"}</Pill></Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn label="Editar" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="h-4 w-4" /></IconBtn>
                      <IconBtn label="Excluir" danger onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4" /></IconBtn>
                    </div>
                  </Td>
                </Row>
              );
            })}
          </DataTable>
        </SectionCard>
      </div>

      <ServiceForm open={open} onOpenChange={setOpen} service={editing} onSave={load} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este serviço?</AlertDialogTitle>
            <AlertDialogDescription>O histórico de atendimentos e planos existentes não serão afetados, mas o serviço deixará de estar disponível para novos agendamentos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (deleteId) {
                await Service.delete(deleteId);
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

function ServiceForm({ open, onOpenChange, service, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [sig, setSig] = useState("");
  
  const signature = `${open}-${service?.id ?? "novo"}`;
  if (sig !== signature) {
    setSig(signature);
    setForm(service ? { 
        name: service.name,
        description: service.description || "",
        duration_minutes: service.durationMinutes || service.duration_minutes || 30,
        price: service.price || 0,
        category: service.category || "Cabelo",
        is_active: service.isActive !== false && service.is_active !== false
    } : EMPTY);
  }

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.name.trim()) return;
    try {
      const dur = Number(form.duration_minutes) > 0 ? Number(form.duration_minutes) : 30;
      const payload = {
        name: form.name.trim(),
        description: form.description || undefined,
        durationMinutes: dur,
        duration_minutes: dur,
        price: Number(form.price),
        category: form.category || "Cabelo",
        isActive: form.is_active,
        is_active: form.is_active
      };
      if (service) await Service.update(service.id, payload);
      else await Service.create(payload);
      
      onOpenChange(false);
      onSave();
    } catch(err) {
      alert("Erro ao salvar serviço: " + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">{service ? "Editar serviço" : "Novo serviço"}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Serviços podem ser agendados e incluídos em planos.</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
          <FormField label="Nome do serviço" required>
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Categoria">
            <Select value={form.category} onValueChange={(v) => set({ category: v })}>
              <SelectTrigger className="h-10 bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cabelo">Cabelo</SelectItem>
                <SelectItem value="Barba">Barba</SelectItem>
                <SelectItem value="Estética">Estética</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Descrição (opcional)">
              <Textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={2} className="bg-background border-border resize-none" />
            </FormField>
          </div>
          <FormField label="Duração (minutos)">
            <Input type="number" step="5" value={form.duration_minutes} onChange={(e) => set({ duration_minutes: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Preço base (R$)">
            <Input type="number" value={form.price} onChange={(e) => set({ price: e.target.value })} className="h-10 bg-background border-border" />
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
