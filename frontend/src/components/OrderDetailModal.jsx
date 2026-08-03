import { useEffect, useState } from "react";
import { listCouriers } from "../api/couriers";
import { STATUS_LABELS, STATUS_STEPS, VEHICLE_ICONS } from "../constants";
import { firstName, formatCurrency, formatDateTime, formatTime } from "../utils/format";
import StatusBadge from "./StatusBadge";
import SlaBadge from "./SlaBadge";
import OrderStatusActions from "./OrderStatusActions";
import Modal from "./Modal";

const SLA_TICK_MS = 30000;

const STEP_TIMESTAMP_FIELD = {
  RECEBIDO: "createdAt",
  EM_PREPARO: "preparingAt",
  SAIU_PARA_ENTREGA: "dispatchedAt",
  ENTREGUE: "deliveredAt",
};

export default function OrderDetailModal({ order, onClose, onUpdateStatus, onAssignCourier, updating }) {
  // Recalcula o indicador de prazo periodicamente, mesmo sem novos dados do servidor
  const [, forceTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), SLA_TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const [couriers, setCouriers] = useState([]);
  useEffect(() => {
    listCouriers()
      .then(setCouriers)
      .catch(() => setCouriers([]));
  }, []);

  const isCanceled = order.status === "CANCELADO";
  const isDelivered = order.status === "ENTREGUE";
  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <Modal onClose={onClose} className="modal-panel-lg">
      <div className="detail-modal-header">
        <div>
          <h1>Pedido #{order.id}</h1>
          <p className="page-subtitle">Criado em {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="order-card-badges">
          <SlaBadge order={order} />
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <section className="detail-card">
            <h2>Rastreamento</h2>
            {isCanceled ? (
              <div className="canceled-banner">
                <strong>Pedido cancelado</strong>
                <span>em {formatDateTime(order.updatedAt)}</span>
              </div>
            ) : (
              <ol className="status-stepper">
                {STATUS_STEPS.map((step, index) => {
                  const state =
                    index < currentStep ? "done" : index === currentStep ? "current" : "pending";
                  const isDelivered = step === "ENTREGUE" && order.status === "ENTREGUE";
                  const stepTime = order[STEP_TIMESTAMP_FIELD[step]];
                  return (
                    <li
                      key={step}
                      className={`step step-${state} ${isDelivered ? "step-delivered" : ""}`}
                    >
                      <span className="step-dot">
                        {index < currentStep || isDelivered ? "✓" : ""}
                      </span>
                      <span className="step-label">{STATUS_LABELS[step]}</span>
                      {state !== "pending" && stepTime && (
                        <span className="step-time">{formatTime(stepTime)}</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
            <p className="detail-updated">
              Última atualização: {formatDateTime(order.updatedAt)}
            </p>
            <OrderStatusActions
              order={order}
              onUpdateStatus={onUpdateStatus}
              onAssignCourier={onAssignCourier}
              updating={updating}
              size="md"
            />
          </section>

          <section className="detail-card">
            <h2>Itens do pedido</h2>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="num">Qtd</th>
                  <th className="num">Preço unit.</th>
                  <th className="num">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td className="num">{item.quantity}</td>
                    <td className="num">{formatCurrency(item.unitPrice)}</td>
                    <td className="num">{formatCurrency(item.unitPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>Total</td>
                  <td className="num order-total">{formatCurrency(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </section>
        </div>

        <aside className="detail-side">
          <section className="detail-card">
            <h2>Entrega</h2>
            <p className="detail-field-label">Cliente</p>
            <p className="detail-field-value">{order.customerName}</p>
            {order.customerPhone && (
              <>
                <p className="detail-field-label">Telefone</p>
                <p className="detail-field-value">📞 {order.customerPhone}</p>
              </>
            )}
            <p className="detail-field-label">Endereço</p>
            <p className="detail-field-value">📍 {order.deliveryAddress}</p>
          </section>

          <section className="detail-card">
            <h2>Entregador</h2>
            {order.courierId ? (
              <p className="detail-field-value">
                {VEHICLE_ICONS[order.courierVehicleType]} {firstName(order.courierName)}
              </p>
            ) : (
              <p className="empty-state-inline">Nenhum entregador atribuído</p>
            )}
            {!isDelivered && (
              <label className="courier-select-label">
                Atribuir entregador
                <select
                  value={order.courierId ?? ""}
                  onChange={(e) =>
                    onAssignCourier(order.id, e.target.value ? Number(e.target.value) : null)
                  }
                  disabled={updating}
                >
                  <option value="">Não atribuído</option>
                  {couriers.map((courier) => (
                    <option key={courier.id} value={courier.id}>
                      {VEHICLE_ICONS[courier.vehicleType]} {firstName(courier.name)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </section>
        </aside>
      </div>
    </Modal>
  );
}
