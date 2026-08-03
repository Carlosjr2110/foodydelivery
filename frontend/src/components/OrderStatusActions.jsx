import { useState } from "react";
import { STATUS_NEXT, STATUS_NEXT_ACTION } from "../constants";
import { useConfirm } from "../context/ConfirmContext";
import AssignCourierModal from "./AssignCourierModal";

export default function OrderStatusActions({
  order,
  onUpdateStatus,
  onAssignCourier,
  updating,
  size = "sm",
  stacked = false,
}) {
  const confirm = useConfirm();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const nextStatus = STATUS_NEXT[order.status];
  const isFinal = order.status === "ENTREGUE" || order.status === "CANCELADO";

  if (isFinal) return null;

  // Sair para entrega exige um entregador atribuído antes de avançar o status
  const requiresCourier = order.status === "EM_PREPARO" && !order.courierId;

  function handleNext() {
    if (requiresCourier) {
      setShowAssignModal(true);
      return;
    }
    onUpdateStatus(order.id, nextStatus);
  }

  async function handleAssignAndSend(courierId) {
    const success = await onAssignCourier(order.id, courierId);
    if (success) {
      onUpdateStatus(order.id, nextStatus);
      setShowAssignModal(false);
    }
  }

  async function handleCancel() {
    const confirmed = await confirm(
      `Cancelar o pedido #${order.id}? Essa ação não pode ser desfeita.`,
      { confirmLabel: "Cancelar pedido", cancelLabel: "Voltar", danger: true }
    );
    if (confirmed) {
      onUpdateStatus(order.id, "CANCELADO");
    }
  }

  const sizeClass = size === "xs" ? "btn-xs" : size === "sm" ? "btn-sm" : "";

  return (
    <div className={`order-actions ${stacked ? "order-actions-stacked" : ""}`}>
      {nextStatus && (
        <button
          className={`btn btn-primary ${sizeClass}`}
          onClick={handleNext}
          disabled={updating}
        >
          {STATUS_NEXT_ACTION[order.status]}
        </button>
      )}
      <button
        className={`btn btn-ghost btn-danger-ghost ${sizeClass}`}
        onClick={handleCancel}
        disabled={updating}
      >
        Cancelar
      </button>

      {showAssignModal && (
        <AssignCourierModal
          orderId={order.id}
          onClose={() => setShowAssignModal(false)}
          onConfirm={handleAssignAndSend}
        />
      )}
    </div>
  );
}
