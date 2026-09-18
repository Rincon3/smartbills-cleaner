import { prisma } from "../src/config/prisma.js";
import { seedDatabase } from "../src/services/seedService.js";

seedDatabase({ reset: true })
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
