import api from "./client";

export function listCustomers() {
  return api.get("/customers").then((res) => res.data);
}

export function createCustomer(customer) {
  return api.post("/customers", customer).then((res) => res.data);
}

export function updateCustomer(id, customer) {
  return api.put(`/customers/${id}`, customer).then((res) => res.data);
}

export function deleteCustomer(id) {
  return api.delete(`/customers/${id}`).then((res) => res.data);
}
