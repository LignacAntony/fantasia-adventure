"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Cpu,
  DollarSign,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminUsage } from "@/lib/api";
import type { AdminUsageResponse, TypeStats } from "@/lib/api";

// ─── Helpers ────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: decimals });
}

function fmtCost(usd: number): string {
  if (usd < 0.001) return "< $0.001";
  return `$${usd.toFixed(4)}`;
}

function fmtDate(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "text-white",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">
            {label}
          </p>
          <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-white/40">{sub}</p>}
        </div>
        <Icon className="size-5 text-white/20" />
      </div>
    </div>
  );
}

function TypeRow({
  label,
  stats,
  color,
}: {
  label: string;
  stats: TypeStats;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-white/5 bg-white/3 px-4 py-3">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="w-24 text-sm font-medium text-white/70">{label}</span>
      <span className="w-16 text-right text-sm tabular-nums text-white/60">
        {fmt(stats.calls)} appels
      </span>
      <span className="flex-1 text-right text-sm tabular-nums text-white/60">
        {fmt(stats.totalTokens)} tokens
      </span>
      <span className="w-20 text-right text-sm tabular-nums text-amber-400">
        {fmtCost(stats.costUsd)}
      </span>
    </div>
  );
}

type OrgBucketResult = {
  model: string;
  input_tokens: number;
  output_tokens: number;
  num_model_requests: number;
};

type OrgBucket = {
  start_time_iso: string;
  results: OrgBucketResult[];
};

function OrgUsageSection({ buckets }: { buckets: OrgBucket[] | null }) {
  if (!buckets || buckets.length === 0) {
    return (
      <p className="text-center text-xs text-white/30">
        Aucune donnée org OpenAI disponible. Vérifie que ta clé{" "}
        <code className="rounded bg-white/10 px-1 py-0.5">
          OPENAI_ADMIN_KEY
        </code>{" "}
        appartient bien à la même organisation que la clé projet.
      </p>
    );
  }

  // Aggregate by model across all buckets
  const byModel = new Map<
    string,
    { requests: number; input: number; output: number }
  >();
  for (const bucket of buckets) {
    for (const r of bucket.results) {
      const existing = byModel.get(r.model) ?? {
        requests: 0,
        input: 0,
        output: 0,
      };
      byModel.set(r.model, {
        requests: existing.requests + r.num_model_requests,
        input: existing.input + r.input_tokens,
        output: existing.output + r.output_tokens,
      });
    }
  }

  const rows = [...byModel.entries()].sort(
    (a, b) => b[1].requests - a[1].requests,
  );
  const hasData = rows.length > 0;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
        OpenAI Organisation (30 derniers jours)
      </h2>
      {!hasData ? (
        <p className="text-center text-xs text-white/30">
          Aucune complétion enregistrée sur cette période.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs text-white/40">
                <th className="px-4 py-2 font-medium">Modèle</th>
                <th className="px-4 py-2 text-right font-medium">Appels</th>
                <th className="px-4 py-2 text-right font-medium">Tokens in</th>
                <th className="px-4 py-2 text-right font-medium">Tokens out</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([model, stats]) => (
                <tr
                  key={model}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="px-4 py-2 font-mono text-xs text-white/60">
                    {model}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-white/60">
                    {fmt(stats.requests)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-white/60">
                    {fmt(stats.input)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-white/60">
                    {fmt(stats.output)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await getAdminUsage();
      setData(res);
    } catch {
      setError("Impossible de charger les stats.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const local = data?.local;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="text-white/50 hover:text-white"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Monitoring IA</h1>
              <p className="text-xs text-white/40">
                Depuis le démarrage du serveur
                {local?.trackingSince
                  ? ` · ${fmtDate(local.trackingSince)}`
                  : ""}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="gap-2 text-white/50 hover:text-white"
          >
            <RefreshCw
              className={`size-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Rafraîchir
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20 text-white/30">
            Chargement…
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {local && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard
                label="Appels totaux"
                value={fmt(local.totalCalls)}
                icon={Activity}
              />
              <StatCard
                label="Tokens totaux"
                value={fmt(local.totalTokens)}
                sub={`${fmt(local.totalPromptTokens)} in · ${fmt(local.totalCompletionTokens)} out`}
                icon={Cpu}
              />
              <StatCard
                label="Coût estimé"
                value={fmtCost(local.estimatedCostUsd)}
                sub="gpt-4o-mini"
                icon={DollarSign}
                color="text-amber-400"
              />
              <StatCard
                label="Narrations"
                value={fmt(local.byType.narration.calls)}
                sub={`+ ${fmt(local.byType.epilogue.calls)} épilogues`}
                icon={Zap}
              />
            </div>

            {/* Breakdown by type */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
                Par type d&apos;appel
              </h2>
              <TypeRow
                label="Narration"
                stats={local.byType.narration}
                color="bg-purple-400"
              />
              <TypeRow
                label="Épilogue"
                stats={local.byType.epilogue}
                color="bg-amber-400"
              />
            </div>

            {/* Recent calls */}
            {local.recentCalls.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
                  Derniers appels
                </h2>
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-left text-xs text-white/40">
                        <th className="px-4 py-2 font-medium">Heure</th>
                        <th className="px-4 py-2 font-medium">Type</th>
                        <th className="px-4 py-2 font-medium">Modèle</th>
                        <th className="px-4 py-2 text-right font-medium">
                          Tokens in
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Tokens out
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Coût
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {local.recentCalls.map((call, i) => (
                        <tr
                          key={i}
                          className="border-b border-white/5 last:border-0 hover:bg-white/3"
                        >
                          <td className="px-4 py-2 tabular-nums text-white/50">
                            {fmtTime(call.timestamp)}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                call.type === "epilogue"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-purple-500/20 text-purple-400"
                              }`}
                            >
                              {call.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-white/40">
                            {call.model}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-white/60">
                            {fmt(call.promptTokens)}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-white/60">
                            {fmt(call.completionTokens)}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-amber-400/80">
                            {fmtCost(call.costUsd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* OpenAI org data — shown only if admin key is set */}
            {data?.hasAdminKey && (
              <OrgUsageSection
                buckets={data.openaiUsage as OrgBucket[] | null}
              />
            )}

            {data && !data.hasAdminKey && (
              <p className="text-center text-xs text-white/30">
                Ajoute{" "}
                <code className="rounded bg-white/10 px-1 py-0.5">
                  OPENAI_ADMIN_KEY
                </code>{" "}
                dans{" "}
                <code className="rounded bg-white/10 px-1 py-0.5">
                  .env.local
                </code>{" "}
                pour voir les données org OpenAI.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
