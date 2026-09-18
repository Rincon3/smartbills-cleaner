import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { signToken } from "../utils/tokens.js";
import { authMiddleware } from "../middleware/auth.js";
import { createAuditLog } from "../services/auditService.js";
import { getClientIp } from "../utils/http.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Nombre, email y contrasena son obligatorios" });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return res.status(409).json({ message: "Ya existe un usuario con ese email" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "VIEWER"
    }
  });

  await createAuditLog({
    action: "USER_CREATE",
    entity: "user",
    entityId: user.id,
    userId: user.id,
    ipAddress: getClientIp(req),
    metadata: { role: user.role, source: "landing-register" }
  });

  const token = signToken(user);

  return res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email y contrasena son obligatorios" });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ message: "Credenciales invalidas" });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return res.status(401).json({ message: "Credenciales invalidas" });
  }

  const token = signToken(user);

  await createAuditLog({
    action: "LOGIN",
    entity: "auth",
    entityId: user.id,
    userId: user.id,
    ipAddress: getClientIp(req),
    metadata: { email: user.email }
  });

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

authRouter.get("/me", authMiddleware, async (req, res) => {
  return res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  });
});
