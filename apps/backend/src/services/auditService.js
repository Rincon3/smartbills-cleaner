import { prisma } from "../config/prisma.js";

export async function createAuditLog({ action, entity, entityId, userId, ipAddress, metadata }) {
  return prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      userId,
      ipAddress,
      metadata
    }
  });
}

