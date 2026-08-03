import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChartIcon, LogoutIcon } from "./icons";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const showAppChrome = user && !isAuthPage;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          <img src="/logo.png" alt="Foody Delivery" className="navbar-logo" />
        </Link>
        {showAppChrome && (
          <nav className="navbar-links">
            <NavLink to="/" end className="nav-link">
              Pedidos
            </NavLink>
            <NavLink to="/clientes" className="nav-link">
              Clientes
            </NavLink>
            <NavLink to="/entregadores" className="nav-link">
              Entregadores
            </NavLink>
            <NavLink to="/analytics" className="nav-link nav-link-analytics">
              <ChartIcon /> Análise
            </NavLink>
          </nav>
        )}
      </div>
      {showAppChrome && (
        <div className="navbar-user">
          <Link to="/orders/new" className="btn btn-primary btn-sm navbar-new-order">
            + Novo pedido
          </Link>
          <span className="navbar-divider" />
          <div className="user-chip">
            <span className="user-avatar">{user.name?.charAt(0).toUpperCase()}</span>
            <span className="user-name">{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm btn-icon-only"
            aria-label="Sair"
            title="Sair"
          >
            <LogoutIcon width={15} height={15} />
          </button>
        </div>
      )}
    </header>
  );
}
