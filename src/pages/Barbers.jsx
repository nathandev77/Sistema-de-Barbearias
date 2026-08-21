import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Plus, Trash2, Pencil, Scissors, DollarSign, Wallet } from "lucide-react";

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
import { Barber } from "@/api/base44Client";

const EMPTY = {
  name: "", specialty: "Barbeiro", is_active: true, commission_pct: 40, fixed_salary: 0,
};

// Como o backend original nao tem ajustes, vou apenas ignorar o AdjustmentDialog 
// e mockar os totais para a interface.

export default function BarbersPage() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await Barber.list();
      setBarbers(data.sort((a, b) => (a.name || "").localeCompare(b.name || "")));
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
    return barbers.filter((b) => (!q ? true : normalizeText(b.name).includes(q)));
  }, [barbers, search]);

  const totalPagar = 0; // Seria calculado baseado nos atendimentos (backend ou redux store).
  const atendimentos = 0;

  return (
    <PageShell>
      <PageHeader title="Barbeiros" subtitle="Equipe, comissões e totais a receber." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-8 pb-6">
        <StatCard label="Barbeiros" value={barbers.length} icon={Scissors} tone="sky" />
        <StatCard label="Ativos" value={barbers.filter((b) => b.is_active).length} icon={Scissors} tone="emerald" />
        <StatCard label="Atendimentos no mês" value={atendimentos} icon={Wallet} tone="violet" />
        <StatCard label="Total a pagar" value={formatBRL(totalPagar)} icon={DollarSign} tone="amber" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-8 pb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar barbeiro" />
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="rounded-full h-10 px-5 gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Novo barbeiro
        </Button>
      </div>

      <div className="px-8 pb-16">
        <SectionCard>
          <SectionHeader title="Equipe" count={rows.length} />
          <DataTable
            widths={["20%", "20%", "20%", "20%", "20%"]}
            head={<><Th>Barbeiro</Th><Th>Cargo</Th><Th>Comissão (%)</Th><Th>Fixo</Th><Th className="text-right">Ações</Th></>}
          >
            {loading ? (
              <EmptyRow colSpan={5} title="Carregando barbeiros..." />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={5} title="Nenhum barbeiro encontrado." />
            ) : rows.map((b) => {
              return (
                <Row key={b.id} onClick={() => setDetail(b)}>
                  <Td className="font-semibold truncate">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{b.name}</span>
                      <Pill tone={b.is_active ? "emerald" : "slate"}>{b.is_active ? "Ativo" : "Inativo"}</Pill>
                    </div>
                  </Td>
                  <Td className="text-muted-foreground truncate">{b.specialty || "Barbeiro"}</Td>
                  <Td className="tabular-nums">{b.commission_pct ?? 0}%</Td>
                  <Td className="tabular-nums">{formatBRL(b.fixed_salary ?? 0)}</Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <IconBtn label="Editar" onClick={() => { setEditing(b); setOpen(true); }}><Pencil className="h-4 w-4" /></IconBtn>
                      <IconBtn label="Excluir" danger onClick={() => setDeleteId(b.id)}><Trash2 className="h-4 w-4" /></IconBtn>
                    </div>
                  </Td>
                </Row>
              );
            })}
          </DataTable>
        </SectionCard>
      </div>

      <BarberForm open={open} onOpenChange={setOpen} barber={editing} onSave={load} />

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="bg-card border-border max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-5 border-b border-border/60 space-y-1">
            <DialogTitle className="text-lg font-semibold tracking-tight">{detail?.name}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Perfil financeiro resumido.
            </DialogDescription>
          </DialogHeader>
          {detail && (() => {
            return (
              <div className="px-6 py-5 space-y-2">
                <KV label="Comissão" value={`${detail.commission_pct ?? 0}%`} />
                <KV label="Salário Fixo" value={formatBRL(detail.fixed_salary ?? 0)} />
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este barbeiro?</AlertDialogTitle>
            <AlertDialogDescription>O histórico de atendimentos é preservado, mas o barbeiro será removido permanentemente do quadro.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (deleteId) {
                await Barber.delete(deleteId);
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

function BarberForm({ open, onOpenChange, barber, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [sig, setSig] = useState("");
  const signature = `${open}-${barber?.id ?? "novo"}`;
  
  if (sig !== signature) { 
    setSig(signature); 
    setForm(barber ? { 
        name: barber.name, 
        specialty: barber.specialty, 
        is_active: barber.is_active, 
        commission_pct: barber.commission_pct, 
        fixed_salary: barber.fixed_salary 
    } : EMPTY); 
  }
  
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.name.trim()) return;
    try {
        const payload = {
            ...form,
            commission_pct: Number(form.commission_pct),
            fixed_salary: Number(form.fixed_salary)
        };
        if (barber) {
            await Barber.update(barber.id, payload);
        } else {
            await Barber.create(payload);
        }
        onOpenChange(false);
        onSave();
    } catch(err) {
        alert("Erro ao salvar: " + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">{barber ? "Editar barbeiro" : "Novo barbeiro"}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Preencha os detalhes da contratação.</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Nome" required>
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Cargo / Especialidade">
            <Input value={form.specialty} onChange={(e) => set({ specialty: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Comissão (%)">
            <Input type="number" value={form.commission_pct} onChange={(e) => set({ commission_pct: e.target.value })} className="h-10 bg-background border-border" />
          </FormField>
          <FormField label="Salário fixo (R$)">
            <Input type="number" value={form.fixed_salary} onChange={(e) => set({ fixed_salary: e.target.value })} className="h-10 bg-background border-border" />
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
