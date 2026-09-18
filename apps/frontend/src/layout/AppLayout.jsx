import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { navigation } from "../data/navigation";
import { Icon } from "../components/Icon";
import { useAuth } from "../context/AuthContext";

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>Smart Bills</strong>
            <span>Editorial Billing</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className="nav-item">
              <Icon name={item.icon} className="nav-icon" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="primary-button sidebar-cta" type="button" onClick={() => navigate("/app/upload")}>
          Cargar factura
        </button>

        <div className="sidebar-user">
          <div className="avatar">{user?.name?.slice(0, 1) || "S"}</div>
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">SMART BILLS CLEANER</p>
          </div>
          <div className="topbar-actions">
            <label className="searchbox">
              <Icon name="search" className="topbar-icon" />
              <input placeholder="Search invoices..." />
            </label>
            <button className="icon-button" type="button">
              <Icon name="bell" className="topbar-icon" />
            </button>
            <button className="icon-button" type="button">
              <Icon name="help" className="topbar-icon" />
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <Icon name="logout" className="button-icon" />
              Salir
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
