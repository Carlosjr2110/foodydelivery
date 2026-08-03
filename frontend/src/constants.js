export const ORDER_STATUSES = [
  "RECEBIDO",
  "EM_PREPARO",
  "SAIU_PARA_ENTREGA",
  "ENTREGUE",
  "CANCELADO",
];

export const STATUS_LABELS = {
  RECEBIDO: "Recebido",
  EM_PREPARO: "Em preparo",
  SAIU_PARA_ENTREGA: "Saiu para entrega",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

// Fluxo natural do pedido: cada status aponta para o próximo passo
export const STATUS_NEXT = {
  RECEBIDO: "EM_PREPARO",
  EM_PREPARO: "SAIU_PARA_ENTREGA",
  SAIU_PARA_ENTREGA: "ENTREGUE",
};

export const STATUS_NEXT_ACTION = {
  RECEBIDO: "Preparar",
  EM_PREPARO: "Enviar",
  SAIU_PARA_ENTREGA: "Entregar",
};

export const ACTIVE_STATUSES = ["RECEBIDO", "EM_PREPARO", "SAIU_PARA_ENTREGA"];

// Etapas exibidas na timeline do pedido (CANCELADO é tratado à parte)
export const STATUS_STEPS = [
  "RECEBIDO",
  "EM_PREPARO",
  "SAIU_PARA_ENTREGA",
  "ENTREGUE",
];

// Prazos (minutos, contados a partir do horário relevante) usados para sinalizar atraso
export const DEPARTURE_DEADLINE_MIN = 45; // criação → SAIU_PARA_ENTREGA
export const DELIVERY_DEADLINE_MIN = 15; // SAIU_PARA_ENTREGA → ENTREGUE

export const VEHICLE_TYPES = ["MOTO", "CARRO", "BICICLETA", "A_PE"];

export const VEHICLE_LABELS = {
  MOTO: "Moto",
  CARRO: "Carro",
  BICICLETA: "Bicicleta",
  A_PE: "A pé",
};

export const VEHICLE_ICONS = {
  MOTO: "🛵",
  CARRO: "🚗",
  BICICLETA: "🚲",
  A_PE: "🚶",
};

export const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];
