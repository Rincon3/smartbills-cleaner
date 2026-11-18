export const navigation = [
  { to: "/app", label: "Dashboard", icon: "dashboard" },
  { to: "/app/invoices", label: "Invoices", icon: "invoices" },
  { to: "/app/upload", label: "Upload", icon: "upload", mutate: true },
  { to: "/app/consult", label: "Consultas", icon: "consult" },
  { to: "/app/users", label: "Usuarios", icon: "users", admin: true },
  { to: "/app/audit", label: "Auditoria", icon: "audit", admin: true },
  { to: "/app/settings", label: "Settings", icon: "settings" }
];

export function navigationFor(user) {
  return navigation.filter((item) => {
    if (item.admin && user?.role !== "ADMIN") {
      return false;
    }
    if (item.mutate && user?.role !== "ADMIN" && user?.role !== "ANALYST") {
      return false;
    }
    return true;
  });
}
