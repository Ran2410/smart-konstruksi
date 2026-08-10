import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const counts = {
  invoices: await prisma.invoice.count(),
  payments: await prisma.payment.count(),
  transactions: await prisma.transaction.count(),
  projects: await prisma.project.count(),
  branches: await prisma.branch.count(),
};
console.log("COUNTS:", JSON.stringify(counts));

const inv = await prisma.invoice.findMany({
  take: 3,
  orderBy: { createdAt: "desc" },
  select: { invoiceNo: true, amount: true, status: true, issuedAt: true, dueDate: true, project: { select: { name: true, branchId: true } } },
});
console.log("SAMPLE INVOICES:", JSON.stringify(inv, null, 2));

const tx = await prisma.transaction.findFirst({
  select: { type: true, totalCost: true, date: true, projectId: true, material: { select: { name: true } } },
});
console.log("SAMPLE TX:", JSON.stringify(tx));

await prisma.$disconnect();
