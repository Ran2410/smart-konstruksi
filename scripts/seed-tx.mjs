import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const materials = await prisma.material.findMany({ select: { id: true, name: true } });
const projects = await prisma.project.findMany({ select: { id: true, name: true } });
if (materials.length === 0 || projects.length === 0) {
  console.log("SKIP: no materials/projects");
  process.exit(0);
}

const txData = [
  // IN (pembelian) — Maret–Juli 2026
  { type: "IN", purpose: "MATERIAL_PURCHASE", qty: 200, price: 62000, date: "2026-03-05", notes: "PO Semen #001" },
  { type: "IN", purpose: "MATERIAL_PURCHASE", qty: 150, price: 135000, date: "2026-03-18", notes: "PO Besi #002" },
  { type: "IN", purpose: "MATERIAL_PURCHASE", qty: 400, price: 4500, date: "2026-04-02", notes: "PO Hollow #003" },
  { type: "IN", purpose: "OPERATIONAL", qty: 80, price: 18000, date: "2026-04-20", notes: "Kabel NYM" },
  { type: "IN", purpose: "MATERIAL_PURCHASE", qty: 300, price: 850000, date: "2026-05-10", notes: "PO Ready Mix #004" },
  { type: "IN", purpose: "MATERIAL_PURCHASE", qty: 120, price: 185000, date: "2026-06-08", notes: "PO Granit #005" },
  { type: "IN", purpose: "MATERIAL_PURCHASE", qty: 500, price: 62000, date: "2026-07-12", notes: "PO Semen #006" },
  // OUT (pemakaian proyek)
  { type: "OUT", purpose: "PROJECT_USAGE", qty: 180, price: 0, date: "2026-03-22", notes: "Pemakaian fondasi" },
  { type: "OUT", purpose: "PROJECT_USAGE", qty: 140, price: 0, date: "2026-04-25", notes: "Pemakaian struktur" },
  { type: "OUT", purpose: "PROJECT_USAGE", qty: 380, price: 0, date: "2026-05-30", notes: "Pemakaian dinding" },
  { type: "OUT", purpose: "PROJECT_USAGE", qty: 110, price: 0, date: "2026-06-28", notes: "Pemakaian finishing" },
  { type: "OUT", purpose: "WASTE", qty: 5, price: 0, date: "2026-07-15", notes: "Material sisa" },
];

for (let i = 0; i < txData.length; i++) {
  const t = txData[i];
  const m = materials[i % materials.length];
  const p = projects[i % projects.length];
  const totalCost = t.type === "IN" ? t.qty * (t.price || 0) : 0;
  await prisma.transaction.create({
    data: {
      type: t.type,
      purpose: t.purpose,
      materialId: m.id,
      qty: t.qty,
      price: t.price,
      totalCost,
      projectId: t.type === "OUT" ? p.id : null,
      date: new Date(t.date),
      notes: t.notes,
      createdBy: "u-admin",
    },
  });
  // update material stock untuk IN
  if (t.type === "IN") {
    await prisma.material.update({
      where: { id: m.id },
      data: { stock: { increment: t.qty } },
    });
  }
}

const count = await prisma.transaction.count();
console.log(`✅ Inserted ${txData.length} transactions (total in DB: ${count})`);
await prisma.$disconnect();
