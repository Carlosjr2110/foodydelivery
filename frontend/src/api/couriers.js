import api from "./client";

export function listCouriers() {
  return api.get("/couriers").then((res) => res.data);
}

export function createCourier(courier) {
  return api.post("/couriers", courier).then((res) => res.data);
}

export function updateCourier(id, courier) {
  return api.put(`/couriers/${id}`, courier).then((res) => res.data);
}

export function deleteCourier(id) {
  return api.delete(`/couriers/${id}`).then((res) => res.data);
}
