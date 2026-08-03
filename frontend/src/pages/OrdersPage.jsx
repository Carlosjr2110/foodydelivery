import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { assignCourier, listOrders, updateOrderStatus } from "../api/orders";
import { ORDER_STATUSES, STATUS_LABELS } from "../constants";
import { formatTime } from "../utils/format";
import { addDays, formatDateLabel, isToday, toDateKey } from "../utils/dateFilter";
import { useToast } from "../context/ToastContext";
import { getOrderSla } from "../utils/sla";
import OrderCard from "../components/OrderCard";
import OrderDetailModal from "../components/OrderDetailModal";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon, XIcon } from "../components/icons";

const REFRESH_INTERVAL_MS = 20000;

export default function OrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [updatingId, setUpdatingId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [detailOrderId, setDetailOrderId] = useState(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await listOrders();
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(data);
      setLastUpdated(new Date());
      setError("");
    } catch {
      if (!silent) setError("Não foi possível carregar os pedidos");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Polling: mantém o painel atualizado sem o usuário precisar recarregar
  const fetchRef = useRef(fetchOrders);
  fetchRef.current = fetchOrders;
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchRef.current(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function handleStatusChange(id, status) {
    const previous = orders;
    setUpdatingId(id);
    setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await updateOrderStatus(id, status);
      toast.success(
        status === "CANCELADO"
          ? `Pedido #${id} cancelado`
          : `Pedido #${id} atualizado para "${STATUS_LABELS[status]}"`
      );
    } catch {
      setOrders(previous);
      toast.error("Não foi possível atualizar o status do pedido");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleAssignCourier(id, courierId) {
    setUpdatingId(id);
    try {
      const updated = await assignCourier(id, courierId);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      toast.success(
        courierId
          ? `Entregador atribuído ao pedido #${id}`
          : `Entregador removido do pedido #${id}`
      );
      return true;
    } catch {
      toast.error("Não foi possível atribuir o entregador");
      return false;
    } finally {
      setUpdatingId(null);
    }
  }

  // O painel mostra apenas os pedidos do dia selecionado (hoje por padrão)
  const dayOrders = useMemo(
    () => orders.filter((order) => toDateKey(order.createdAt) === selectedDate),
    [orders, selectedDate]
  );

  const statusCounts = useMemo(() => {
    const counts = {};
    for (const order of dayOrders) {
      counts[order.status] = (counts[order.status] ?? 0) + 1;
    }
    return counts;
  }, [dayOrders]);

  const lateCount = useMemo(
    () => dayOrders.filter((order) => getOrderSla(order)?.late).length,
    [dayOrders]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return dayOrders;
    // Com busca ativa, procura em todos os pedidos, não só no dia selecionado
    return orders.filter(
      (order) =>
        String(order.id) === term.replace("#", "") ||
        order.customerName.toLowerCase().includes(term) ||
        order.deliveryAddress.toLowerCase().includes(term) ||
        order.items.some((item) => item.name.toLowerCase().includes(term))
    );
  }, [orders, dayOrders, search]);

  const columns = useMemo(() => {
    const grouped = {};
    for (const status of ORDER_STATUSES) grouped[status] = [];
    for (const order of filtered) {
      grouped[order.status]?.push(order);
    }
    return grouped;
  }, [filtered]);

  const detailOrder = orders.find((o) => o.id === detailOrderId) ?? null;

  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1>Painel de pedidos</h1>
          {lastUpdated && (
            <p className="page-subtitle">Última atualização às {formatTime(lastUpdated)}</p>
          )}
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => fetchOrders(true)}
            title="Atualizar agora"
          >
            ↻ Atualizar
          </button>
        </div>
      </div>

      <div className="date-nav">
        <button
          type="button"
          className="date-nav-arrow"
          onClick={() => setSelectedDate((d) => addDays(d, -1))}
          aria-label="Dia anterior"
          title="Dia anterior"
        >
          <ChevronLeftIcon />
        </button>
        <div className="date-nav-current">
          <CalendarIcon className="input-icon" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <span className="date-nav-label">{formatDateLabel(selectedDate)}</span>
        </div>
        <button
          type="button"
          className="date-nav-arrow"
          onClick={() => setSelectedDate((d) => addDays(d, 1))}
          aria-label="Próximo dia"
          title="Próximo dia"
        >
          <ChevronRightIcon />
        </button>
        {!isToday(selectedDate) && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setSelectedDate(toDateKey(new Date()))}
          >
            Hoje
          </button>
        )}
      </div>

      <div className="stats-grid">
        {ORDER_STATUSES.map((status) => (
          <div className="stat-card" key={status}>
            <span className="stat-label">{STATUS_LABELS[status]}</span>
            <span className={`stat-value stat-value-${status}`}>
              {statusCounts[status] ?? 0}
            </span>
          </div>
        ))}
        <div className={`stat-card ${lateCount > 0 ? "stat-card-alert" : ""}`}>
          <span className="stat-label">Atrasados</span>
          <span className="stat-value stat-value-late">{lateCount}</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="input-group search-group">
          <SearchIcon className="input-icon" />
          <input
            type="search"
            className="search-input"
            placeholder="Buscar por nº, cliente, endereço ou item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setSearch("")}
              aria-label="Limpar busca"
              title="Limpar busca"
            >
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="page-loading">
          <div className="spinner" />
          <p>Carregando pedidos...</p>
        </div>
      ) : !search.trim() && dayOrders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <p>
            {isToday(selectedDate)
              ? "Nenhum pedido recebido hoje ainda."
              : `Nenhum pedido em ${formatDateLabel(selectedDate)}.`}
          </p>
          {isToday(selectedDate) && (
            <Link to="/orders/new" className="btn btn-primary">
              Criar o primeiro pedido
            </Link>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <p>Nenhum pedido encontrado com essa busca.</p>
        </div>
      ) : (
        <div className="board">
          {ORDER_STATUSES.map((status) => (
            <div className="board-column" key={status}>
              <div className="board-column-header">
                <span className={`board-column-dot board-column-dot-${status}`} />
                <span className="board-column-title">{STATUS_LABELS[status]}</span>
                <span className="board-column-count">{columns[status].length}</span>
              </div>
              <div className="board-column-body">
                {columns[status].length === 0 ? (
                  <p className="board-column-empty">Nenhum pedido</p>
                ) : (
                  columns[status].map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={handleStatusChange}
                      onAssignCourier={handleAssignCourier}
                      updating={updatingId === order.id}
                      onOpenDetails={(o) => setDetailOrderId(o.id)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrderId(null)}
          onUpdateStatus={handleStatusChange}
          onAssignCourier={handleAssignCourier}
          updating={updatingId === detailOrder.id}
        />
      )}
    </div>
  );
}
