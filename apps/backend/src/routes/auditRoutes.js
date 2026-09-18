import { Router } from "express";
import { prisma } from "../config/prisma.js";

export const auditRouter = Router();

auditRouter.get("/", async (_req, res) => {
  const logs = await prisma.auditLog.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return res.json(logs);
});

