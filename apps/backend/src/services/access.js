export function invoiceWhereFor(user) {
  if (!user || user.role === "ADMIN") {
    return {};
  }

  return { ownerId: user.id };
}

export function canMutateInvoices(user) {
  return user?.role === "ADMIN" || user?.role === "ANALYST";
}

export function canReadInvoice(user, invoice) {
  if (!user || !invoice) {
    return false;
  }

  if (user.role === "ADMIN") {
    return true;
  }

  return invoice.ownerId === user.id;
}

export function invoiceNotFound() {
  return { status: 404, body: { message: "Factura no encontrada" } };
}
