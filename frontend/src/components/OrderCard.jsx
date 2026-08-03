import { VEHICLE_ICONS } from "../constants";
import { firstName, formatCurrency, formatTime } from "../utils/format";
import SlaBadge from "./SlaBadge";
import OrderStatusActions from "./OrderStatusActions";

export default function OrderCard({ order, onUpdateStatus, onAssignCourier, updating, onOpenDetails }) {
  const [firstItem, ...restItems] = order.items;

  function handleOpen() {
    onOpenDetails(order);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpen();
    }
  }

  return (
    <div
      className="order-card"
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
    >
      <div className="order-card-header">
        <div className="order-card-id-time">
          <span className="order-id-link">#{order.id}</span>
          <span className="order-card-time">{formatTime(order.createdAt)}</span>
        </div>
        <SlaBadge order={order} onlyWarn />
      </div>
      <p className="order-customer">{order.customerName.split(" ").slice(0, 2).join(" ")}</p>
      <p className="order-address" title={order.deliveryAddress}>
        📍 {order.deliveryAddress}
      </p>
      <ul className="order-items-mini">
        <li>
          {firstItem.quantity}x {firstItem.name}
        </li>
        {restItems.length > 0 && <li className="order-items-more">+{restItems.length}</li>}
      </ul>
      <p className="order-meta order-courier-meta">
        {order.courierId
          ? `${VEHICLE_ICONS[order.courierVehicleType]} ${firstName(order.courierName)}`
          : " "}
      </p>
      <div className="order-card-footer">
        <span className="order-total">{formatCurrency(order.total)}</span>
        <span className="order-details-link">Detalhes</span>
      </div>
      <div className="order-actions-slot" onClick={(e) => e.stopPropagation()}>
        <OrderStatusActions
          order={order}
          onUpdateStatus={onUpdateStatus}
          onAssignCourier={onAssignCourier}
          updating={updating}
          size="xs"
          stacked
        />
      </div>
    </div>
  );
}
