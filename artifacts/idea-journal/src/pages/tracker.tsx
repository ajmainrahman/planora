import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  Filter,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

async function apiFetch<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

type TrackerStatus = "not_started" | "working_on" | "complete" | "blocked" | "in_review" | "na";
type TrackerPriority = "low" | "medium" | "high" | "critical";

interface TrackerRow {
  id: number;
  ownerId: string;
  feature: string;
  poc: string | null;
  deadline: string | null;
  prdStatus: TrackerStatus | null;
  figmaLink: string | null;
  prdLink: string | null;
  brdStatus: TrackerStatus | null;
  brdLink: string | null;
  testCaseLink: string | null;
  prototype: string | null;
  priority: TrackerPriority | null;
  assignee: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: TrackerStatus; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "working_on", label: "Working On" },
  { value: "in_review", label: "In Review" },
  { value: "complete", label: "Complete" },
  { value: "blocked", label: "Blocked" },
  { value: "na", label: "N/A" },
];

const PRIORITY_OPTIONS: { value: TrackerPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const STATUS_COLORS: Record<TrackerStatus, string> = {
  not_started: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  working_on: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  in_review: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  complete: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  na: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const PRIORITY_COLORS: Record<TrackerPriority, string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const COLUMNS = [
  { key: "feature", label: "Feature", width: "min-w-[180px]", type: "text" },
  { key: "assignee", label: "Assignee", width: "min-w-[120px]", type: "text" },
  { key: "poc", label: "POC", width: "min-w-[120px]", type: "text" },
  { key: "deadline", label: "Deadline", width: "min-w-[120px]", type: "date" },
  { key: "priority", label: "Priority", width: "min-w-[120px]", type: "priority" },
  { key: "prdStatus", label: "PRD Status", width: "min-w-[130px]", type: "status" },
  { key: "figmaLink", label: "Figma Link", width: "min-w-[160px]", type: "link" },
  { key: "prdLink", label: "PRD Link", width: "min-w-[140px]", type: "link" },
  { key: "brdStatus", label: "BRD Status", width: "min-w-[130px]", type: "status" },
  { key: "brdLink", label: "BRD Link", width: "min-w-[140px]", type: "link" },
  { key: "testCaseLink", label: "Test Case Link", width: "min-w-[150px]", type: "link" },
  { key: "prototype", label: "Prototype", width: "min-w-[140px]", type: "link" },
  { key: "comment", label: "Comment", width: "min-w-[200px]", type: "text" },
] as const;

type ColKey = (typeof COLUMNS)[number]["key"];

// ─── API helpers ─────────────────────────────────────────────────────────────

const apiList = (): Promise<TrackerRow[]> =>
  apiFetch("/api/tracker");

const apiCreate = (body: Partial<TrackerRow>): Promise<TrackerRow> =>
  apiFetch("/api/tracker", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

const apiUpdate = (id: number, body: Partial<TrackerRow>): Promise<TrackerRow> =>
  apiFetch(`/api/tracker/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

const apiDelete = (id: number): Promise<void> =>
  apiFetch(`/api/tracker/${id}`, { method: "DELETE" });

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({
  value,
  onChange,
}: {
  value: TrackerStatus | null;
  onChange: (v: TrackerStatus) => void;
}) {
  const status = value ?? "not_started";
  const label = STATUS_OPTIONS.find((s) => s.value === status)?.label ?? "Not Started";
  return (
    <Select value={status} onValueChange={(v) => onChange(v as TrackerStatus)}>
      <SelectTrigger className="h-7 border-0 shadow-none bg-transparent p-0 focus:ring-0 gap-1 w-full">
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
            STATUS_COLORS[status],
          )}
        >
          {label}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[opt.value])}>
              {opt.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PriorityBadge({
  value,
  onChange,
}: {
  value: TrackerPriority | null;
  onChange: (v: TrackerPriority) => void;
}) {
  const priority = value ?? "medium";
  const label = PRIORITY_OPTIONS.find((p) => p.value === priority)?.label ?? "Medium";
  return (
    <Select value={priority} onValueChange={(v) => onChange(v as TrackerPriority)}>
      <SelectTrigger className="h-7 border-0 shadow-none bg-transparent p-0 focus:ring-0 gap-1 w-full">
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
            PRIORITY_COLORS[priority],
          )}
        >
          {label}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
      </SelectTrigger>
      <SelectContent>
        {PRIORITY_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", PRIORITY_COLORS[opt.value])}>
              {opt.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function LinkCell({
  value,
  onChange,
  placeholder,
}: {
  value: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    setEditing(false);
    if (draft !== (value ?? "")) onChange(draft);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Tab") commit();
          if (e.key === "Escape") { setDraft(value ?? ""); setEditing(false); }
        }}
        className="h-7 text-xs border-primary/50 px-2"
        placeholder={placeholder ?? "https://..."}
        autoFocus
      />
    );
  }

  if (value) {
    return (
      <div className="flex items-center gap-1 group w-full">
        <a
          href={value.startsWith("http") ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary underline underline-offset-2 truncate max-w-[120px] hover:text-primary/80"
          onClick={(e) => e.stopPropagation()}
        >
          {value.replace(/^https?:\/\//, "").slice(0, 24)}…
        </a>
        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100" />
        <button
          className="text-muted-foreground hover:text-foreground ml-auto opacity-0 group-hover:opacity-100 shrink-0"
          onClick={() => { setDraft(value); setEditing(true); }}
        >
          <span className="text-[10px]">edit</span>
        </button>
      </div>
    );
  }

  return (
    <button
      className="text-xs text-muted-foreground hover:text-foreground italic w-full text-left"
      onClick={() => { setDraft(""); setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); }}
    >
      Add link…
    </button>
  );
}

function TextCell({
  value,
  onChange,
  placeholder,
  bold,
}: {
  value: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
  bold?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  const commit = () => {
    setEditing(false);
    if (draft !== (value ?? "")) onChange(draft);
  };

  if (editing) {
    return (
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Tab") commit();
          if (e.key === "Escape") { setDraft(value ?? ""); setEditing(false); }
        }}
        className="h-7 text-xs border-primary/50 px-2"
        placeholder={placeholder}
        autoFocus
      />
    );
  }

  return (
    <div
      className={cn(
        "cursor-text text-xs w-full min-h-[28px] flex items-center px-0.5 rounded hover:bg-muted/50 transition-colors",
        bold ? "font-medium text-foreground" : "text-muted-foreground",
        !value && "italic text-muted-foreground/60",
      )}
      onClick={() => { setDraft(value ?? ""); setEditing(true); }}
    >
      {value || placeholder || "—"}
    </div>
  );
}

function DateCell({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  const commit = () => {
    setEditing(false);
    if (draft !== (value ?? "")) onChange(draft);
  };

  if (editing) {
    return (
      <Input
        type="date"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(value ?? ""); setEditing(false); }
        }}
        className="h-7 text-xs border-primary/50 px-2"
        autoFocus
      />
    );
  }

  const display = value
    ? new Date(value).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div
      className={cn(
        "cursor-text text-xs w-full min-h-[28px] flex items-center px-0.5 rounded hover:bg-muted/50 transition-colors",
        !display && "italic text-muted-foreground/60",
      )}
      onClick={() => { setDraft(value ?? ""); setEditing(true); }}
    >
      {display || "Set date…"}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TrackerPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  // Filters
  const [filterPrd, setFilterPrd] = useState<TrackerStatus | "all">("all");
  const [filterBrd, setFilterBrd] = useState<TrackerStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TrackerPriority | "all">("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: rows = [], isLoading } = useQuery<TrackerRow[]>({
    queryKey: ["tracker"],
    queryFn: apiList,
  });

  const createMutation = useMutation({
    mutationFn: apiCreate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tracker"] }),
    onError: () => toast({ title: "Failed to add row", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<TrackerRow> }) =>
      apiUpdate(id, body),
    onSuccess: (updated) => {
      qc.setQueryData<TrackerRow[]>(["tracker"], (old) =>
        old?.map((r) => (r.id === updated.id ? updated : r)) ?? [],
      );
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: apiDelete,
    onSuccess: (_, id) => {
      qc.setQueryData<TrackerRow[]>(["tracker"], (old) =>
        old?.filter((r) => r.id !== id) ?? [],
      );
    },
    onError: () => toast({ title: "Failed to delete row", variant: "destructive" }),
  });

  const handleUpdate = useCallback(
    (id: number, key: ColKey, value: string) => {
      updateMutation.mutate({ id, body: { [key]: value } });
    },
    [updateMutation],
  );

  const addRow = () => {
    createMutation.mutate({ feature: "New Feature" });
  };

  // Apply filters
  const filtered = rows.filter((r) => {
    if (filterPrd !== "all" && r.prdStatus !== filterPrd) return false;
    if (filterBrd !== "all" && r.brdStatus !== filterBrd) return false;
    if (filterPriority !== "all" && r.priority !== filterPriority) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      return (
        r.feature?.toLowerCase().includes(q) ||
        r.poc?.toLowerCase().includes(q) ||
        r.assignee?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeFilters =
    (filterPrd !== "all" ? 1 : 0) +
    (filterBrd !== "all" ? 1 : 0) +
    (filterPriority !== "all" ? 1 : 0);

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-serif font-semibold tracking-tight">Project Tracker</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track features, deliverables, and their statuses in one place.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
              className="gap-1.5"
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {activeFilters > 0 && (
                <span className="ml-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </Button>
            <Button size="sm" onClick={addRow} disabled={createMutation.isPending} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Row
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border bg-muted/30">
            <Input
              placeholder="Search feature, POC, assignee…"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="h-8 text-sm w-56"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">PRD:</span>
              <Select value={filterPrd} onValueChange={(v) => setFilterPrd(v as TrackerStatus | "all")}>
                <SelectTrigger className="h-8 text-xs w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">BRD:</span>
              <Select value={filterBrd} onValueChange={(v) => setFilterBrd(v as TrackerStatus | "all")}>
                <SelectTrigger className="h-8 text-xs w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Priority:</span>
              <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as TrackerPriority | "all")}>
                <SelectTrigger className="h-8 text-xs w-28">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 text-muted-foreground"
                onClick={() => { setFilterPrd("all"); setFilterBrd("all"); setFilterPriority("all"); setFilterSearch(""); }}
              >
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border overflow-auto shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-r border-primary-foreground/20 last:border-r-0",
                      col.width,
                    )}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-2 py-2.5 w-10 min-w-[40px]" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="py-16 text-center text-muted-foreground text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading…
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="py-16 text-center text-muted-foreground text-sm">
                    {rows.length === 0
                      ? "No rows yet — click \"Add Row\" to get started."
                      : "No rows match your filters."}
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-border/50 last:border-b-0 group transition-colors",
                      i % 2 === 0 ? "bg-background" : "bg-muted/20",
                      "hover:bg-primary/5",
                    )}
                  >
                    {/* Feature */}
                    <td className="px-3 py-2 border-r border-border/30">
                      <TextCell
                        value={row.feature}
                        onChange={(v) => handleUpdate(row.id, "feature", v)}
                        placeholder="Feature name"
                        bold
                      />
                    </td>
                    {/* Assignee */}
                    <td className="px-3 py-2 border-r border-border/30">
                      <TextCell
                        value={row.assignee}
                        onChange={(v) => handleUpdate(row.id, "assignee", v)}
                        placeholder="Assignee"
                      />
                    </td>
                    {/* POC */}
                    <td className="px-3 py-2 border-r border-border/30">
                      <TextCell
                        value={row.poc}
                        onChange={(v) => handleUpdate(row.id, "poc", v)}
                        placeholder="Point of contact"
                      />
                    </td>
                    {/* Deadline */}
                    <td className="px-3 py-2 border-r border-border/30">
                      <DateCell
                        value={row.deadline}
                        onChange={(v) => handleUpdate(row.id, "deadline", v)}
                      />
                    </td>
                    {/* Priority */}
                    <td className="px-3 py-2 border-r border-border/30">
                      <PriorityBadge
                        value={row.priority}
                        onChange={(v) => updateMutation.mutate({ id: row.id, body: { priority: v } })}
                      />
                    </td>
                    {/* PRD Status */}
                    <td className="px-3 py-2 border-r border-border/30">
                      <StatusBadge
                        value={row.prdStatus}
                        onChange={(v) => updateMutation.mutate({ id: row.id, body: { prdStatus: v } })}
                      />
                    </td>
                    {/* Figma Link */}
                    <td className="px-3 py-2 border-r border-border/30">
                      <LinkCell
                        value={row.figmaLink}
                        onChange={(v) => handleUpdate(row.id, "figmaLink", v)}
                        placeholder="https://figma.com/..."
                      />
                    </td>
                    {/* PRD Link */}
                    <td className="px-3 py-2 border-r border-border/30">
                      <LinkCell
                        value={row.prdLink}
                        onChange={(v) => handleUpdate(row.id, "prdLink", v)}
                      />
                    </td>
                    {/* BRD Status */}
                    <td className="px-3 py-2 border-r border-border/30">
                      <StatusBadge
                        value={row.brdStatus}
                        onChange={(v) => updateMutation.mutate({ id: row.id, body: { brdStatus: v } })}
                      />
                    </td>
                    {/* BRD Link */}
                    <td className="px-3 py-2 border-r border-border/30">
                      <LinkCell
                        value={row.brdLink}
                        onChange={(v) => handleUpdate(row.id, "brdLink", v)}
                      />
                    </td>
                    {/* Test Case Link */}
                    <td className="px-3 py-2 border-r border-border/30">
                      <LinkCell
                        value={row.testCaseLink}
                        onChange={(v) => handleUpdate(row.id, "testCaseLink", v)}
                      />
                    </td>
                    {/* Prototype */}
                    <td className="px-3 py-2 border-r border-border/30">
                      <LinkCell
                        value={row.prototype}
                        onChange={(v) => handleUpdate(row.id, "prototype", v)}
                      />
                    </td>
                    {/* Comment */}
                    <td className="px-3 py-2 border-r border-border/30">
                      <TextCell
                        value={row.comment}
                        onChange={(v) => handleUpdate(row.id, "comment", v)}
                        placeholder="Add a note…"
                      />
                    </td>
                    {/* Delete */}
                    <td className="px-2 py-2">
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(row.id)}
                        title="Delete row"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Add row footer */}
          {!isLoading && (
            <div
              className="px-3 py-2.5 border-t border-border/50 flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 cursor-pointer transition-colors text-sm"
              onClick={addRow}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="text-xs">Add row</span>
            </div>
          )}
        </div>

        {/* Summary */}
        {rows.length > 0 && (
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
            <span>{rows.length} total rows</span>
            <span>·</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {rows.filter((r) => r.prdStatus === "complete").length} PRDs complete
            </span>
            <span>·</span>
            <span className="text-blue-600 dark:text-blue-400">
              {rows.filter((r) => r.prdStatus === "working_on").length} in progress
            </span>
            <span>·</span>
            <span className="text-red-600 dark:text-red-400">
              {rows.filter((r) => r.prdStatus === "blocked").length} blocked
            </span>
            {filtered.length !== rows.length && (
              <>
                <span>·</span>
                <span>Showing {filtered.length} filtered</span>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
