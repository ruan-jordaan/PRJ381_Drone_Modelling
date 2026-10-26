import { randomBytes, scryptSync } from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

const insurers = ["Alpha", "Bravo", "Charlie", "Delta", "Echo"];

const users = [
  ...[1, 2].map((n) => ({
    email: `contractor${n}@demo.test`,
    name: `Demo Contractor ${n}`,
    role: "CONTRACTOR",
  })),
  ...insurers.map((name) => ({
    email: `${name.toLowerCase()}@insurer.test`,
    name: `${name} Insurance`,
    role: "INSURANCE",
  })),
];

for (const u of users) {
  await prisma.user.upsert({
    where: { email: u.email },
    update: {},
    create: { ...u, passwordHash: hashPassword("password123") },
  });
}

console.log("Seeded:", users.map((u) => u.email).join(", "), "(password: password123)");
await prisma.$disconnect();
