import bcrypt from "bcryptjs";
import { prisma } from "../apps/backend/src/config/prisma.js";

const email = process.env.ADMIN_EMAIL || "admin@smartbills.local";
const password = String(process.env.ADMIN_PASSWORD || "").trim();
const name = process.env.ADMIN_NAME || "Admin SmartBills";

if (password.length < 12) {
  throw new Error("ADMIN_PASSWORD must be at least 12 characters");
}

const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  console.log("admin-exists");
  await prisma.$disconnect();
  process.exit(0);
}

await prisma.user.create({
  data: {
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: "ADMIN"
  }
});
console.log("admin-created");
await prisma.$disconnect();
