import { useEffect, useState } from "react";
import { listCouriers } from "../api/couriers";
import { VEHICLE_ICONS } from "../constants";
import { firstName } from "../utils/format";
import Modal from "./Modal";

export default function AssignCourierModal({ orderId, onClose, onConfirm }) {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courierId, setCourierId] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    listCouriers()
      .then(setCouriers)
      .finally(() => setLoading(false));
  }, []);

  async function handleConfirm() {
    if (!courierId) return;
    setConfirming(true);
    try {
      await onConfirm(Number(courierId));
    } finally {
      setConfirming(false);
    }
  }

  return (
    <Modal onClose={onClose} className="modal-panel-sm">
      <div className="confirm-dialog">
        <h2>Atribuir entregador</h2>
        <p className="confirm-dialog-message">
          O pedido #{orderId} precisa de um entregador antes de sair para entrega.
        </p>

        {loading ? (
          <p className="empty-state-inline">Carregando entregadores...</p>
        ) : couriers.length === 0 ? (
          <p className="empty-state-inline">
            Nenhum entregador cadastrado. Cadastre um em "Entregadores" antes de continuar.
          </p>
        ) : (
          <select
            className="assign-courier-select"
            value={courierId}
            onChange={(e) => setCourierId(e.target.value)}
          >
            <option value="" disabled>
              Selecione um entregador
            </option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {VEHICLE_ICONS[c.vehicleType]} {firstName(c.name)}
              </option>
            ))}
          </select>
        )}

        <div className="confirm-dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!courierId || confirming}
          >
            {confirming ? "Enviando..." : "Atribuir e enviar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
