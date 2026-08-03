import { useEffect, useState } from "react";
import { createCourier, deleteCourier, listCouriers, updateCourier } from "../api/couriers";
import { VEHICLE_ICONS, VEHICLE_LABELS, VEHICLE_TYPES } from "../constants";
import { formatCpfInput, formatDateTime, formatPhoneInput, onlyDigits } from "../utils/format";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import { EditIcon, PhoneIcon, TrashIcon, UserIcon } from "../components/icons";

const PLATE_REQUIRED_TYPES = ["MOTO", "CARRO"];
const emptyForm = { name: "", phone: "", cpf: "", vehicleType: "MOTO", licensePlate: "" };

function matchCouriers(couriers, query) {
  const qDigits = onlyDigits(query);
  if (qDigits.length < 3) return [];
  return couriers.filter((c) => onlyDigits(c.phone).includes(qDigits)).slice(0, 6);
}

export default function CouriersPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);

  useEffect(() => {
    listCouriers()
      .then(setCouriers)
      .catch(() => toast.error("Não foi possível carregar os entregadores"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phoneDigits = onlyDigits(form.phone);
  const needsPlate = PLATE_REQUIRED_TYPES.includes(form.vehicleType);
  const showRest = editingId || phoneDigits.length >= 10;
  const isValid =
    form.name.trim().length >= 2 &&
    phoneDigits.length >= 10 &&
    onlyDigits(form.cpf).length === 11 &&
    (!needsPlate || form.licensePlate.trim() !== "");

  // Busca de entregador é feita só pelo telefone: se bater com um cadastrado, carrega os
  // dados dele automaticamente para edição em vez de deixar cadastrar um duplicado. Se o
  // telefone for trocado para um número que não bate com o entregador carregado, sai do
  // modo edição e limpa os outros campos (mas mantém o telefone digitado)
  useEffect(() => {
    if (phoneDigits.length < 10) return;
    const match = couriers.find((c) => onlyDigits(c.phone) === phoneDigits);
    if (match) {
      if (editingId !== match.id) {
        startEdit(match);
        toast.success(`Entregador "${match.name}" encontrado — dados carregados para edição`);
      }
      return;
    }
    if (editingId) {
      setEditingId(null);
      setForm((prev) => ({ ...emptyForm, phone: prev.phone }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneDigits, couriers, editingId]);

  const phoneMatches = phoneDropdownOpen ? matchCouriers(couriers, form.phone) : [];

  function startEdit(courier) {
    setEditingId(courier.id);
    setForm({
      name: courier.name,
      phone: courier.phone,
      cpf: formatCpfInput(courier.cpf),
      vehicleType: courier.vehicleType,
      licensePlate: courier.licensePlate ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      cpf: form.cpf.trim(),
      vehicleType: form.vehicleType,
      licensePlate: needsPlate ? form.licensePlate.trim().toUpperCase() : null,
    };
    try {
      if (editingId) {
        const updated = await updateCourier(editingId, payload);
        setCouriers((prev) =>
          prev.map((c) => (c.id === editingId ? updated : c)).sort((a, b) => a.name.localeCompare(b.name))
        );
        toast.success(`Entregador "${updated.name}" atualizado`);
        cancelEdit();
      } else {
        const created = await createCourier(payload);
        setCouriers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setForm(emptyForm);
        toast.success(`Entregador "${created.name}" cadastrado`);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ??
          `Não foi possível ${editingId ? "atualizar" : "cadastrar"} o entregador`
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(courier) {
    const confirmed = await confirm(
      `Excluir o entregador "${courier.name}"? Essa ação não pode ser desfeita.`,
      { confirmLabel: "Excluir", danger: true }
    );
    if (!confirmed) return;

    setDeletingId(courier.id);
    try {
      await deleteCourier(courier.id);
      setCouriers((prev) => prev.filter((c) => c.id !== courier.id));
      if (editingId === courier.id) cancelEdit();
      toast.success(`Entregador "${courier.name}" removido`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Não foi possível excluir o entregador");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <div>
          <h1>Entregadores</h1>
          <p className="page-subtitle">Cadastro de entregadores para atribuir aos pedidos</p>
        </div>
      </div>

      <form className="order-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <h2>{editingId ? "Editar entregador" : "Novo entregador"}</h2>

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
                        toast.success(`Entregador "${c.name}" carregado para edição`);
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
              Entregador não encontrado. Preencha os dados abaixo para cadastrar.
            </p>
          )}

          {showRest && (
            <>
              <label>
                Nome
                <div className="input-group">
                  <UserIcon className="input-icon" />
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </label>
              <div className="form-row">
                <label>
                  CPF
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: formatCpfInput(e.target.value) })}
                    required
                  />
                </label>
                <label>
                  Veículo
                  <select
                    value={form.vehicleType}
                    onChange={(e) => setForm({ ...form, vehicleType: e.target.value, licensePlate: "" })}
                  >
                    {VEHICLE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {VEHICLE_ICONS[type]} {VEHICLE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {needsPlate && (
                <label>
                  Placa do veículo
                  <input
                    type="text"
                    placeholder="ABC-1234 ou ABC1D23"
                    value={form.licensePlate}
                    onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
                    maxLength={8}
                    required
                  />
                </label>
              )}
            </>
          )}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving || !isValid}>
              {saving
                ? "Salvando..."
                : editingId
                  ? "Salvar alterações"
                  : "Adicionar entregador"}
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
        <h2>Entregadores cadastrados ({couriers.length})</h2>
        {loading ? (
          <div className="page-loading">
            <div className="spinner" />
            <p>Carregando entregadores...</p>
          </div>
        ) : couriers.length === 0 ? (
          <p className="empty-state-inline">Nenhum entregador cadastrado ainda.</p>
        ) : (
          <table className="items-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>CPF</th>
                <th>Veículo</th>
                <th>Placa</th>
                <th>Cadastrado em</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {couriers.map((courier) => (
                <tr key={courier.id}>
                  <td>{courier.name}</td>
                  <td>{courier.phone}</td>
                  <td>{courier.cpf}</td>
                  <td>
                    {VEHICLE_ICONS[courier.vehicleType]} {VEHICLE_LABELS[courier.vehicleType]}
                  </td>
                  <td>{courier.licensePlate || "—"}</td>
                  <td>{formatDateTime(courier.createdAt)}</td>
                  <td className="table-row-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-icon-only"
                      onClick={() => startEdit(courier)}
                      aria-label="Editar"
                      title="Editar"
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-icon-only btn-danger-ghost"
                      onClick={() => handleDelete(courier)}
                      disabled={deletingId === courier.id}
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
