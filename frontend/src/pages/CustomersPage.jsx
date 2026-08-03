import { useEffect, useState } from "react";
import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from "../api/customers";
import { formatCepInput, formatPhoneInput, onlyDigits } from "../utils/format";
import { lookupCep } from "../utils/cep";
import { EMPTY_ADDRESS, isAddressValid } from "../utils/address";
import { BR_STATES } from "../constants";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import { MailIcon, PhoneIcon, EditIcon, TrashIcon } from "../components/icons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emptyForm = { name: "", phone: "", email: "", ...EMPTY_ADDRESS };

function shortAddress(customer) {
  const line = [customer.street, customer.number].filter(Boolean).join(", ");
  return [line, customer.complement].filter(Boolean).join(" - ");
}

function matchCustomers(customers, query) {
  const qDigits = onlyDigits(query);
  if (qDigits.length < 3) return [];
  return customers.filter((c) => onlyDigits(c.phone).includes(qDigits)).slice(0, 6);
}

export default function CustomersPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [cepStatus, setCepStatus] = useState(null);
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);

  useEffect(() => {
    listCustomers()
      .then(setCustomers)
      .catch(() => toast.error("Não foi possível carregar os clientes"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phoneDigits = onlyDigits(form.phone);

  // Busca de cliente é feita só pelo telefone: se bater com um cadastrado, carrega os
  // dados dele automaticamente para edição em vez de deixar cadastrar um duplicado. Se o
  // telefone for trocado para um número que não bate com o cliente carregado, sai do modo
  // edição e limpa os outros campos (mas mantém o telefone digitado)
  useEffect(() => {
    if (phoneDigits.length < 10) return;
    const match = customers.find((c) => onlyDigits(c.phone) === phoneDigits);
    if (match) {
      if (editingId !== match.id) {
        startEdit(match);
        toast.success(`Cliente "${match.name}" encontrado — dados carregados para edição`);
      }
      return;
    }
    if (editingId) {
      setEditingId(null);
      setCepStatus(null);
      setForm((prev) => ({ ...emptyForm, phone: prev.phone }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneDigits, customers, editingId]);

  const showRest = editingId || phoneDigits.length >= 10;

  const hasBasicInfo = form.name.trim().length >= 2 && phoneDigits.length >= 10;

  const isValid =
    hasBasicInfo &&
    (form.email.trim() === "" || EMAIL_RE.test(form.email)) &&
    isAddressValid(form);

  const phoneMatches = phoneDropdownOpen ? matchCustomers(customers, form.phone) : [];

  function handleCepChange(e) {
    const formatted = formatCepInput(e.target.value);
    setForm((prev) => ({ ...prev, cep: formatted }));

    const digits = onlyDigits(formatted);
    if (digits.length !== 8) {
      setCepStatus(null);
      return;
    }

    setCepStatus("loading");
    lookupCep(digits)
      .then((data) => {
        setForm((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
        setCepStatus("success");
      })
      .catch(() => setCepStatus("error"));
  }

  function startEdit(customer) {
    setEditingId(customer.id);
    setCepStatus(null);
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? "",
      cep: customer.cep ?? "",
      street: customer.street ?? "",
      number: customer.number ?? "",
      complement: customer.complement ?? "",
      neighborhood: customer.neighborhood ?? "",
      city: customer.city ?? "",
      state: customer.state ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setCepStatus(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      cep: form.cep.trim(),
      street: form.street.trim(),
      number: form.number.trim(),
      complement: form.complement.trim(),
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
    };
    try {
      if (editingId) {
        const updated = await updateCustomer(editingId, payload);
        setCustomers((prev) =>
          prev.map((c) => (c.id === editingId ? updated : c)).sort((a, b) => a.name.localeCompare(b.name))
        );
        toast.success(`Cliente "${updated.name}" atualizado`);
        cancelEdit();
      } else {
        const created = await createCustomer(payload);
        setCustomers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setForm(emptyForm);
        toast.success(`Cliente "${created.name}" cadastrado`);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ??
          `Não foi possível ${editingId ? "atualizar" : "cadastrar"} o cliente`
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(customer) {
    const confirmed = await confirm(
      `Excluir o cliente "${customer.name}"? Essa ação não pode ser desfeita.`,
      { confirmLabel: "Excluir", danger: true }
    );
    if (!confirmed) return;

    setDeletingId(customer.id);
    try {
      await deleteCustomer(customer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
      if (editingId === customer.id) cancelEdit();
      toast.success(`Cliente "${customer.name}" removido`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Não foi possível excluir o cliente");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p className="page-subtitle">Cadastro de clientes para agilizar novos pedidos</p>
        </div>
      </div>

      <form className="order-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <h2>{editingId ? "Editar cliente" : "Dados do cliente"}</h2>

          <label className="customer-field-label">
            Telefone
            <div className="input-group">
              <PhoneIcon className="input-icon" />
              <input
                type="tel"
                placeholder="(11) 91234-5678"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: formatPhoneInput(e.target.value) })}
                onFocus={() => setPhoneDropdownOpen(true)}
                onBlur={() => setTimeout(() => setPhoneDropdownOpen(false), 150)}
                autoComplete="off"
                required
              />
            </div>
            {phoneMatches.length > 0 && (
              <ul className="customer-dropdown">
                {phoneMatches.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        startEdit(c);
                        setPhoneDropdownOpen(false);
                        toast.success(`Cliente "${c.name}" carregado para edição`);
                      }}
                    >
                      <span className="customer-dropdown-name">{c.name}</span>
                      <span className="customer-dropdown-phone">{c.phone}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </label>

          {!editingId && phoneDigits.length >= 10 && (
            <p className="resolved-customer resolved-customer-missing">
              Cliente não encontrado. Preencha os dados abaixo para cadastrar.
            </p>
          )}

          {showRest && (
            <>
              <label>
                Cliente
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label>
                E-mail (opcional)
                <div className="input-group">
                  <MailIcon className="input-icon" />
                  <input
                    type="email"
                    placeholder="cliente@exemplo.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </label>
              <div className="address-grid">
              <label className="address-field-cep">
                CEP
                <input
                  type="text"
                  placeholder="00000-000"
                  value={form.cep}
                  onChange={handleCepChange}
                  required
                />
                {cepStatus === "loading" && (
                  <span className="address-hint">Buscando endereço...</span>
                )}
                {cepStatus === "error" && (
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
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  required
                />
              </label>

              <label className="address-field-number">
                Número
                <input
                  type="text"
                  placeholder="123"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  required
                />
              </label>
              <label className="address-field-complement">
                Complemento
                <input
                  type="text"
                  placeholder="Apto, bloco... (opcional)"
                  value={form.complement}
                  onChange={(e) => setForm({ ...form, complement: e.target.value })}
                />
              </label>
              <label className="address-field-neighborhood">
                Bairro
                <input
                  type="text"
                  placeholder="Bairro"
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                  required
                />
              </label>

              <label className="address-field-city">
                Cidade
                <input
                  type="text"
                  placeholder="Cidade"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </label>
              <label className="address-field-state">
                UF
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
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
            </>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving || !isValid}>
              {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar cliente"}
            </button>
            {editingId && (
              <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
                Cancelar edição
              </button>
            )}
          </div>
        </section>
      </form>

      <section className="detail-card list-card">
        <h2>Clientes cadastrados ({customers.length})</h2>
        {loading ? (
          <div className="page-loading">
            <div className="spinner" />
            <p>Carregando clientes...</p>
          </div>
        ) : customers.length === 0 ? (
          <p className="empty-state-inline">Nenhum cliente cadastrado ainda.</p>
        ) : (
          <table className="items-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Endereço</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{shortAddress(customer) || "—"}</td>
                  <td className="table-row-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-icon-only"
                      onClick={() => startEdit(customer)}
                      aria-label="Editar"
                      title="Editar"
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-icon-only btn-danger-ghost"
                      onClick={() => handleDelete(customer)}
                      disabled={deletingId === customer.id}
                      aria-label="Excluir"
                      title="Excluir"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
