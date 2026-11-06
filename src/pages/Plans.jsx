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
      console.error("Error loading data:", err);
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
  // Approximate revenue, using only the plan price for active subscriptions
  const totalRevenue = subscriptions.reduce((acc, sub) => {
      if(sub.status === "active" && sub.plan) {
          return acc + Number(sub.plan.price);
      }
      return acc;
  }, 0);

  const handleDeleteSub = async (id) => {
    if (!window.confirm("Do you really want to delete or decline this subscription?")) return;
    try {
        await fetchApi(`/plans/subscriptions/${id}`, { method: 'DELETE' });
        loadData();
    } catch (error) {
        alert('Error deleting: ' + error.message);
    }
  };

  const handleConfirmPayment = async (id) => {
      if (!window.confirm("Confirm that the client has paid and activate the subscription?")) return;
      try {
          await fetchApi(`/plans/subscriptions/${id}/status`, {
              method: 'PUT',
              body: JSON.stringify({ status: 'active' })
          });
          loadData();
      } catch (error) {
          alert('Error confirming: ' + error.message);
      }
  };

  return (
    <PageShell>
      <PageHeader title="Plans" subtitle="Create monthly packages, build client loyalty and secure recurring revenue." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-8 pb-6">
        <StatCard label="Plans created" value={plans.length} icon={Star} tone="amber" />
        <StatCard label="Active subscriptions" value={activeSubs} icon={Users} tone="sky" />
        <StatCard label="Recurring Revenue" value={formatBRL(totalRevenue)} icon={DollarSign} tone="emerald" />
        <StatCard label="Total subscribers" value={subscriptions.length} icon={Star} tone="violet" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-8 pb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search plan" />
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="rounded-full h-10 px-5 gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New plan
        </Button>
      </div>

      <div className="px-8 pb-16 space-y-4">
        <SectionCard>
          <SectionHeader title="Registered plans" count={rows.length} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {loading ? (
                <p className="text-muted-foreground text-sm">Loading plans...</p>
            ) : rows.length === 0 ? (
                <EmptyRow colSpan={1} title="No plans registered." hint="Create a VIP plan to secure monthly revenue." />
            ) : rows.map((plan) => (
                <div key={plan.id} className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm relative group hover:border-primary/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                            <Star className="w-3.5 h-3.5" /> Monthly
                        </span>
                    </div>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-foreground pr-24 truncate">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1 min-h-[40px] line-clamp-2">{plan.description || 'No description'}</p>
                        
                        <div className="my-6">
                            <span className="text-3xl font-extrabold text-foreground">
                                {formatBRL(plan.price)}
                            </span>
                            <span className="text-sm text-muted-foreground font-medium"> /month</span>
                        </div>

                        <ul className="space-y-3 mb-8">
                            <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                <span className="text-foreground font-medium">{plan.serviceCount} services</span> per month
                            </li>
                            <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                Deducted from the booking amount
                            </li>
                        </ul>

                        <button onClick={() => setDeleteId(plan)} className="w-full py-2.5 rounded-xl border border-destructive/20 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors">
                            Delete Plan
                        </button>
                    </div>
                </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Subscribers and Sign-ups" count={subscriptions.length} />
          <DataTable
            widths={["18%", "16%", "14%", "14%", "14%", "10%", "14%"]}
            head={<><Th>Client</Th><Th>Plan</Th><Th>Status</Th><Th>Start</Th><Th>Due Date</Th><Th>Remaining</Th><Th className="text-right">Actions</Th></>}
          >
            {subscriptions.length === 0 ? (
              <EmptyRow colSpan={7} title="No active subscriptions." />
            ) : subscriptions.map((sub) => {
              const isExpired = new Date(sub.endDate) < new Date();
              const isPending = sub.status === 'pendente';
              const isActive = sub.status === 'active' && !isExpired;
              
              let tone = "slate";
              let label = "Canceled";
              
              if (isPending) { tone = "amber"; label = "Pending"; }
              else if (isActive) { tone = "emerald"; label = "Paid / Active"; }
              else if (isExpired) { tone = "rose"; label = "Expired"; }

              return (
                <Row key={sub.id}>
                  <Td className="font-medium text-foreground truncate">{sub.client?.name || "Client"}</Td>
                  <Td className="truncate">{sub.plan?.name || "Removed"}</Td>
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
                      {isPending && (
                        <IconBtn label="Confirm Payment" onClick={() => handleConfirmPayment(sub.id)}><CheckCircle2 className="h-4 w-4 text-emerald-500" /></IconBtn>
                      )}
                      {!isPending && (
                        <IconBtn label="Delete" danger onClick={() => handleDeleteSub(sub.id)}><Trash2 className="h-4 w-4" /></IconBtn>
                      )}
                      {isPending && (
                        <IconBtn label="Decline" danger onClick={() => handleDeleteSub(sub.id)}><Trash2 className="h-4 w-4" /></IconBtn>
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
            <AlertDialogTitle>Delete {deleteId?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Active subscriptions will be kept, but the plan can no longer be sold.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (deleteId) {
                  try {
                    await fetchApi(`/plans/${deleteId.id}`, { method: 'DELETE' });
                    await loadData();
                  } catch (e) {
                    alert('Error deleting: ' + e.message);
                  }
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
        alert("Error saving plan: " + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">New plan</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Plans build client loyalty with monthly billing.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save}>
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
            <div className="sm:col-span-2">
                <FormField label="Plan name" required>
                <Input value={form.name} onChange={(e) => set({ name: e.target.value })} className="h-10 bg-background border-border" placeholder="E.g. Monthly VIP Plan" required />
                </FormField>
            </div>
            
            <FormField label="Monthly price (R$)" required>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => set({ price: e.target.value })} className="h-10 bg-background border-border" required />
            </FormField>
            
            <FormField label="Monthly service credits" required>
              <Input type="number" min="1" value={form.serviceCount} onChange={(e) => set({ serviceCount: e.target.value })} className="h-10 bg-background border-border" required />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Description (Optional)">
                <Textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={2} className="bg-background border-border resize-none" placeholder="Benefits and rules..." />
              </FormField>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/60 bg-card/60">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Back</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
