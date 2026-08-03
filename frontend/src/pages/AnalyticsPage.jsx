import { useEffect, useMemo, useState } from "react";
import { listOrders } from "../api/orders";
import { formatCurrency } from "../utils/format";
import { addDays, daysBetween, formatDateLabel, toDateKey } from "../utils/dateFilter";
import { isOrderLate } from "../utils/sla";
import { useToast } from "../context/ToastContext";
import ColumnChart from "../components/charts/ColumnChart";
import BarList from "../components/charts/BarList";

const RANGE_OPTIONS = [7, 14, 30];
const MAX_CHART_DAYS = 60;

function dayLabel(dateKey) {
  const [, month, day] = dateKey.split("-");
  return `${day}/${month}`;
}

function summarize(list) {
  const lateEligible = list.filter((o) => o.status !== "CANCELADO");
  const lateCount = lateEligible.filter(isOrderLate).length;

  return [
    {
      label: "Recebido",
      value: list.filter((o) => o.status === "RECEBIDO").length,
      color: "#1d4ed8",
      icon: "📥",
    },
    {
      label: "Entregue",
      value: list.filter((o) => o.status === "ENTREGUE").length,
      color: "#047857",
      icon: "✅",
    },
    { label: "No prazo", value: lateEligible.length - lateCount, color: "#047857", icon: "⏱️" },
    {
      label: "Em atraso",
      value: lateCount,
      color: "var(--danger)",
      icon: "⚠️",
      alert: lateCount > 0,
    },
  ];
}

export default function AnalyticsPage() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = useMemo(() => toDateKey(new Date()), []);
  const [preset, setPreset] = useState(7);
  const [customStart, setCustomStart] = useState(() => addDays(today, -6));
  const [customEnd, setCustomEnd] = useState(today);

  useEffect(() => {
    listOrders()
      .then(setOrders)
      .catch(() => toast.error("Não foi possível carregar os dados de análise"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { rangeStartKey, rangeEndKey } = useMemo(() => {
    if (preset === "custom") {
      return customStart <= customEnd
        ? { rangeStartKey: customStart, rangeEndKey: customEnd }
        : { rangeStartKey: customEnd, rangeEndKey: customStart };
    }
    return { rangeStartKey: addDays(today, -(preset - 1)), rangeEndKey: today };
  }, [preset, customStart, customEnd, today]);

  // O card da direita foca num dia específico; ao trocar de período, volta para o dia mais recente
  const [selectedDayKey, setSelectedDayKey] = useState(rangeEndKey);
  useEffect(() => {
    setSelectedDayKey(rangeEndKey);
  }, [rangeEndKey]);

  const ranged = useMemo(
    () =>
      orders.filter((o) => {
        const key = toDateKey(o.createdAt);
        return key >= rangeStartKey && key <= rangeEndKey;
      }),
    [orders, rangeStartKey, rangeEndKey]
  );

  const kpis = useMemo(() => {
    const delivered = ranged.filter((o) => o.status === "ENTREGUE");
    const cancelled = ranged.filter((o) => o.status === "CANCELADO");
    const revenue = delivered.reduce((sum, o) => sum + (o.total ?? 0), 0);
    const lateEligible = ranged.filter((o) => o.status !== "CANCELADO");
    const lateCount = lateEligible.filter(isOrderLate).length;

    const deliveryMinutes = delivered.map(
      (o) => (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()) / 60000
    );
    const avgDeliveryMin = deliveryMinutes.length
      ? deliveryMinutes.reduce((a, b) => a + b, 0) / deliveryMinutes.length
      : 0;

    return {
      total: ranged.length,
      revenue,
      avgTicket: delivered.length ? revenue / delivered.length : 0,
      cancelledCount: cancelled.length,
      lateRate: lateEligible.length ? (lateCount / lateEligible.length) * 100 : 0,
      lateCount,
      onTimeCount: lateEligible.length - lateCount,
      avgDeliveryMin,
    };
  }, [ranged]);

  const dailySeries = useMemo(() => {
    const counts = {};
    for (const order of ranged) {
      const key = toDateKey(order.createdAt);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    // Limita o gráfico aos últimos MAX_CHART_DAYS do período, para não estourar em ranges muito longos
    const totalDays = daysBetween(rangeStartKey, rangeEndKey);
    const displayDays = Math.min(totalDays, MAX_CHART_DAYS);
    const seriesStartKey = addDays(rangeEndKey, -(displayDays - 1));

    const days = [];
    for (let i = 0; i < displayDays; i++) {
      const key = addDays(seriesStartKey, i);
      days.push({ key, label: dayLabel(key), value: counts[key] ?? 0 });
    }
    return days;
  }, [ranged, rangeStartKey, rangeEndKey]);

  const courierBreakdown = useMemo(() => {
    const counts = {};
    for (const order of ranged) {
      if (!order.courierName) continue;
      counts[order.courierName] = (counts[order.courierName] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value, color: "var(--accent)" }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [ranged]);

  const periodLabel =
    preset === "custom" ? `${dayLabel(rangeStartKey)} até ${dayLabel(rangeEndKey)}` : `${preset} dias`;

  const periodSummary = useMemo(() => summarize(ranged), [ranged]);

  const daySummary = useMemo(
    () => summarize(ranged.filter((o) => toDateKey(o.createdAt) === selectedDayKey)),
    [ranged, selectedDayKey]
  );

  if (loading) {
    return (
      <div className="page page-wide">
        <div className="page-loading">
          <div className="spinner" />
          <p>Carregando análise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1>Análise</h1>
          <p className="page-subtitle">Visão geral de pedidos, prazos e entregadores</p>
        </div>
        <div className="range-controls">
          <div className="range-chips">
            {RANGE_OPTIONS.map((days) => (
              <button
                key={days}
                type="button"
                className={`btn btn-sm ${preset === days ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setPreset(days)}
              >
                {days} dias
              </button>
            ))}
            <button
              type="button"
              className={`btn btn-sm ${preset === "custom" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setPreset("custom")}
            >
              Personalizado
            </button>
          </div>
          {preset === "custom" && (
            <div className="range-custom">
              <input
                type="date"
                className="range-custom-input"
                value={customStart}
                max={today}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <span className="range-custom-sep">até</span>
              <input
                type="date"
                className="range-custom-input"
                value={customEnd}
                max={today}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total de pedidos</span>
          <span className="stat-value">{kpis.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Faturamento</span>
          <span className="stat-value stat-value-ENTREGUE">{formatCurrency(kpis.revenue)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Ticket médio</span>
          <span className="stat-value">{formatCurrency(kpis.avgTicket)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Tempo médio entrega</span>
          <span className="stat-value">
            {kpis.avgDeliveryMin ? `${Math.round(kpis.avgDeliveryMin)} min` : "—"}
          </span>
        </div>
        <div className={`stat-card ${kpis.lateRate > 0 ? "stat-card-alert" : ""}`}>
          <span className="stat-label">Taxa de atraso</span>
          <span className="stat-value stat-value-late">{kpis.lateRate.toFixed(0)}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Cancelados</span>
          <span className="stat-value stat-value-CANCELADO">{kpis.cancelledCount}</span>
        </div>
      </div>

      <div className="analytics-grid">
        <section className="detail-card analytics-span-2">
          <h2>Pedidos por dia</h2>
          <ColumnChart data={dailySeries} selectedKey={selectedDayKey} onSelect={setSelectedDayKey} />
        </section>

        <section className="detail-card">
          <h2>Período: {periodLabel}</h2>
          <BarList data={periodSummary} />
        </section>

        <section className="detail-card">
          <h2>Dia: {formatDateLabel(selectedDayKey)}</h2>
          <BarList data={daySummary} />
        </section>

        <section className="detail-card analytics-span-2">
          <h2>Top entregadores</h2>
          <BarList data={courierBreakdown} emptyLabel="Nenhum pedido atribuído no período" />
        </section>
      </div>
    </div>
  );
}
