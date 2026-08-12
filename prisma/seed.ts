import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const isFullMode = process.argv.includes("--full");

// Default admin password — never hardcode a fixed secret for privileged
// accounts. Use SEED_ADMIN_PASSWORD env var, otherwise generate a random
// one and print it once (capture it from the console output).
const seedPassword =
  process.env.SEED_ADMIN_PASSWORD ??
  (() => {
    const random = randomBytes(18).toString("base64url");
    console.log(
      `⚠️  No SEED_ADMIN_PASSWORD set — using a random password: ${random}`
    );
    return random;
  })();
const seedPasswordLabel = process.env.SEED_ADMIN_PASSWORD
  ? "(from SEED_ADMIN_PASSWORD env)"
  : "(random — see console output above)";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
async function cleanup() {
  console.log("🧹 Cleaning existing data...");
  await prisma.activityLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.file.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.checklist.deleteMany();
  await prisma.task.deleteMany();
  await prisma.progressReport.deleteMany();
  await prisma.material.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.materialCategory.deleteMany();
  await prisma.branch.deleteMany();
  console.log("🧹 Cleanup done\n");
}
async function seedMinimal() {
  const password = await bcrypt.hash(seedPassword, 12);
  const branch = await prisma.branch.upsert({
    where: { id: "branch-ksipusat" },
    update: {},
    create: {
      id: "branch-ksipusat",
      name: "KSI Pusat",
      address: "Jl. Sudirman Kav. 52-53, Jakarta Selatan",
      phone: "021-57854000",
      email: "pusat@ksi.co.id",
    },
  });
  console.log(`✅ Branch: ${branch.name}`);
  const users = [
    {
      id: "u-owner",
      email: "owner@ksi.co.id",
      name: "Budi Santoso",
      role: "OWNER" as const,
      branchId: branch.id,
      phone: "0812-1000-0002",
    },
    {
      id: "u-admin",
      email: "admin@ksi.co.id",
      name: "Andi Pratama",
      role: "SUPER_ADMIN" as const,
      branchId: branch.id,
      phone: "0812-1000-0001",
    },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password },
      create: { ...u, password },
    });
  }
  console.log(`✅ Users: ${users.length} (owner + admin)`);
  console.log(
    "\n═══════════════════════════════════════════════════════════════",
  );
  console.log("  ✅ MINIMAL SEED COMPLETED");
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log(`
  🔑 Login Credentials ${seedPasswordLabel}:
  ├── owner@ksi.co.id   → OWNER
  └── admin@ksi.co.id   → SUPER_ADMIN
  ℹ️  Run with --full flag for dev data:
      npx prisma db seed -- --full
`);
}
// ── Helper: create dummy file buffer ──
function createDummyFile(filename: string): Buffer {
  if (filename.endsWith(".pdf")) {
    return Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n" +
      "xref\n0 4\ntrailer\n<< /Root 1 0 R /Size 4 >>\n%%EOF"
    );
  }
  return Buffer.from(`[Dummy file content for ${filename}]\n`);
}
// ── Helper: seed sample documents with dummy files ──
async function seedDocuments() {
  const categories = await prisma.documentCategory.findMany();
  if (!categories.length) {
    console.log("  ⏭️  No document categories found, skipping documents");
    return;
  }
  const adminUser = await prisma.user.findFirst({ where: { email: "admin@ksi.co.id" } });
  if (!adminUser) return;
  const projects = await prisma.project.findMany();
  if (!projects.length) return;
  const catMap: Record<string, string> = {};
  categories.forEach((c) => { catMap[c.name] = c.id; });
  const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
  await mkdir(uploadDir, { recursive: true });
  const docs = [
    { name: "Kontrak Utama - Gedung Sentra Bisnis", desc: "Kontrak kerja utama antara KSI dan PT. Wulandari Properti", file: "pdf", cat: "Contract Documents", proj: 0, visible: true },
    { name: "Addendum #1 - Perubahan Timeline", desc: "Perpanjangan timeline proyek 2 bulan akibat cuaca ekstrem", file: "pdf", cat: "Contract Documents", proj: 0, visible: true },
    { name: "Drawing Arsitektur - Lantai 1-8", desc: "Gambar kerja arsitektur lengkap gedung 8 lantai", file: "pdf", cat: "Technical Documents", proj: 0, visible: true },
    { name: "RAB Detail - Struktur Beton", desc: "Rincian anggaran biaya untuk pekerjaan struktur beton", file: "xlsx", cat: "Technical Documents", proj: 0, visible: false },
    { name: "Laporan Progress Minggu ke-12", desc: "Laporan progress mingguan periode 15-21 Juli 2026", file: "pdf", cat: "Progress Documents", proj: 0, visible: true },
    { name: "Foto Progress - Juli 2026", desc: "Dokumentasi foto progress pekerjaan struktur lantai 3", file: "jpg", cat: "Progress Documents", proj: 0, visible: true },
    { name: "Invoice #INV-2026-001", desc: "Invoice termin 1 - 30% dari nilai kontrak", file: "pdf", cat: "Financial Documents", proj: 0, visible: true },
    { name: "Bukti Transfer Termin 1", desc: "Bukti transfer pembayaran termin 1 dari client", file: "pdf", cat: "Financial Documents", proj: 0, visible: false },
    { name: "IMB/PBG - Gedung Sentra Bisnis", desc: "Izin Mendirikan Bangunan / Persetujuan Bangunan Gedung", file: "pdf", cat: "Legal & Permits", proj: 0, visible: true, expiry: "2028-12-31" },
    { name: "Kontrak Utama - Villa Lembang", desc: "Kontrak kerja utama proyek Villa Modern Lembang", file: "pdf", cat: "Contract Documents", proj: 1, visible: true },
    { name: "Drawing Arsitektur - Villa", desc: "Gambar kerja arsitektur villa 3 lantai", file: "pdf", cat: "Technical Documents", proj: 1, visible: true },
    { name: "Laporan Progress Minggu ke-8", desc: "Laporan progress mingguan periode 15-21 Juli 2026", file: "pdf", cat: "Progress Documents", proj: 1, visible: true },
    { name: "BAST - Ruko Citra Commercial Park", desc: "Berita Acara Serah Terima pekerjaan renovasi ruko", file: "pdf", cat: "Handover Documents", proj: 2, visible: true },
    { name: "Warranty Certificate - Ruko Citra", desc: "Sertifikat garansi pekerjaan 6 bulan pasca serah terima", file: "pdf", cat: "Handover Documents", proj: 2, visible: true, expiry: "2027-01-01" },
    { name: "SLF - SD Harapan Bangsa", desc: "Sertifikat Laik Fungsi untuk gedung sekolah", file: "pdf", cat: "Legal & Permits", proj: 3, visible: true, expiry: "2031-01-31" },
  ];
  let created = 0;
  for (const d of docs) {
    const proj = projects[d.proj];
    if (!proj) continue;
    const existing = await prisma.document.findFirst({ where: { name: d.name, projectId: proj.id } });
    if (existing) continue;
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${d.file}`;
    const filePath = path.join(uploadDir, uniqueName);
    const content = createDummyFile(uniqueName);
    await writeFile(filePath, content);
    await prisma.document.create({
      data: {
        name: d.name,
        description: d.desc,
        fileUrl: `/uploads/documents/${uniqueName}`,
        fileType: d.file,
        fileSize: content.length,
        categoryId: catMap[d.cat] || categories[0].id,
        projectId: proj.id,
        uploaderId: adminUser.id,
        isClientVisible: d.visible,
        expiryDate: (d as any).expiry ? new Date((d as any).expiry) : null,
        status: "ACTIVE",
        version: 1,
        createdBy: adminUser.id,
      },
    });
    created++;
  }
  const total = await prisma.document.count();
  console.log(`✅ Documents: ${created} created (total: ${total})`);
}
async function seedFull() {
  const password = await bcrypt.hash(seedPassword, 12);
  const branch1 = await prisma.branch.upsert({
    where: { id: "branch-ksipusat" },
    update: {},
    create: {
      id: "branch-ksipusat",
      name: "KSI Pusat",
      address: "Jl. Sudirman Kav. 52-53, Jakarta Selatan",
      phone: "021-57854000",
      email: "pusat@ksi.co.id",
    },
  });
  const branch2 = await prisma.branch.upsert({
    where: { id: "branch-ksibandung" },
    update: {},
    create: {
      id: "branch-ksibandung",
      name: "KSI Bandung",
      address: "Jl. Dago No. 123, Bandung",
      phone: "022-4201234",
      email: "bandung@ksi.co.id",
    },
  });
  console.log(`✅ Branches: ${branch1.name}, ${branch2.name}`);
  const userData = [
    {
      id: "u-admin",
      email: "admin@ksi.co.id",
      name: "Andi Pratama",
      role: "SUPER_ADMIN" as const,
      branchId: branch1.id,
      phone: "0812-1000-0001",
    },
    {
      id: "u-owner",
      email: "owner@ksi.co.id",
      name: "Budi Santoso",
      role: "OWNER" as const,
      branchId: branch1.id,
      phone: "0812-1000-0002",
    },
    {
      id: "u-bm",
      email: "bm@ksi.co.id",
      name: "Citra Dewi",
      role: "BRANCH_MANAGER" as const,
      branchId: branch1.id,
      phone: "0812-1000-0003",
    },
    {
      id: "u-pm1",
      email: "pm@ksi.co.id",
      name: "Dimas Anggara",
      role: "PROJECT_MANAGER" as const,
      branchId: branch1.id,
      phone: "0812-1000-0004",
    },
    {
      id: "u-pm2",
      email: "pm2@ksi.co.id",
      name: "Eka Putri",
      role: "PROJECT_MANAGER" as const,
      branchId: branch2.id,
      phone: "0812-1000-0005",
    },
    {
      id: "u-mandor",
      email: "mandor@ksi.co.id",
      name: "Fajar Nugroho",
      role: "SITE_MANAGER" as const,
      branchId: branch1.id,
      phone: "0812-1000-0006",
    },
    {
      id: "u-arsitek",
      email: "arsitek@ksi.co.id",
      name: "Gita Sari",
      role: "ARSITEK" as const,
      branchId: branch1.id,
      phone: "0812-1000-0007",
    },
    {
      id: "u-qc",
      email: "qc@ksi.co.id",
      name: "Hendra Wijaya",
      role: "QC_INSPECTOR" as const,
      branchId: branch1.id,
      phone: "0812-1000-0008",
    },
    {
      id: "u-finance",
      email: "finance@ksi.co.id",
      name: "Indah Permata",
      role: "FINANCE" as const,
      branchId: branch1.id,
      phone: "0812-1000-0009",
    },
    {
      id: "u-adminktr",
      email: "adminktr@ksi.co.id",
      name: "Joko Susilo",
      role: "ADMIN_KANTOR" as const,
      branchId: branch1.id,
      phone: "0812-1000-0010",
    },
    {
      id: "u-vendor",
      email: "vendor@ksi.co.id",
      name: "Toko Bangunan Jaya",
      role: "VENDOR" as const,
      branchId: null,
      phone: "021-5551234",
    },
    {
      id: "u-client1",
      email: "client@ksi.co.id",
      name: "Rina Wulandari",
      role: "CLIENT" as const,
      branchId: null,
      phone: "0813-2000-0001",
    },
    {
      id: "u-client2",
      email: "client2@ksi.co.id",
      name: "Surya Hermawan",
      role: "CLIENT" as const,
      branchId: null,
      phone: "0813-2000-0002",
    },
    {
      id: "u-client3",
      email: "client3@ksi.co.id",
      name: "Maya Anggraeni",
      role: "CLIENT" as const,
      branchId: null,
      phone: "0813-2000-0003",
    },
  ];
  for (const u of userData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password },
      create: { ...u, password },
    });
  }
  console.log(`✅ Users: ${userData.length} users`);
  const clientProfiles = [
    {
      userId: "u-client1",
      companyName: "PT. Wulandari Properti",
      address: "Jl. Gatot Subroto No. 45, Jakarta",
    },
    {
      userId: "u-client2",
      companyName: "PT. Hermawan Development",
      address: "Jl. Asia Afrika No. 88, Bandung",
    },
    {
      userId: "u-client3",
      companyName: "Yayasan Anggraeni Education",
      address: "Jl. Pendidikan No. 10, Jakarta",
    },
  ];
  for (const c of clientProfiles) {
    const existing = await prisma.client.findFirst({
      where: { userId: c.userId },
    });
    if (!existing) await prisma.client.create({ data: c });
  }
  const clients = await prisma.client.findMany();
  console.log(`✅ Clients: ${clients.length} client profiles`);
  const vendors = [
    {
      id: "v-1",
      name: "Toko Bangunan Jaya Abadi",
      phone: "021-5551001",
      email: "info@jayaabadi.co.id",
      address: "Jl. Raya Bogor Km 28, Jakarta",
      isVerified: true,
    },
    {
      id: "v-2",
      name: "CV. Logam Mulia Steel",
      phone: "021-5552002",
      email: "sales@logammulia.co.id",
      address: "Jl. Industri Timur No. 15, Tangerang",
      isVerified: true,
    },
    {
      id: "v-3",
      name: "PT. Cat Propan Indonesia",
      phone: "022-4443003",
      email: "order@propan.co.id",
      address: "Jl. Raya Cibiru No. 100, Bandung",
      isVerified: true,
    },
    {
      id: "v-4",
      name: "UD. Material Bangunan Sentosa",
      phone: "021-5554004",
      email: "sentosa@material.co.id",
      address: "Jl. Panjang No. 30, Jakarta Barat",
      isVerified: false,
    },
  ];
  for (const v of vendors) {
    await prisma.vendor.upsert({ where: { id: v.id }, update: {}, create: v });
  }
  console.log(`✅ Vendors: ${vendors.length} vendors`);
  const categories = [
    "Struktur",
    "Finishing",
    "Mekanikal",
    "Elektrikal",
    "Plumbing",
  ];
  for (const name of categories) {
    await prisma.materialCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  const cats = await prisma.materialCategory.findMany();
  console.log(`✅ Material Categories: ${cats.length}`);
  const projectData = [
    {
      code: "KSI-001",
      name: "Gedung Perkantoran Sentra Bisnis",
      description:
        "Pembangunan gedung perkantoran 8 lantai di kawasan CBD Jakarta Selatan.",
      address: "Jl. TB Simatupang No. 88, Jakarta Selatan",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-12-31"),
      budget: 12500000000,
      actualCost: 4200000000,
      progress: 38,
      status: "IN_PROGRESS" as const,
      projectManagerId: "u-pm1",
      siteManagerId: "u-mandor",
      clientId: clients[0].id,
      branchId: branch1.id,
    },
    {
      code: "KSI-002",
      name: "Villa Modern Lembang",
      description:
        "Pembangunan villa mewah 3 lantai dengan infinity pool dan smart home system.",
      address: "Jl. Lembang Dayeuhkolot No. 12, Bandung",
      startDate: new Date("2026-05-15"),
      endDate: new Date("2026-10-30"),
      budget: 4800000000,
      actualCost: 2100000000,
      progress: 55,
      status: "IN_PROGRESS" as const,
      projectManagerId: "u-pm2",
      siteManagerId: "u-mandor",
      clientId: clients[1].id,
      branchId: branch2.id,
    },
    {
      code: "KSI-003",
      name: "Ruko Citra Commercial Park",
      description:
        "Renovasi total 12 unit ruko menjadi co-working space & F&B outlet.",
      address: "Jl. Raya Citra No. 200, Bandung",
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-06-30"),
      budget: 2200000000,
      actualCost: 2180000000,
      progress: 100,
      status: "COMPLETED" as const,
      projectManagerId: "u-pm2",
      siteManagerId: null,
      clientId: clients[1].id,
      branchId: branch2.id,
    },
    {
      code: "KSI-004",
      name: "SD Harapan Bangsa — Phase 2",
      description: "Pembangunan gedung baru 3 lantai untuk sekolah dasar.",
      address: "Jl. Pendidikan No. 50, Jakarta Timur",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2027-01-31"),
      budget: 3800000000,
      actualCost: 0,
      progress: 5,
      status: "PLANNING" as const,
      projectManagerId: "u-pm1",
      siteManagerId: null,
      clientId: clients[2].id,
      branchId: branch1.id,
    },
    {
      code: "KSI-005",
      name: "Rumah Sakit Ibu & Anak Sehat",
      description:
        "Renovasi lantai 3-5 RS untuk ICU Neonatal & Ruang Rawat Injap VIP.",
      address: "Jl. Kesehatan No. 10, Jakarta Pusat",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-08-30"),
      budget: 5500000000,
      actualCost: 3800000000,
      progress: 72,
      status: "ON_HOLD" as const,
      projectManagerId: "u-pm1",
      siteManagerId: "u-mandor",
      clientId: clients[0].id,
      branchId: branch1.id,
    },
    {
      code: "KSI-006",
      name: "Apartemen Green Valley",
      description: "Pembangunan 2 tower apartemen 20 lantai. Total 320 unit.",
      address: "Jl. Green Valley No. 1, Bogor",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2027-06-30"),
      budget: 45000000000,
      actualCost: 8500000000,
      progress: 22,
      status: "IN_PROGRESS" as const,
      projectManagerId: "u-pm2",
      siteManagerId: "u-mandor",
      clientId: clients[1].id,
      branchId: branch2.id,
    },
  ];
  for (const p of projectData) {
    await prisma.project.upsert({
      where: { code: p.code },
      update: {
        progress: p.progress,
        actualCost: p.actualCost,
        status: p.status,
      },
      create: p,
    });
  }
  const projects = await prisma.project.findMany();
  console.log(`✅ Projects: ${projects.length} projects`);
  const matCatStruktur = cats.find((c) => c.name === "Struktur")!.id;
  const matCatFinishing = cats.find((c) => c.name === "Finishing")!.id;
  const matCatMekanikal = cats.find((c) => c.name === "Mekanikal")!.id;
  const matCatElektrikal = cats.find((c) => c.name === "Elektrikal")!.id;
  const materialData = [
    {
      name: "Semen Portland Komposit 50kg",
      stock: 2000,
      unit: "sak",
      avgPrice: 62000,
      categoryId: matCatStruktur,
      vendorId: "v-1",
    },
    {
      name: "Besi Beton Ulir 12mm",
      stock: 800,
      unit: "batang",
      avgPrice: 135000,
      categoryId: matCatStruktur,
      vendorId: "v-2",
    },
    {
      name: "Besi Beton Ulir 16mm",
      stock: 500,
      unit: "batang",
      avgPrice: 245000,
      categoryId: matCatStruktur,
      vendorId: "v-2",
    },
    {
      name: "Hollow Block 20cm",
      stock: 5000,
      unit: "pcs",
      avgPrice: 4500,
      categoryId: matCatStruktur,
      vendorId: "v-1",
    },
    {
      name: "Kabel NYM 3x2.5mm",
      stock: 500,
      unit: "meter",
      avgPrice: 18000,
      categoryId: matCatElektrikal,
      vendorId: "v-4",
    },
    {
      name: "Semen Portland 50kg",
      stock: 400,
      unit: "sak",
      avgPrice: 62000,
      categoryId: matCatStruktur,
      vendorId: "v-1",
    },
    {
      name: "Keramik Granit 60x60cm",
      stock: 280,
      unit: "meter",
      avgPrice: 185000,
      categoryId: matCatFinishing,
      vendorId: "v-1",
    },
    {
      name: "Cat Propan Interior",
      stock: 50,
      unit: "gallon",
      avgPrice: 850000,
      categoryId: matCatFinishing,
      vendorId: "v-3",
    },
    {
      name: "Pompa Air Grundfos",
      stock: 3,
      unit: "unit",
      avgPrice: 12500000,
      categoryId: matCatMekanikal,
      vendorId: "v-4",
    },
    {
      name: "Partisi Gypsum 12mm",
      stock: 200,
      unit: "lembar",
      avgPrice: 95000,
      categoryId: matCatFinishing,
      vendorId: "v-1",
    },
    {
      name: "Panel Listrik 3 Phase",
      stock: 5,
      unit: "unit",
      avgPrice: 8500000,
      categoryId: matCatElektrikal,
      vendorId: "v-4",
    },
    {
      name: "Beton Ready Mix K-300",
      stock: 300,
      unit: "m3",
      avgPrice: 850000,
      categoryId: matCatStruktur,
      vendorId: "v-1",
    },
    {
      name: "Besi Beton 12mm Ulir",
      stock: 1200,
      unit: "batang",
      avgPrice: 135000,
      categoryId: matCatStruktur,
      vendorId: "v-2",
    },
    {
      name: "AC Split Daikin 1.5PK",
      stock: 320,
      unit: "unit",
      avgPrice: 5200000,
      categoryId: matCatMekanikal,
      vendorId: "v-4",
    },
  ];
  for (const m of materialData) {
    await prisma.material.create({
      data: m,
    });
  }
  console.log(`✅ Materials: ${materialData.length} materials`);
  const taskData = [
    {
      projectId: projects[0].id,
      assigneeId: "u-mandor",
      title: "Persiapan lahan & fondasi",
      status: "DONE" as const,
      priority: "HIGH" as const,
      startDate: new Date("2026-03-01"),
      dueDate: new Date("2026-04-15"),
      completedAt: new Date("2026-04-10"),
    },
    {
      projectId: projects[0].id,
      assigneeId: "u-mandor",
      title: "Struktur baja lantai B1-G",
      status: "DONE" as const,
      priority: "HIGH" as const,
      startDate: new Date("2026-04-16"),
      dueDate: new Date("2026-05-31"),
      completedAt: new Date("2026-05-28"),
    },
    {
      projectId: projects[0].id,
      assigneeId: "u-mandor",
      title: "Struktur baja lantai 1-3",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      startDate: new Date("2026-06-01"),
      dueDate: new Date("2026-07-31"),
    },
    {
      projectId: projects[0].id,
      assigneeId: "u-arsitek",
      title: "Desain interior lobi utama",
      status: "REVIEW" as const,
      priority: "MEDIUM" as const,
      startDate: new Date("2026-06-15"),
      dueDate: new Date("2026-07-15"),
    },
    {
      projectId: projects[0].id,
      assigneeId: "u-qc",
      title: "QC inspeksi struktur B1",
      status: "DONE" as const,
      priority: "HIGH" as const,
      startDate: new Date("2026-05-25"),
      dueDate: new Date("2026-06-01"),
      completedAt: new Date("2026-05-30"),
    },
    {
      projectId: projects[0].id,
      assigneeId: "u-mandor",
      title: "Instalasi MEP lantai B1-G",
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      startDate: new Date("2026-08-01"),
      dueDate: new Date("2026-09-30"),
    },
    {
      projectId: projects[1].id,
      assigneeId: "u-mandor",
      title: "Fondasi & basement",
      status: "DONE" as const,
      priority: "HIGH" as const,
      startDate: new Date("2026-05-15"),
      dueDate: new Date("2026-06-15"),
      completedAt: new Date("2026-06-12"),
    },
    {
      projectId: projects[1].id,
      assigneeId: "u-mandor",
      title: "Struktur lantai 1-2",
      status: "DONE" as const,
      priority: "HIGH" as const,
      startDate: new Date("2026-06-16"),
      dueDate: new Date("2026-07-15"),
      completedAt: new Date("2026-07-14"),
    },
    {
      projectId: projects[1].id,
      assigneeId: "u-mandor",
      title: "Struktur lantai 3 & rooftop",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      startDate: new Date("2026-07-16"),
      dueDate: new Date("2026-08-15"),
    },
    {
      projectId: projects[1].id,
      assigneeId: "u-arsitek",
      title: "Interior finishing — kitchen",
      status: "IN_PROGRESS" as const,
      priority: "MEDIUM" as const,
      startDate: new Date("2026-07-01"),
      dueDate: new Date("2026-08-30"),
    },
    {
      projectId: projects[1].id,
      assigneeId: "u-arsitek",
      title: "Desain infinity pool",
      status: "DONE" as const,
      priority: "MEDIUM" as const,
      startDate: new Date("2026-06-01"),
      dueDate: new Date("2026-06-30"),
      completedAt: new Date("2026-06-28"),
    },
    {
      projectId: projects[4].id,
      assigneeId: "u-mandor",
      title: "Demolisi lantai 3",
      status: "DONE" as const,
      priority: "URGENT" as const,
      startDate: new Date("2026-04-01"),
      dueDate: new Date("2026-04-15"),
      completedAt: new Date("2026-04-14"),
    },
    {
      projectId: projects[4].id,
      assigneeId: "u-mandor",
      title: "Instalasi listrik ICU Neonatal",
      status: "BLOCKED" as const,
      priority: "URGENT" as const,
      startDate: new Date("2026-05-01"),
      dueDate: new Date("2026-06-15"),
    },
    {
      projectId: projects[4].id,
      assigneeId: "u-qc",
      title: "QC — sterile room requirements",
      status: "TODO" as const,
      priority: "HIGH" as const,
      startDate: new Date("2026-07-01"),
      dueDate: new Date("2026-07-30"),
    },
    {
      projectId: projects[5].id,
      assigneeId: "u-mandor",
      title: "Pondasi tower A",
      status: "DONE" as const,
      priority: "HIGH" as const,
      startDate: new Date("2026-02-01"),
      dueDate: new Date("2026-03-31"),
      completedAt: new Date("2026-03-28"),
    },
    {
      projectId: projects[5].id,
      assigneeId: "u-mandor",
      title: "Struktur tower A — lantai 1-10",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      startDate: new Date("2026-04-01"),
      dueDate: new Date("2026-08-31"),
    },
    {
      projectId: projects[5].id,
      assigneeId: "u-mandor",
      title: "Pondasi tower B",
      status: "IN_PROGRESS" as const,
      priority: "MEDIUM" as const,
      startDate: new Date("2026-05-01"),
      dueDate: new Date("2026-07-15"),
    },
  ];
  for (const t of taskData) {
    await prisma.task.create({ data: t });
  }
  console.log(`✅ Tasks: ${taskData.length} tasks`);
  const reportData = [
    {
      projectId: projects[0].id,
      reporterId: "u-mandor",
      reportDate: new Date("2026-06-25"),
      percentage: 35,
      description:
        "Pemasangan struktur baja lantai 3 selesai 80%. Persiapan cor lantai 4.",
      weather: "Cerah",
    },
    {
      projectId: projects[0].id,
      reporterId: "u-mandor",
      reportDate: new Date("2026-06-26"),
      percentage: 36,
      description: "Cor lantai 4 dimulai. 10 truck beton ready mix diterima.",
      weather: "Cerah",
    },
    {
      projectId: projects[0].id,
      reporterId: "u-mandor",
      reportDate: new Date("2026-06-27"),
      percentage: 37,
      description: "Cor lantai 4 selesai. QC inspection menunggu.",
      weather: "Mendung",
    },
    {
      projectId: projects[0].id,
      reporterId: "u-mandor",
      reportDate: new Date("2026-06-28"),
      percentage: 38,
      description: "QC passed lantai 4. Persiapan struktur baja lantai 5.",
      weather: "Hujan ringan",
    },
    {
      projectId: projects[1].id,
      reporterId: "u-mandor",
      reportDate: new Date("2026-06-25"),
      percentage: 52,
      description: "Struktur lantai 3 dimulai. Bar-bending 80% selesai.",
      weather: "Cerah",
    },
    {
      projectId: projects[1].id,
      reporterId: "u-mandor",
      reportDate: new Date("2026-06-28"),
      percentage: 55,
      description: "Cor lantai 3 selesai. Pool structure planning ongoing.",
      weather: "Cerah",
    },
    {
      projectId: projects[4].id,
      reporterId: "u-mandor",
      reportDate: new Date("2026-06-20"),
      percentage: 70,
      description:
        "Partisi ruang ICU sudah 90%. Listrik masih pending approval dari RS.",
      weather: "Cerah",
    },
    {
      projectId: projects[4].id,
      reporterId: "u-mandor",
      reportDate: new Date("2026-06-28"),
      percentage: 72,
      description:
        "ON HOLD — menunggu approval manajemen RS untuk shutdown listrik 2 jam.",
      weather: "Cerah",
    },
    {
      projectId: projects[5].id,
      reporterId: "u-mandor",
      reportDate: new Date("2026-06-25"),
      percentage: 20,
      description: "Tower A lantai 8 cor selesai. Tower B fondasi 70%.",
      weather: "Mendung",
    },
    {
      projectId: projects[5].id,
      reporterId: "u-mandor",
      reportDate: new Date("2026-06-28"),
      percentage: 22,
      description: "Tower A lantai 9 preparation. Tower B pile cap casting.",
      weather: "Cerah",
    },
  ];
  for (const r of reportData) {
    await prisma.progressReport.create({ data: r });
  }
  console.log(`✅ Progress Reports: ${reportData.length} reports`);
  const invoiceData = [
    {
      projectId: projects[0].id,
      invoiceNo: "KSI-INV-001",
      amount: 3500000000,
      status: "PAID" as const,
      issuedAt: new Date("2026-04-01"),
      dueDate: new Date("2026-04-30"),
      paidAt: new Date("2026-04-25"),
    },
    {
      projectId: projects[0].id,
      invoiceNo: "KSI-INV-002",
      amount: 1200000000,
      status: "PAID" as const,
      issuedAt: new Date("2026-06-01"),
      dueDate: new Date("2026-06-30"),
      paidAt: new Date("2026-06-28"),
    },
    {
      projectId: projects[0].id,
      invoiceNo: "KSI-INV-003",
      amount: 1500000000,
      status: "SENT" as const,
      issuedAt: new Date("2026-06-28"),
      dueDate: new Date("2026-07-28"),
    },
    {
      projectId: projects[1].id,
      invoiceNo: "KSI-INV-004",
      amount: 1800000000,
      status: "PAID" as const,
      issuedAt: new Date("2026-05-20"),
      dueDate: new Date("2026-06-20"),
      paidAt: new Date("2026-06-18"),
    },
    {
      projectId: projects[1].id,
      invoiceNo: "KSI-INV-005",
      amount: 800000000,
      status: "OVERDUE" as const,
      issuedAt: new Date("2026-06-15"),
      dueDate: new Date("2026-06-25"),
    },
    {
      projectId: projects[4].id,
      invoiceNo: "KSI-INV-006",
      amount: 2500000000,
      status: "PAID" as const,
      issuedAt: new Date("2026-04-10"),
      dueDate: new Date("2026-05-10"),
      paidAt: new Date("2026-05-08"),
    },
    {
      projectId: projects[4].id,
      invoiceNo: "KSI-INV-007",
      amount: 1300000000,
      status: "SENT" as const,
      issuedAt: new Date("2026-06-10"),
      dueDate: new Date("2026-07-10"),
    },
    {
      projectId: projects[5].id,
      invoiceNo: "KSI-INV-008",
      amount: 5000000000,
      status: "PAID" as const,
      issuedAt: new Date("2026-03-01"),
      dueDate: new Date("2026-03-31"),
      paidAt: new Date("2026-03-28"),
    },
    {
      projectId: projects[5].id,
      invoiceNo: "KSI-INV-009",
      amount: 3500000000,
      status: "SENT" as const,
      issuedAt: new Date("2026-06-01"),
      dueDate: new Date("2026-07-01"),
    },
    {
      projectId: projects[5].id,
      invoiceNo: "KSI-INV-010",
      amount: 2000000000,
      status: "DRAFT" as const,
      issuedAt: new Date("2026-06-28"),
      dueDate: new Date("2026-07-28"),
    },
  ];
  for (const i of invoiceData) {
    await prisma.invoice.create({ data: i });
  }
  console.log(`✅ Invoices: ${invoiceData.length} invoices`);
  const paidInvoices = invoiceData.filter((i) => i.status === "PAID");
  const paymentData = paidInvoices.map((inv, idx) => ({
    invoiceNo: inv.invoiceNo,
    amount: inv.amount,
    method: [
      "Bank Transfer",
      "BCA Transfer",
      "Mandiri Transfer",
      "BRI Transfer",
      "Cash",
    ][idx % 5],
    paidAt: inv.paidAt!,
    confirmedById: "u-finance",
    confirmedAt: inv.paidAt!,
  }));
  for (const p of paymentData) {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNo: p.invoiceNo },
    });
    if (invoice) {
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: p.amount,
          method: p.method,
          paidAt: p.paidAt,
          confirmedById: p.confirmedById,
          confirmedAt: p.confirmedAt,
        },
      });
    }
  }
  console.log(
    `✅ Payments: ${paymentData.length} payments (for ${paidInvoices.length} paid invoices)`,
  );
  const notifData = [
    {
      userId: "u-admin",
      type: "ALERT",
      title: "Budget Alert",
      message:
        "Project KSI-005 (RS Ibu & Anak) budget utilization reached 69%. Review recommended.",
      isRead: false,
    },
    {
      userId: "u-admin",
      type: "INFO",
      title: "New User Registered",
      message:
        "Vendor 'UD. Material Bangunan Sentosa' registered and pending verification.",
      isRead: true,
    },
    {
      userId: "u-pm1",
      type: "TASK",
      title: "Task Overdue",
      message:
        "Task 'Instalasi listrik ICU Neonatal' on KSI-005 is blocked. Needs immediate attention.",
      isRead: false,
    },
    {
      userId: "u-pm1",
      type: "REPORT",
      title: "Daily Report Submitted",
      message: "Fajar Nugroho submitted progress report for KSI-001 (38%).",
      isRead: true,
    },
    {
      userId: "u-pm2",
      type: "INVOICE",
      title: "Invoice Overdue",
      message:
        "Invoice KSI-INV-005 (Rp 800M) for Villa Modern Lembang is overdue by 3 days.",
      isRead: false,
    },
    {
      userId: "u-bm",
      type: "APPROVAL",
      title: "Approval Required",
      message:
        "RAB for KSI-004 (SD Harapan Bangsa Phase 2) needs your approval. Total: Rp 3.8B.",
      isRead: false,
    },
    {
      userId: "u-finance",
      type: "PAYMENT",
      title: "Payment Received",
      message:
        "Payment confirmed for KSI-INV-008 (Rp 5B) from PT. Hermawan Development.",
      isRead: true,
    },
    {
      userId: "u-finance",
      type: "ALERT",
      title: "Overdue Invoice",
      message:
        "KSI-INV-005 (Rp 800M) is overdue. Client: PT. Hermawan Development.",
      isRead: false,
    },
    {
      userId: "u-mandor",
      type: "TASK",
      title: "New Task Assigned",
      message:
        "You have been assigned 'Struktur baja lantai 5' on KSI-001. Due: 2026-08-15.",
      isRead: true,
    },
    {
      userId: "u-qc",
      type: "INSPECTION",
      title: "QC Request",
      message: "QC inspection requested for KSI-001 lantai 4. Priority: HIGH.",
      isRead: false,
    },
  ];
  for (const n of notifData) {
    await prisma.notification.create({ data: n });
  }
  console.log(`✅ Notifications: ${notifData.length} notifications`);
  const activityData = [
    {
      userId: "u-mandor",
      projectId: projects[0].id,
      type: "REPORT",
      title: "Progress Report",
      message: "Daily report submitted: 38% completion on KSI-001",
      createdAt: daysAgo(0),
    },
    {
      userId: "u-pm1",
      projectId: projects[0].id,
      type: "TASK",
      title: "Task Updated",
      message: "Task 'Struktur baja lantai 1-3' marked as IN_PROGRESS",
      createdAt: daysAgo(1),
    },
    {
      userId: "u-qc",
      projectId: projects[0].id,
      type: "INSPECTION",
      title: "QC Passed",
      message: "QC inspection passed for KSI-001 lantai 4",
      createdAt: daysAgo(2),
    },
    {
      userId: "u-arsitek",
      projectId: projects[1].id,
      type: "DESIGN",
      title: "Design Upload",
      message: "New 3D render uploaded for Villa Modern kitchen",
      createdAt: daysAgo(3),
    },
    {
      userId: "u-finance",
      projectId: projects[1].id,
      type: "INVOICE",
      title: "Invoice Sent",
      message: "Invoice KSI-INV-005 sent to PT. Hermawan Development",
      createdAt: daysAgo(4),
    },
    {
      userId: "u-bm",
      projectId: projects[4].id,
      type: "APPROVAL",
      title: "Project On Hold",
      message: "KSI-005 placed on hold pending RS management approval",
      createdAt: daysAgo(5),
    },
    {
      userId: "u-admin",
      type: "USER",
      title: "User Created",
      message: "New vendor account 'UD. Material Bangunan Sentosa' created",
      createdAt: daysAgo(6),
    },
    {
      userId: "u-mandor",
      projectId: projects[5].id,
      type: "REPORT",
      title: "Progress Report",
      message: "Tower A lantai 8 cor completed. Tower B pile cap 70%.",
      createdAt: daysAgo(0),
    },
    {
      userId: "u-pm2",
      projectId: projects[5].id,
      type: "MILESTONE",
      title: "Milestone Reached",
      message: "Tower A foundation 100% completed on schedule",
      createdAt: daysAgo(10),
    },
    {
      userId: "u-owner",
      type: "SYSTEM",
      title: "System Update",
      message: "Smart Konstruksi v2.0 deployed to production",
      createdAt: daysAgo(15),
    },
  ];
  for (const a of activityData) {
    await prisma.activityLog.create({ data: a });
  }
  console.log(`✅ Activity Logs: ${activityData.length} logs`);
  await seedDocuments();
  console.log(
    "\n═══════════════════════════════════════════════════════════════",
  );
  console.log("  ✅ FULL SEED COMPLETED — SMART KONSTRUKSI");
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log(`
  📊 Summary:
  ├── 2 branches (Jakarta, Bandung)
  ├── ${userData.length} users (12 roles)
  ├── ${clients.length} client profiles
  ├── ${vendors.length} vendors (3 verified)
  ├── ${categories.length} material categories
  ├── ${projects.length} projects (3 active, 1 completed, 1 planning, 1 on-hold)
  ├── ${materialData.length} materials
  ├── ${taskData.length} tasks
  ├── ${reportData.length} progress reports
  ├── ${invoiceData.length} invoices (4 paid, 3 sent, 1 overdue, 1 draft)
  ├── ${paymentData.length} payments (linked to paid invoices)
  ├── ${notifData.length} notifications
  ├── ${activityData.length} activity logs
  └── documents (15 seeded with dummy files)
  🔑 Login Credentials ${seedPasswordLabel}:
  ├── admin@ksi.co.id       → SUPER_ADMIN
  ├── owner@ksi.co.id       → OWNER
  ├── bm@ksi.co.id          → BRANCH_MANAGER
  ├── pm@ksi.co.id          → PROJECT_MANAGER
  ├── pm2@ksi.co.id         → PROJECT_MANAGER
  ├── mandor@ksi.co.id      → SITE_MANAGER
  ├── arsitek@ksi.co.id     → ARSITEK
  ├── qc@ksi.co.id          → QC_INSPECTOR
  ├── finance@ksi.co.id     → FINANCE
  ├── adminktr@ksi.co.id    → ADMIN_KANTOR
  ├── vendor@ksi.co.id      → VENDOR
  ├── client@ksi.co.id      → CLIENT (Rina)
  ├── client2@ksi.co.id     → CLIENT (Surya)
  └── client3@ksi.co.id     → CLIENT (Maya)
`);
}
async function main() {
  console.log(
    `\n🚀 Smart Konstruksi Seed — Mode: ${isFullMode ? "FULL (dev)" : "MINIMAL (prod/staging)"}\n`,
  );
  await cleanup();
  if (isFullMode) {
    await seedFull();
  } else {
    await seedMinimal();
  }
}
main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
