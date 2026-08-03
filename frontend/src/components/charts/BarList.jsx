// Lista de barras horizontais rankeada, usada para comparar categorias
// (status, entregadores, prazos, etc). data: [{ label, value, color, icon?, alert? }].
// icon (opcional) desenha um badge colorido antes do rótulo; alert (opcional)
// destaca a linha inteira (usado para "Em atraso" quando há valor > 0).
export default function BarList({ data, emptyLabel = "Sem dados" }) {
  if (data.length === 0) {
    return <p className="empty-state-inline">{emptyLabel}</p>;
  }

  const max = Math.max(1, ...data.map((d) => d.value));
  const hasIcons = data.some((d) => d.icon);

  return (
    <div className="bar-list">
      {data.map((d) => (
        <div
          className={`bar-list-row ${hasIcons ? "bar-list-row-icon" : ""} ${d.alert ? "bar-list-row-alert" : ""}`}
          key={d.label}
        >
          {hasIcons && (
            <span
              className="bar-list-icon"
              style={{ background: `color-mix(in srgb, ${d.color} 18%, transparent)`, color: d.color }}
            >
              {d.icon}
            </span>
          )}
          <span className="bar-list-label">{d.label}</span>
          <div className="bar-list-track" title={`${d.label}: ${d.value}`}>
            <div
              className="bar-list-fill"
              style={{ width: `${Math.max((d.value / max) * 100, 4)}%`, background: d.color }}
            />
          </div>
          <span className="bar-list-value">{d.value}</span>
        </div>
      ))}
    </div>
  );
}
