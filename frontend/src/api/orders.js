import api from "./client";

export function listOrders() {
  return api.get("/orders").then((res) => res.data);
}

export function getOrder(id) {
  return api.get(`/orders/${id}`).then((res) => res.data);
}

export function createOrder(order) {
  return api.post("/orders", order).then((res) => res.data);
}

export function updateOrderStatus(id, status) {
  return api.patch(`/orders/${id}/status`, { status }).then((res) => res.data);
}

export function assignCourier(id, courierId) {
  return api.patch(`/orders/${id}/courier`, { courierId }).then((res) => res.data);
}
