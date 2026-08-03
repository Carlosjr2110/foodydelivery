export const EMPTY_ADDRESS = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

export function isAddressValid(address) {
  return (
    address.cep.replace(/\D/g, "").length === 8 &&
    address.street.trim() !== "" &&
    address.number.trim() !== "" &&
    address.neighborhood.trim() !== "" &&
    address.city.trim() !== "" &&
    address.state.trim() !== ""
  );
}

// Achata os campos estruturados em uma única string, no formato usado em pedidos e clientes
export function buildAddressString(address) {
  const parts = [];

  let line = address.street.trim();
  if (address.number.trim()) line += `, ${address.number.trim()}`;
  if (address.complement.trim()) line += ` - ${address.complement.trim()}`;
  if (line) parts.push(line);

  if (address.neighborhood.trim()) parts.push(address.neighborhood.trim());

  const cityState = [address.city.trim(), address.state.trim()].filter(Boolean).join("/");
  if (cityState) parts.push(cityState);

  if (address.cep.trim()) parts.push(`CEP ${address.cep.trim()}`);

  return parts.join(" - ");
}
