import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env.js";
import { authMiddleware, requireRole } from "./middleware/auth.js";
import { authRouter } from "./routes/authRoutes.js";
import { dashboardRouter } from "./routes/dashboardRoutes.js";
import { userRouter } from "./routes/userRoutes.js";
import { auditRouter } from "./routes/auditRoutes.js";
import { invoiceRouter } from "./routes/invoiceRoutes.js";
import { prisma } from "./config/prisma.js";
import { seedDatabase } from "./services/seedService.js";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.resolve("apps/backend/uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/dashboard", authMiddleware, dashboardRouter);
app.use("/api/users", authMiddleware, requireRole("ADMIN"), userRouter);
app.use("/api/audit", authMiddleware, requireRole("ADMIN"), auditRouter);
app.use("/api/invoices", authMiddleware, invoiceRouter);

app.use((error, _req, res, _next) => {
  if (error.message === "Formato no soportado") {
    return res.status(400).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: "Error interno del servidor" });
});

async function bootstrap() {
  await seedDatabase();

  app.listen(env.port, () => {
    console.log(`SmartBills API running on http://localhost:${env.port}`);
  });
}

bootstrap().catch(async (error) => {
  console.error("Failed to bootstrap SmartBills API", error);
  await prisma.$disconnect();
  process.exit(1);
});
