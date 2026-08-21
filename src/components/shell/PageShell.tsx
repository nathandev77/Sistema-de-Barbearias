import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* Kit visual compartilhado — mesma identidade da Agenda e do Histórico. */

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 min-w-0 bg-background text-foreground">
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-8 pt-8 pb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">{actions}</div>
    </header>
  );
}

export const TONE_STYLES: Record<string, string> = {
  sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  violet: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  amber: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  slate: "text-slate-300 bg-slate-500/10 border-slate-500/20",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "sky",
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof TONE_STYLES;
  onClick?: () => void;
}) {
  const Comp: any = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border border-border bg-card/40 px-4 py-3 flex items-center justify-between",
        onClick && "transition-colors hover:bg-accent/30",
      )}
    >
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold tracking-tight mt-0.5 truncate">{value}</div>
        {hint && <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{hint}</div>}
      </div>
      <div className={cn("h-10 w-10 shrink-0 rounded-xl grid place-items-center border", TONE_STYLES[tone])}>
        <Icon className="h-5 w-5" />
      </div>
    </Comp>
  );
}

export function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card/40 overflow-hidden", className)}>
      {children}
    </section>
  );
}

export function SectionHeader({
  title,
  count,
  right,
}: {
  title: string;
  count?: number;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/60">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {count !== undefined && (
          <span className="inline-flex items-center justify-center rounded-full bg-muted/60 text-muted-foreground text-xs h-5 min-w-[22px] px-1.5">
            {count}
          </span>
        )}
      </div>
      {right}
    </div>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("text-left font-medium px-4 py-2.5", className)}>{children}</th>;
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn("px-4 py-3 align-middle", className)}>
      {children}
    </td>
  );
}

export function DataTable({
  head,
  children,
  widths,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  widths?: string[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-sm", widths && "table-fixed")}>
        {widths && (
          <colgroup>
            {widths.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
        )}
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Row({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-t border-border/60 transition-colors hover:bg-accent/30 animate-in fade-in duration-300",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function EmptyRow({
  colSpan,
  title,
  hint,
}: {
  colSpan: number;
  title: string;
  hint?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-10 text-center text-sm text-muted-foreground">
        <div className="font-medium text-foreground/80">{title}</div>
        {hint && <div className="mt-1 text-xs">{hint}</div>}
      </td>
    </tr>
  );
}

export function IconBtn({
  children,
  label,
  onClick,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      disabled={disabled}
      className={cn(
        "h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:bg-accent transition-colors",
        danger && "hover:text-destructive",
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      {children}
    </button>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 h-10 rounded-full bg-card/70 border-border"
      />
    </div>
  );
}

export function Pill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "emerald" | "rose" | "sky" | "amber" | "violet" | "slate";
}) {
  const map: Record<string, string> = {
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    rose: "bg-rose-500/15 text-rose-300 border-rose-400/30",
    sky: "bg-sky-500/15 text-sky-300 border-sky-400/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    violet: "bg-violet-500/15 text-violet-200 border-violet-400/30",
    slate: "bg-muted/60 text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}

export function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums text-right">{value}</span>
    </div>
  );
}

export function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-primary/80 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
