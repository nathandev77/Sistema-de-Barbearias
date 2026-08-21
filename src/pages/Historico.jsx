import React, { useMemo, useState, useEffect, useCallback } from "react";
import { 
  History, 
  DollarSign, 
  CheckCircle2, 
  Calendar, 
  TrendingUp, 
  Eye, 
  Clock, 
  RotateCcw,
  Sparkles,
  Scissors
} from "lucide-react";
import {
  DataTable, EmptyRow, PageHeader, PageShell, Pill, Row,
  SearchInput, SectionCard, SectionHeader, StatCard, Td, Th,
} from "@/components/shell/PageShell";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/DatePicker";
import { formatBRL, formatDate, normalizeText } from "@/lib/formatters";
import { Appointment, Barber } from "@/api/base44Client";

export default function Historico() {
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [selectedBarberId, setSelectedBarberId] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [periodPreset, setPeriodPreset] = useState("all"); // 'today', 'week', 'month', 'all'

  // Modal de Detalhes
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [reopeningId, setReopeningId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [appts, brbs] = await Promise.all([
        Appointment.list(),
        Barber.list()
      ]);
      setAppointments(appts.sort((a, b) => {
        const dtA = `${a.date || ""} ${a.time || ""}`;
        const dtB = `${b.date || ""} ${b.time || ""}`;
        return dtB.localeCompare(dtA);
      }));
      setBarbers(brbs.filter(b => b.is_active !== false));
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lista base filtrada para status 'concluido'
  const completedAppointments = useMemo(() => {
    return appointments.filter(a => a.status === "concluido");
  }, [appointments]);

  // Aplicação dos filtros dinâmicos
  const filteredRows = useMemo(() => {
    const q = normalizeText(search).trim();
    const todayStr = new Date().toISOString().split("T")[0];

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split("T")[0];

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

    return completedAppointments.filter((item) => {
      // Filtro de Barbeiro
      if (selectedBarberId !== "all" && item.barberId !== selectedBarberId) {
        return false;
      }

      // Filtro de Data Específica
      if (selectedDate && item.date !== selectedDate) {
        return false;
      }

      // Filtro por Presets de Período (caso selectedDate não esteja ativo)
      if (!selectedDate) {
        if (periodPreset === "today" && item.date !== todayStr) return false;
        if (periodPreset === "week" && (item.date < startOfWeekStr || item.date > todayStr)) return false;
        if (periodPreset === "month" && (item.date < startOfMonthStr || item.date > todayStr)) return false;
      }

      // Filtro de Texto (Nome do cliente, telefone, barbeiro, serviços)
      if (q) {
        const clientName = normalizeText(item.client_name || item.client?.name || "");
        const clientPhone = normalizeText(item.client_phone || item.client?.phone || "");
        const barberName = normalizeText(item.barber_name || item.barber?.name || "");
        const serviceName = normalizeText(item.service_name || (item.services?.map(s => s.name).join(" ") || ""));

        const match =
          clientName.includes(q) ||
          clientPhone.includes(q) ||
          barberName.includes(q) ||
          serviceName.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [completedAppointments, search, selectedBarberId, selectedDate, periodPreset]);

  // Métricas do Histórico
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const totalCount = completedAppointments.length;
    const totalRevenue = completedAppointments.reduce((acc, a) => acc + (Number(a.price) || 0), 0);
    const todayCount = completedAppointments.filter(a => a.date === todayStr).length;
    const todayRevenue = completedAppointments
      .filter(a => a.date === todayStr)
      .reduce((acc, a) => acc + (Number(a.price) || 0), 0);
    const ticketMedio = totalCount > 0 ? totalRevenue / totalCount : 0;

    return { totalCount, totalRevenue, todayCount, todayRevenue, ticketMedio };
  }, [completedAppointments]);

  // Função para reabrir corte (caso tenha sido finalizado por engano)
  const handleReopen = async (apptId) => {
    try {
      setReopeningId(apptId);
      await Appointment.update(apptId, { status: "agendado" });
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: "agendado" } : a));
      setSelectedAppt(null);
    } catch (err) {
      console.error("Erro ao reabrir corte:", err);
      alert("Não foi possível reabrir o agendamento.");
    } finally {
      setReopeningId(null);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedBarberId("all");
    setSelectedDate("");
    setPeriodPreset("all");
  };

  const hasActiveFilters = Boolean(search || selectedBarberId !== "all" || selectedDate || periodPreset !== "all");

  return (
    <PageShell>
      <PageHeader
        title="Histórico de Atendimentos"
        subtitle="Registro completo de todos os cortes e serviços concluídos na barbearia."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="gap-2"
            >
              <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        }
      />

      <div className="px-8 pb-12 space-y-6">
        {/* ── Métricas Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard
            label="Total de Cortes Concluídos"
            value={metrics.totalCount}
            hint="Atendimentos realizados"
            icon={CheckCircle2}
            tone="emerald"
          />
          <StatCard
            label="Faturamento em Cortes"
            value={formatBRL(metrics.totalRevenue)}
            hint="Receita gerada pelos cortes"
            icon={DollarSign}
            tone="sky"
          />
          <StatCard
            label="Concluídos Hoje"
            value={metrics.todayCount}
            hint={formatBRL(metrics.todayRevenue)}
            icon={Scissors}
            tone="violet"
          />
          <StatCard
            label="Ticket Médio por Corte"
            value={formatBRL(metrics.ticketMedio)}
            hint="Média por atendimento"
            icon={TrendingUp}
            tone="amber"
          />
        </div>

        {/* ── Filtros e Busca ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-card/40 p-4 rounded-2xl border border-border">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar cliente, barbeiro ou serviço..."
              className="max-w-xs"
            />

            <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
              <SelectTrigger className="w-[180px] h-10 rounded-full bg-card/70 border-border">
                <SelectValue placeholder="Barbeiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Barbeiros</SelectItem>
                {barbers.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Presets de Período */}
            <div className="inline-flex rounded-full border border-border p-0.5 bg-card/70 text-xs">
              {[
                { id: "all", label: "Todos" },
                { id: "today", label: "Hoje" },
                { id: "week", label: "Semana" },
                { id: "month", label: "Mês" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPeriodPreset(p.id);
                    setSelectedDate("");
                  }}
                  className={`px-3 py-1.5 rounded-full transition-colors ${
                    periodPreset === p.id && !selectedDate
                      ? "bg-primary text-primary-foreground font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* DatePicker Personalizado */}
            <div className="w-[165px]">
              <DatePicker
                value={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  setPeriodPreset("all");
                }}
                placeholder="Data específica"
                triggerClassName="h-10 rounded-full bg-card/70 border border-border px-3.5 text-xs w-full hover:bg-secondary/70 hover:border-primary/40"
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-primary hover:text-primary/80"
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>

        {/* ── Tabela de Histórico ────────────────────────────────────────── */}
        <SectionCard>
          <SectionHeader
            title="Cortes Finalizados"
            count={filteredRows.length}
            right={
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Histórico sincronizado em tempo real
              </span>
            }
          />

          <DataTable>
            <thead>
              <Row isHeader>
                <Th>Cliente</Th>
                <Th>Serviço</Th>
                <Th>Barbeiro</Th>
                <Th>Data e Horário</Th>
                <Th>Valor</Th>
                <Th>Status</Th>
                <Th className="text-right">Ações</Th>
              </Row>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="inline-flex flex-col items-center gap-3">
                      <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-xs text-muted-foreground">Carregando histórico de cortes...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <EmptyRow
                  colSpan={7}
                  message={
                    hasActiveFilters
                      ? "Nenhum atendimento encontrado para os filtros selecionados."
                      : "Nenhum corte finalizado ainda. Quando um agendamento for marcado como concluído na Agenda, ele aparecerá aqui automaticamente!"
                  }
                />
              ) : (
                filteredRows.map((appt) => {
                  const servicesList = appt.services && appt.services.length > 0 
                    ? appt.services 
                    : appt.service_name 
                      ? [{ id: '1', name: appt.service_name }] 
                      : [];

                  return (
                    <Row key={appt.id}>
                      {/* Cliente */}
                      <Td>
                        <div className="font-medium text-foreground">
                          {appt.client_name || appt.client?.name || "Cliente não informado"}
                        </div>
                        {(appt.client_phone || appt.client?.phone) && (
                          <div className="text-xs text-muted-foreground">
                            {appt.client_phone || appt.client?.phone}
                          </div>
                        )}
                      </Td>

                      {/* Serviços Realizados */}
                      <Td>
                        <div className="flex flex-wrap gap-1 max-w-[280px]">
                          {servicesList.length > 0 ? (
                            servicesList.map((srv, idx) => (
                              <span
                                key={srv.id || idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary text-foreground border border-border"
                              >
                                {srv.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Serviço padrão</span>
                          )}
                        </div>
                      </Td>

                      {/* Barbeiro */}
                      <Td>
                        <span className="text-sm text-foreground/90 font-medium">
                          {appt.barber_name || appt.barber?.name || "—"}
                        </span>
                      </Td>

                      {/* Data e Horário */}
                      <Td>
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{formatDate(appt.date)}</span>
                        </div>
                        {appt.time && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{appt.time}</span>
                          </div>
                        )}
                      </Td>

                      {/* Valor */}
                      <Td>
                        <span className="text-sm font-semibold text-emerald-400">
                          {formatBRL(appt.price)}
                        </span>
                      </Td>

                      {/* Status */}
                      <Td>
                        <Pill tone="emerald">Concluído</Pill>
                      </Td>

                      {/* Ações */}
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAppt(appt)}
                            className="h-8 px-2.5 text-xs gap-1 hover:bg-secondary/60"
                            title="Ver detalhes do atendimento"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detalhes
                          </Button>
                        </div>
                      </Td>
                    </Row>
                  );
                })
              )}
            </tbody>
          </DataTable>
        </SectionCard>
      </div>

      {/* ── Modal de Detalhes do Atendimento ────────────────────────── */}
      {selectedAppt && (
        <Dialog open={Boolean(selectedAppt)} onOpenChange={(open) => !open && setSelectedAppt(null)}>
          <DialogContent className="max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Comprovante de Atendimento
              </DialogTitle>
              <DialogDescription>
                Detalhes do corte e serviços prestados
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-sm">
              <div className="bg-secondary/40 p-3.5 rounded-xl border border-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Cliente:</span>
                  <span className="font-semibold text-foreground">
                    {selectedAppt.client_name || selectedAppt.client?.name || "Não informado"}
                  </span>
                </div>
                {(selectedAppt.client_phone || selectedAppt.client?.phone) && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Telefone:</span>
                    <span className="text-foreground text-xs font-mono">
                      {selectedAppt.client_phone || selectedAppt.client?.phone}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Barbeiro:</span>
                  <span className="font-medium text-foreground">
                    {selectedAppt.barber_name || selectedAppt.barber?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Data e Hora:</span>
                  <span className="text-foreground font-medium">
                    {formatDate(selectedAppt.date)} às {selectedAppt.time || "—"}
                  </span>
                </div>
              </div>

              {/* Lista de Serviços */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Serviço
                </span>
                <div className="mt-1.5 space-y-1.5">
                  {selectedAppt.services && selectedAppt.services.length > 0 ? (
                    selectedAppt.services.map((s) => (
                      <div key={s.id} className="flex justify-between text-xs p-2 rounded-lg bg-secondary/30">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground">{formatBRL(s.price)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-xs p-2 rounded-lg bg-secondary/30">
                      <span className="font-medium">{selectedAppt.service_name || "Corte de Cabelo"}</span>
                      <span className="text-muted-foreground">{formatBRL(selectedAppt.price)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Observações */}
              {selectedAppt.notes && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Observações
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground bg-secondary/20 p-2.5 rounded-lg border border-border">
                    {selectedAppt.notes}
                  </p>
                </div>
              )}

              {/* Total */}
              <div className="pt-2 border-t border-border flex justify-between items-center">
                <span className="text-sm font-semibold">Valor Total Cobrado:</span>
                <span className="text-lg font-bold text-emerald-400">{formatBRL(selectedAppt.price)}</span>
              </div>

              {/* Ação de Reabrir */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReopen(selectedAppt.id)}
                  disabled={reopeningId === selectedAppt.id}
                  className="text-xs gap-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 border-amber-400/20"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${reopeningId === selectedAppt.id ? 'animate-spin' : ''}`} />
                  Mover de volta para a Agenda
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSelectedAppt(null)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PageShell>
  );
}
