export function canMutateInvoices(user) {
  return user?.role === "ADMIN" || user?.role === "ANALYST";
}

export function isAdmin(user) {
  return user?.role === "ADMIN";
}
