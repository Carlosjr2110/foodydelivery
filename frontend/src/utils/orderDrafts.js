const STORAGE_KEY = "delivery:new-order-drafts";

export const EMPTY_ITEM = { name: "", quantity: 1, unitPrice: "" };

export function makeDraftId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createEmptyDraft() {
  return {
    id: makeDraftId(),
    customerName: "",
    customerPhone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    linkedCustomerId: null,
    items: [{ ...EMPTY_ITEM }],
  };
}

export function loadDraftState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.drafts) && parsed.drafts.length > 0) {
        // completa campos que podem faltar em rascunhos salvos por uma versão anterior
        const empty = createEmptyDraft();
        parsed.drafts = parsed.drafts.map((d) => ({ ...empty, ...d, id: d.id }));
        return parsed;
      }
    }
  } catch {
    // ignora dados corrompidos e começa do zero
  }
  const draft = createEmptyDraft();
  return { drafts: [draft], activeId: draft.id };
}

export function saveDraftState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // armazenamento indisponível (modo privado, quota etc.) — ignora
  }
}

export function isDraftEmpty(draft) {
  return (
    draft.customerName.trim() === "" &&
    draft.customerPhone.trim() === "" &&
    draft.cep.trim() === "" &&
    draft.street.trim() === "" &&
    draft.number.trim() === "" &&
    draft.neighborhood.trim() === "" &&
    draft.city.trim() === "" &&
    draft.items.every((item) => item.name.trim() === "" && item.unitPrice === "")
  );
}
