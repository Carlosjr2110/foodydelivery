export async function lookupCep(cepDigits) {
  const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
  if (!res.ok) throw new Error("Falha na consulta de CEP");
  const data = await res.json();
  if (data.erro) throw new Error("CEP não encontrado");
  return data;
}
