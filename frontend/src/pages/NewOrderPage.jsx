import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createOrder } from "../api/orders";
import { createCustomer, listCustomers } from "../api/customers";
import { formatCepInput, formatCurrency, formatPhoneInput, onlyDigits } from "../utils/format";
import { lookupCep } from "../utils/cep";
import { buildAddressString, isAddressValid } from "../utils/address";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import { BR_STATES } from "../constants";
import {
  EMPTY_ITEM,
  createEmptyDraft,
  isDraftEmpty,
  loadDraftState,
  saveDraftState,
} from "../utils/orderDrafts";
import { PhoneIcon, PlusIcon, XIcon } from "../components/icons";

function matchCustomers(customers, query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const qDigits = onlyDigits(query);
  return customers
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (qDigits.length >= 3 && onlyDigits(c.phone).includes(qDigits))
    )
    .slice(0, 6);
}

function isDraftValid(draft) {
  return (
    draft.customerName.trim().length >= 2 &&
    onlyDigits(draft.customerPhone).length >= 10 &&
    onlyDigits(draft.cep).length === 8 &&
    draft.street.trim() !== "" &&
    draft.number.trim() !== "" &&
    draft.neighborhood.trim() !== "" &&
    draft.city.trim() !== "" &&
    draft.state.trim() !== "" &&
    draft.items.length > 0 &&
    draft.items.every(
      (item) => item.name.trim() !== "" && Number(item.quantity) >= 1 && Number(item.unitPrice) > 0
    )
  );
}

function draftTotal(draft) {
  return draft.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
}

export default function NewOrderPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [{ drafts, activeId }, setState] = useState(loadDraftState);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cepStatus, setCepStatus] = useState({});
  const [customers, setCustomers] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null); // "phone" | null
  const [savingCustomer, setSavingCustomer] = useState(false);

  useEffect(() => {
    saveDraftState({ drafts, activeId });
  }, [drafts, activeId]);

  useEffect(() => {
    listCustomers()
      .then(setCustomers)
      .catch(() => {
        // busca de clientes é um atalho opcional; sem ela o usuário ainda preenche manualmente
      });
  }, []);

  const activeIndex = drafts.findIndex((d) => d.id === activeId);
  const activeDraft = drafts[activeIndex] ?? drafts[0];

  function patchDraft(id, patch) {
    setState((prev) => ({
      ...prev,
      drafts: prev.drafts.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
  }

  function updateItem(index, field, value) {
    const items = activeDraft.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    patchDraft(activeDraft.id, { items });
  }

  function selectCustomer(customer) {
    patchDraft(activeDraft.id, {
      customerName: customer.name,
      customerPhone: customer.phone,
      cep: customer.cep ? formatCepInput(customer.cep) : activeDraft.cep,
      street: customer.street || activeDraft.street,
      number: customer.number || activeDraft.number,
      complement: customer.complement || activeDraft.complement,
      neighborhood: customer.neighborhood || activeDraft.neighborhood,
      city: customer.city || activeDraft.city,
      state: customer.state || activeDraft.state,
      linkedCustomerId: customer.id,
    });
    setActiveDropdown(null);
    toast.success(`Dados de "${customer.name}" preenchidos automaticamente`);
  }

  // Busca de cliente é feita só pelo telefone: se bater exatamente com um cadastrado,
  // preenche nome e endereço automaticamente (sem precisar escolher no dropdown). Se o
  // telefone for trocado para um número que não bate com o cliente vinculado, limpa os
  // dados antigos em vez de deixá-los presos na tela (mas não mexe em dados que o
  // usuário está digitando manualmente para um cliente novo, ainda não cadastrado)
  useEffect(() => {
    const phoneDigits = onlyDigits(activeDraft.customerPhone);
    if (phoneDigits.length < 10) return;
    const match = customers.find((c) => onlyDigits(c.phone) === phoneDigits);
    if (match) {
      if (activeDraft.linkedCustomerId !== match.id) selectCustomer(match);
      return;
    }
    if (activeDraft.linkedCustomerId) {
      patchDraft(activeDraft.id, {
        customerName: "",
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        linkedCustomerId: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDraft.id, activeDraft.customerPhone, customers]);

  // Cliente não encontrado pelo telefone: cadastra direto com os dados preenchidos na própria tela
  async function handleRegisterCustomer() {
    const name = activeDraft.customerName.trim();
    if (name.length < 2 || !isAddressValid(activeDraft)) return;
    setSavingCustomer(true);
    try {
      const created = await createCustomer({
        name,
        phone: activeDraft.customerPhone.trim(),
        cep: activeDraft.cep.trim(),
        street: activeDraft.street.trim(),
        number: activeDraft.number.trim(),
        complement: activeDraft.complement.trim(),
        neighborhood: activeDraft.neighborhood.trim(),
        city: activeDraft.city.trim(),
        state: activeDraft.state.trim(),
      });
      setCustomers((prev) => [...prev, created]);
      patchDraft(activeDraft.id, { linkedCustomerId: created.id });
      toast.success(`Cliente "${created.name}" cadastrado`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Não foi possível cadastrar o cliente");
    } finally {
      setSavingCustomer(false);
    }
  }

  function addItem() {
    patchDraft(activeDraft.id, { items: [...activeDraft.items, { ...EMPTY_ITEM }] });
  }

  function removeItem(index) {
    patchDraft(activeDraft.id, { items: activeDraft.items.filter((_, i) => i !== index) });
  }

  function addTab() {
    const draft = createEmptyDraft();
    setState((prev) => ({ drafts: [...prev.drafts, draft], activeId: draft.id }));
    setError("");
  }

  async function closeTab(id) {
    const target = drafts.find((d) => d.id === id);
    if (!isDraftEmpty(target)) {
      const confirmed = await confirm("Descartar os dados desse pedido?", {
        confirmLabel: "Descartar",
        danger: true,
      });
      if (!confirmed) return;
    }

    setState((prev) => {
      const remaining = prev.drafts.filter((d) => d.id !== id);
      if (remaining.length === 0) {
        const draft = createEmptyDraft();
        return { drafts: [draft], activeId: draft.id };
      }
      const wasActive = prev.activeId === id;
      return {
        drafts: remaining,
        activeId: wasActive ? remaining[remaining.length - 1].id : prev.activeId,
      };
    });
    setError("");
  }

  function handleCepChange(e) {
    const formatted = formatCepInput(e.target.value);
    const draftId = activeDraft.id;
    patchDraft(draftId, { cep: formatted });

    const digits = onlyDigits(formatted);
    if (digits.length !== 8) {
      setCepStatus((prev) => ({ ...prev, [draftId]: undefined }));
      return;
    }

    setCepStatus((prev) => ({ ...prev, [draftId]: "loading" }));
    lookupCep(digits)
      .then((data) => {
        setState((prev) => ({
          ...prev,
          drafts: prev.drafts.map((d) =>
            d.id === draftId
              ? {
                  ...d,
                  street: data.logradouro || d.street,
                  neighborhood: data.bairro || d.neighborhood,
                  city: data.localidade || d.city,
                  state: data.uf || d.state,
                }
              : d
          ),
        }));
        setCepStatus((prev) => ({ ...prev, [draftId]: "success" }));
      })
      .catch(() => {
        setCepStatus((prev) => ({ ...prev, [draftId]: "error" }));
      });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isDraftValid(activeDraft)) return;
    setError("");
    setLoading(true);
    try {
      const created = await createOrder({
        customerName: activeDraft.customerName.trim(),
        customerPhone: activeDraft.customerPhone.trim(),
        deliveryAddress: buildAddressString(activeDraft),
        items: activeDraft.items.map((item) => ({
          name: item.name.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      });
      toast.success(`Pedido #${created.id} criado com sucesso`);

      setState((prev) => {
        const remaining = prev.drafts.filter((d) => d.id !== activeDraft.id);
        if (remaining.length === 0) {
          const draft = createEmptyDraft();
          return { drafts: [draft], activeId: draft.id };
        }
        return { drafts: remaining, activeId: remaining[remaining.length - 1].id };
      });
    } catch (err) {
      setError(err.response?.data?.message ?? "Não foi possível criar o pedido");
    } finally {
      setLoading(false);
    }
  }

  const total = draftTotal(activeDraft);
  const isValid = isDraftValid(activeDraft);
  const cepState = cepStatus[activeDraft.id];

  const phoneDigits = onlyDigits(activeDraft.customerPhone);
  const matchedCustomer =
    phoneDigits.length >= 10 ? customers.find((c) => onlyDigits(c.phone) === phoneDigits) : null;
  const showAddress = phoneDigits.length >= 10;

  const phoneMatches =
    activeDropdown === "phone" ? matchCustomers(customers, activeDraft.customerPhone) : [];

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <div>
          <h1>Novo pedido</h1>
          <p className="page-subtitle">
            Crie vários pedidos em abas separadas — seu progresso fica salvo automaticamente
          </p>
        </div>
        <Link to="/" className="btn btn-ghost btn-sm">
          Ver pedidos
        </Link>
      </div>

      <div className="draft-tabs">
        {drafts.map((draft, index) => (
          <button
            type="button"
            key={draft.id}
            className={`draft-tab ${draft.id === activeId ? "draft-tab-active" : ""}`}
            onClick={() => setState((prev) => ({ ...prev, activeId: draft.id }))}
          >
            <span className="draft-tab-label">
              {draft.customerName.trim() || `Pedido ${index + 1}`}
            </span>
            <span
              className="draft-tab-close"
              role="button"
              tabIndex={0}
              aria-label="Fechar aba"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(draft.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  closeTab(draft.id);
                }
              }}
            >
              <XIcon />
            </span>
          </button>
        ))}
        <button type="button" className="draft-tab-add" onClick={addTab} title="Nova aba" aria-label="Nova aba">
          <PlusIcon />
        </button>
      </div>

      <form className="order-form" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        <section className="form-section">
          <h2>Dados da entrega</h2>
          <p className="form-section-hint">Busque o cliente pelo telefone</p>

          <label className="customer-field-label">
            Telefone
            <div className="input-group">
              <PhoneIcon className="input-icon" />
              <input
                type="tel"
                placeholder="(11) 91234-5678"
                value={activeDraft.customerPhone}
                onChange={(e) =>
                  patchDraft(activeDraft.id, { customerPhone: formatPhoneInput(e.target.value) })
                }
                onFocus={() => setActiveDropdown("phone")}
                onBlur={() => setTimeout(() => setActiveDropdown(null), 150)}
                autoComplete="off"
                required
              />
            </div>
            {phoneMatches.length > 0 && (
              <ul className="customer-dropdown">
                {phoneMatches.map((c) => (
                  <li key={c.id}>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); selectCustomer(c); }}>
                      <span className="customer-dropdown-name">{c.name}</span>
                      <span className="customer-dropdown-phone">{c.phone}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </label>

          {matchedCustomer ? (
            <p className="resolved-customer">
              Cliente: <strong>{matchedCustomer.name}</strong>
            </p>
          ) : (
            phoneDigits.length >= 10 && (
              <>
                <p className="resolved-customer resolved-customer-missing">
                  Cliente não encontrado. Preencha os dados abaixo para cadastrar.
                </p>
                <label className="customer-field-label">
                  Nome
                  <input
                    type="text"
                    placeholder="Nome do cliente"
                    value={activeDraft.customerName}
                    onChange={(e) => patchDraft(activeDraft.id, { customerName: e.target.value })}
                    autoComplete="off"
                    required
                  />
                </label>
              </>
            )
          )}

          {showAddress && (
          <div className="address-grid">
            <label className="address-field-cep">
              CEP
              <input
                type="text"
                placeholder="00000-000"
                value={activeDraft.cep}
                onChange={handleCepChange}
                required
              />
              {cepState === "loading" && <span className="address-hint">Buscando endereço...</span>}
              {cepState === "error" && (
                <span className="address-hint address-hint-error">
                  CEP não encontrado, preencha manualmente
                </span>
              )}
            </label>
            <label className="address-field-street">
              Rua
              <input
                type="text"
                placeholder="Rua, avenida..."
                value={activeDraft.street}
                onChange={(e) => patchDraft(activeDraft.id, { street: e.target.value })}
                required
              />
            </label>

            <label className="address-field-number">
              Número
              <input
                type="text"
                placeholder="123"
                value={activeDraft.number}
                onChange={(e) => patchDraft(activeDraft.id, { number: e.target.value })}
                required
              />
            </label>
            <label className="address-field-complement">
              Complemento
              <input
                type="text"
                placeholder="Apto, bloco... (opcional)"
                value={activeDraft.complement}
                onChange={(e) => patchDraft(activeDraft.id, { complement: e.target.value })}
              />
            </label>
            <label className="address-field-neighborhood">
              Bairro
              <input
                type="text"
                placeholder="Bairro"
                value={activeDraft.neighborhood}
                onChange={(e) => patchDraft(activeDraft.id, { neighborhood: e.target.value })}
                required
              />
            </label>

            <label className="address-field-city">
              Cidade
              <input
                type="text"
                placeholder="Cidade"
                value={activeDraft.city}
                onChange={(e) => patchDraft(activeDraft.id, { city: e.target.value })}
                required
              />
            </label>
            <label className="address-field-state">
              UF
              <select
                value={activeDraft.state}
                onChange={(e) => patchDraft(activeDraft.id, { state: e.target.value })}
                required
              >
                <option value="" disabled>
                  --
                </option>
                {BR_STATES.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </label>
          </div>
          )}

          {!matchedCustomer && phoneDigits.length >= 10 && (
            <div className="new-customer-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleRegisterCustomer}
                disabled={
                  savingCustomer ||
                  activeDraft.customerName.trim().length < 2 ||
                  !isAddressValid(activeDraft)
                }
              >
                {savingCustomer ? "Cadastrando..." : "Cadastrar cliente"}
              </button>
            </div>
          )}
        </section>

        <section className="form-section">
          <div className="form-section-header">
            <h2>Itens</h2>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
              + Adicionar item
            </button>
          </div>

          <div className="item-row item-row-head">
            <span>Item</span>
            <span>Qtd</span>
            <span>Preço unit.</span>
            <span>Subtotal</span>
            <span />
          </div>

          {activeDraft.items.map((item, index) => {
            const subtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
            return (
              <div className="item-row" key={index}>
                <input
                  type="text"
                  placeholder="Ex.: Pizza margherita"
                  value={item.name}
                  onChange={(e) => updateItem(index, "name", e.target.value)}
                  required
                />
                <input
                  type="number"
                  min={1}
                  placeholder="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  required
                />
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  placeholder="0,00"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                  required
                />
                <span className="item-subtotal">{formatCurrency(subtotal)}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-remove"
                  onClick={() => removeItem(index)}
                  disabled={activeDraft.items.length === 1}
                  title="Remover item"
                >
                  ✕
                </button>
              </div>
            );
          })}

          <div className="order-form-total">
            <span>Total do pedido</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
        </section>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading || !isValid}>
            {loading ? "Criando..." : "Criar pedido"}
          </button>
          {drafts.length > 1 && (
            <button type="button" className="btn btn-ghost" onClick={() => closeTab(activeDraft.id)}>
              Descartar esta aba
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
