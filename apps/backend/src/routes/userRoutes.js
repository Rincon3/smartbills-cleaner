import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { createAuditLog } from "../services/auditService.js";
import { getClientIp } from "../utils/http.js";

export const userRouter = Router();

userRouter.get("/", async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });

  return res.json(users);
});

userRouter.post("/", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role }
  });

  await createAuditLog({
    action: "USER_CREATE",
    entity: "user",
    entityId: user.id,
    userId: req.user.id,
    ipAddress: getClientIp(req),
    metadata: { role }
  });

  return res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
});

userRouter.patch("/:id", async (req, res) => {
  const { role, name } = req.body;

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...(role ? { role } : {}),
      ...(name ? { name } : {})
    }
  });

  await createAuditLog({
    action: "USER_UPDATE",
    entity: "user",
    entityId: user.id,
    userId: req.user.id,
    ipAddress: getClientIp(req),
    metadata: { role: user.role }
  });

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
});

