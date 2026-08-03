export function toDateKey(value) {
  const d = new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateKey, amount) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(year, month - 1, day + amount);
  return toDateKey(d);
}

export function daysBetween(startKey, endKey) {
  const [sy, sm, sd] = startKey.split("-").map(Number);
  const [ey, em, ed] = endKey.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

export function isToday(dateKey) {
  return dateKey === toDateKey(new Date());
}

export function formatDateLabel(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  if (isToday(dateKey)) return "Hoje";
  if (dateKey === addDays(toDateKey(new Date()), -1)) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
