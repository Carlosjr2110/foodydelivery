import { DELIVERY_DEADLINE_MIN, DEPARTURE_DEADLINE_MIN } from "../constants";

/**
 * Calcula o prazo (SLA) ativo de um pedido:
 * - RECEBIDO/EM_PREPARO: prazo para sair para entrega, contado da criação
 * - SAIU_PARA_ENTREGA: prazo para ser entregue, contado da última atualização
 * - ENTREGUE/CANCELADO: sem prazo ativo (já resolvido)
 */
export function getOrderSla(order) {
  const now = Date.now();

  if (order.status === "RECEBIDO" || order.status === "EM_PREPARO") {
    const deadline = new Date(order.createdAt).getTime() + DEPARTURE_DEADLINE_MIN * 60000;
    return { phase: "departure", late: now > deadline, deadline: new Date(deadline) };
  }

  if (order.status === "SAIU_PARA_ENTREGA") {
    const deadline = new Date(order.updatedAt).getTime() + DELIVERY_DEADLINE_MIN * 60000;
    return { phase: "delivery", late: now > deadline, deadline: new Date(deadline) };
  }

  return null;
}

// Orçamento total (criação → entrega) usado só para análise histórica de pedidos já finalizados
export const TOTAL_DEADLINE_MIN = DEPARTURE_DEADLINE_MIN + DELIVERY_DEADLINE_MIN;

/**
 * Indica se um pedido está (ou ficou) atrasado, incluindo pedidos já finalizados.
 * Para ENTREGUE, como não guardamos o instante exato de cada transição de status,
 * aproxima usando o tempo total decorrido (criação → última atualização).
 */
export function isOrderLate(order) {
  if (order.status === "CANCELADO") return false;

  if (order.status === "ENTREGUE") {
    const elapsedMin =
      (new Date(order.updatedAt).getTime() - new Date(order.createdAt).getTime()) / 60000;
    return elapsedMin > TOTAL_DEADLINE_MIN;
  }

  return getOrderSla(order)?.late ?? false;
}
