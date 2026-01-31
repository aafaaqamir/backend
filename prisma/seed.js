import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@system.com";
  const password = "admin123";

  const hashedPassword = await bcrypt.hash(password, 10);

  const adminExists = await prisma.user.findUnique({
    where: { email },
  });

  if (adminExists) {
    console.log("Admin already exists");
    return;
  }

  await prisma.user.create({
    data: {
      name: "System Admin",
      email,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Admin created successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
