export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-hero">
          <div className="auth-hero-logo">
            <img src="/logo.png" alt="Foody Delivery" />
          </div>
          <h2>Do pedido à entrega, tudo em um só painel</h2>
          <ul className="auth-hero-list">
            <li>Acompanhe cada etapa da entrega em tempo real</li>
            <li>Crie e gerencie pedidos em segundos</li>
            <li>Atualize o status com um clique</li>
          </ul>
          <p className="auth-hero-foot">Foody Delivery · Sistema de rastreamento de pedidos</p>
        </aside>
        <div className="auth-form-panel">{children}</div>
      </div>
    </div>
  );
}
