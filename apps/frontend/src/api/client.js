const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("smartbills_token");
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Ocurrio un error");
  }

  return data;
}

export const api = {
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  me: () => request("/auth/me"),
  getDashboard: () => request("/dashboard/summary"),
  getUsers: () => request("/users"),
  createUser: (payload) =>
    request("/users", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateUser: (id, payload) =>
    request(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  getAuditLogs: () => request("/audit"),
  getInvoices: (params = {}) => {
    const search = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
    );
    return request(`/invoices${search.toString() ? `?${search.toString()}` : ""}`);
  },
  getInvoice: (id) => request(`/invoices/${id}`),
  uploadInvoice: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request("/invoices/upload", {
      method: "POST",
      body: formData
    });
  },
  updateInvoice: (id, payload) =>
    request(`/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteInvoice: (id) =>
    request(`/invoices/${id}`, {
      method: "DELETE"
    })
};
