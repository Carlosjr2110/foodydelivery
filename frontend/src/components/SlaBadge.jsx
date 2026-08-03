import { getOrderSla } from "../utils/sla";
import { formatTime } from "../utils/format";

const LATE_LABEL = {
  departure: "Atrasado",
  delivery: "Entrega atrasada",
};

export default function SlaBadge({ order, onlyWarn = false }) {
  const sla = getOrderSla(order);
  if (!sla) return null;

  if (sla.late) {
    return <span className="sla-badge sla-badge-late">⚠ {LATE_LABEL[sla.phase]}</span>;
  }

  if (onlyWarn) return null;

  return <span className="sla-badge sla-badge-ontime">Prazo: {formatTime(sla.deadline)}</span>;
}
