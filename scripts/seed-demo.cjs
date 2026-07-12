// scripts/seed-demo.cjs
// Dev-only seed: creates a demo EMPLOYEE, department, assets, allocations,
// notifications and related ERP records so the employee module can be exercised.
// Run: node scripts/seed-demo.cjs
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const PASSWORD = "Password123!";
const EMP_EMAIL = "employee@assetflow.dev";
const COL_EMAIL = "colleague@assetflow.dev";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const dept = await prisma.department.upsert({
    where: { code: "ENG" },
    update: {},
    create: { name: "Engineering", code: "ENG", description: "Engineering department", status: "ACTIVE" },
  });

  const employee = await prisma.user.upsert({
    where: { email: EMP_EMAIL },
    update: { passwordHash, departmentId: dept.id, status: "ACTIVE", emailVerified: true, role: "EMPLOYEE" },
    create: {
      email: EMP_EMAIL,
      passwordHash,
      firstName: "Emp",
      lastName: "Loyee",
      role: "EMPLOYEE",
      status: "ACTIVE",
      emailVerified: true,
      departmentId: dept.id,
      employeeId: "EMP-001",
    },
  });

  const colleague = await prisma.user.upsert({
    where: { email: COL_EMAIL },
    update: {},
    create: {
      email: COL_EMAIL,
      passwordHash,
      firstName: "Col",
      lastName: "League",
      role: "EMPLOYEE",
      status: "ACTIVE",
      emailVerified: true,
      departmentId: dept.id,
      employeeId: "EMP-002",
    },
  });

  let cat = await prisma.assetCategory.findFirst({ where: { name: "Laptops" } });
  if (!cat) {
    cat = await prisma.assetCategory.create({ data: { name: "Laptops", description: "Portable computers" } });
  }

  const asset = await prisma.asset.upsert({
    where: { assetTag: "LAP-0001" },
    update: {},
    create: {
      name: 'MacBook Pro 14"',
      assetTag: "LAP-0001",
      serialNumber: "SN-MBP-0001",
      condition: "GOOD",
      status: "IN_USE",
      isBookable: true,
      categoryId: cat.id,
      departmentId: dept.id,
      holderId: employee.id,
      location: "Bangalore",
    },
  });

  const existingAlloc = await prisma.assetAllocation.findFirst({
    where: { assetId: asset.id, userId: employee.id, isActive: true },
  });
  if (!existingAlloc) {
    await prisma.assetAllocation.create({
      data: {
        assetId: asset.id,
        userId: employee.id,
        departmentId: dept.id,
        allocatedById: employee.id,
        isActive: true,
      },
    });
  }

  // Idempotent: clear previous demo records for this employee, then recreate.
  await prisma.notification.deleteMany({ where: { userId: employee.id } });
  await prisma.activityLog.deleteMany({ where: { userId: employee.id } });
  await prisma.maintenanceRequest.deleteMany({ where: { requestedById: employee.id } });
  await prisma.transferRequest.deleteMany({ where: { requestedById: employee.id } });
  await prisma.resourceBooking.deleteMany({ where: { userId: employee.id } });
  await prisma.returnRequest.deleteMany({ where: { requestedById: employee.id } });

  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  await prisma.maintenanceRequest.create({
    data: {
      assetId: asset.id,
      requestedById: employee.id,
      issueDescription: "Battery draining quickly and trackpad sticky.",
      priority: "HIGH",
      status: "PENDING",
    },
  });

  await prisma.transferRequest.create({
    data: {
      assetId: asset.id,
      requestedById: employee.id,
      fromUserId: employee.id,
      toUserId: colleague.id,
      reason: "Moving to a different team.",
      status: "PENDING",
    },
  });

  await prisma.resourceBooking.create({
    data: {
      assetId: asset.id,
      userId: employee.id,
      startTime: new Date(now.getTime() + day),
      endTime: new Date(now.getTime() + day + 2 * 60 * 60 * 1000),
      purpose: "Client demo session",
      status: "UPCOMING",
    },
  });

  await prisma.returnRequest.create({
    data: {
      assetId: asset.id,
      requestedById: employee.id,
      conditionNotes: "Returning due to hardware upgrade.",
      status: "PENDING",
    },
  });

  const notifications = [
    { type: "TRANSFER", title: "Transfer request received", message: "We received your request to transfer MacBook Pro 14\".", read: false, link: "/dashboard/employee/transfers" },
    { type: "MAINTENANCE", title: "Maintenance update", message: "Your maintenance request is pending technician assignment.", read: false, link: "/dashboard/employee/maintenance" },
    { type: "RETURN", title: "Return approved", message: "Your asset return has been approved by the manager.", read: true, link: "/dashboard/employee/returns" },
    { type: "BOOKING", title: "Booking confirmed", message: "Your booking for MacBook Pro 14\" is confirmed.", read: false, link: "/dashboard/employee/bookings" },
    { type: "GENERAL", title: "Welcome to AssetFlow", message: "Complete your profile to get the most out of the portal.", read: false, link: "/dashboard/employee" },
    { type: "SECURITY", title: "New login detected", message: "A new sign-in to your account was detected.", read: true, link: "/dashboard/employee" },
  ];
  for (const n of notifications) {
    await prisma.notification.create({
      data: { userId: employee.id, type: n.type, title: n.title, message: n.message, link: n.link, read: n.read },
    });
  }

  await prisma.activityLog.create({
    data: { userId: employee.id, action: "LOGIN", entityType: "USER", entityId: employee.id, details: JSON.stringify({ ip: "127.0.0.1" }) },
  });
  await prisma.activityLog.create({
    data: { userId: employee.id, action: "MAINTENANCE_REQUESTED", entityType: "MAINTENANCE", entityId: asset.id, details: JSON.stringify({ assetId: asset.id }) },
  });

  const unread = await prisma.notification.count({ where: { userId: employee.id, read: false } });
  console.log("Seed complete.");
  console.log("  Employee :", EMP_EMAIL, "/", PASSWORD, "(role", employee.role + ")");
  console.log("  Colleague:", COL_EMAIL, "/", PASSWORD);
  console.log("  Asset    :", asset.assetTag, asset.name);
  console.log("  Notifications:", notifications.length, "(unread:", unread + ")");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
