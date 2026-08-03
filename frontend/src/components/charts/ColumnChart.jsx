// Gráfico de colunas simples (CSS), usado para séries ao longo do tempo.
// data: [{ key, label, value }]. Rotula o ponto selecionado (e o mais recente);
// os demais valores ficam disponíveis via tooltip nativo ao passar o mouse.
// Se onSelect for informado, cada coluna vira clicável (ex.: escolher um dia).
export default function ColumnChart({ data, color = "var(--accent)", height = 120, selectedKey, onSelect }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="column-chart" style={{ height }}>
      {data.map((d, index) => {
        const isLast = index === data.length - 1;
        const isSelected = d.key != null && d.key === selectedKey;
        const barHeight = Math.round((d.value / max) * 100);
        return (
          <button
            type="button"
            key={d.key ?? d.label}
            className={`column-chart-col ${isSelected ? "column-chart-col-selected" : ""}`}
            onClick={onSelect ? () => onSelect(d.key) : undefined}
            disabled={!onSelect}
          >
            <div className="column-chart-track" title={`${d.label}: ${d.value}`}>
              {d.value > 0 && (
                <div
                  className="column-chart-bar"
                  style={{ height: `${Math.max(barHeight, 4)}%`, background: isSelected ? "var(--accent)" : color }}
                >
                  {(isLast || isSelected) && <span className="column-chart-value">{d.value}</span>}
                </div>
              )}
            </div>
            <span className="column-chart-label">{d.label}</span>
          </button>
        );
      })}
    </div>
  );
}
