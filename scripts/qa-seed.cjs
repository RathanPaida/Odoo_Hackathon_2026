// scripts/qa-seed.cjs
// Comprehensive QA seed for AssetFlow ERP.
// Clears QA tables and populates realistic demo data per the QA specification.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const now = new Date();
const daysAgo = (d) => new Date(now.getTime() - d * 86400000);
const daysAhead = (d) => new Date(now.getTime() + d * 86400000);
const hoursAgo = (h) => new Date(now.getTime() - h * 3600000);
const hoursAhead = (h) => new Date(now.getTime() + h * 3600000);

const FIRST = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Aarav", "Diya", "Vihaan", "Ananya", "Kabir", "Isha", "Arjun", "Navya"];
const LAST = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Lee", "Singh", "Patel", "Kumar", "Sharma", "Gupta", "Reddy", "Nair", "Mehta", "Iyer"];

async function clear() {
  // delete children first (no cascade on most relations)
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.returnRequest.deleteMany({});
  await prisma.transferRequest.deleteMany({});
  await prisma.maintenanceRequest.deleteMany({});
  await prisma.resourceBooking.deleteMany({});
  await prisma.assetAllocation.deleteMany({});
  await prisma.assetHistory.deleteMany({});
  await prisma.auditItem.deleteMany({});
  await prisma.auditorAssignment.deleteMany({});
  await prisma.auditCycle.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.assetCategory.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.emailVerification.deleteMany({});
  await prisma.passwordReset.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});
}

async function main() {
  await clear();

  // ---- Departments ----
  const deptDefs = [
    { name: "IT", code: "IT", description: "Information Technology" },
    { name: "HR", code: "HR", description: "Human Resources" },
    { name: "Finance", code: "FIN", description: "Finance & Accounting" },
    { name: "Operations", code: "OPS", description: "Operations" },
    { name: "Administration", code: "ADM", description: "Administration" },
  ];
  const depts = {};
  for (const d of deptDefs) {
    depts[d.code] = await prisma.department.create({ data: { ...d, status: "ACTIVE" } });
  }

  // ---- Users ----
  const hash = await bcrypt.hash("x", 12); // placeholder, replaced per user
  const mk = async (email, pw, first, last, role, employeeId, deptCode) => {
    const h = await bcrypt.hash(pw, 12);
    return prisma.user.create({
      data: {
        email, passwordHash: h, firstName: first, lastName: last, role,
        status: "ACTIVE", emailVerified: true, employeeId,
        departmentId: deptCode ? depts[deptCode].id : null,
      },
    });
  };

  const admin = await mk("admin@assetflow.com", "Admin@123", "Alice", "Nguyen", "ADMIN", "ADM-001", "ADM");
  const mgr1 = await mk("manager1@assetflow.com", "Manager@123", "Brian", "Carter", "ASSET_MANAGER", "MGR-001", "IT");
  const mgr2 = await mk("manager2@assetflow.com", "Manager@123", "Carol", "Wong", "ASSET_MANAGER", "MGR-002", "OPS");
  const headIT = await mk("head-it@assetflow.com", "Head@123", "David", "Kim", "DEPARTMENT_HEAD", "HOD-IT", "IT");
  const headHR = await mk("head-hr@assetflow.com", "Head@123", "Emma", "Lopez", "DEPARTMENT_HEAD", "HOD-HR", "HR");
  const headFIN = await mk("head-fin@assetflow.com", "Head@123", "Frank", "Das", "DEPARTMENT_HEAD", "HOD-FIN", "FIN");

  // link department heads
  await prisma.department.update({ where: { id: depts.IT.id }, data: { headId: headIT.id } });
  await prisma.department.update({ where: { id: depts.HR.id }, data: { headId: headHR.id } });
  await prisma.department.update({ where: { id: depts.FIN.id }, data: { headId: headFIN.id } });

  // 15 employees across departments
  const empDept = ["IT", "HR", "FIN", "OPS", "ADM"];
  const employees = [];
  for (let i = 1; i <= 15; i++) {
    const f = FIRST[(i * 3) % FIRST.length];
    const l = LAST[(i * 5) % LAST.length];
    const code = empDept[(i - 1) % empDept.length];
    const e = await mk(
      `emp${String(i).padStart(3, "0")}@assetflow.com`,
      "Employee@123",
      f, l, "EMPLOYEE", `EMP${String(i).padStart(3, "0")}`, code
    );
    employees.push(e);
  }

  // ---- Categories ----
  const catNames = ["Laptop", "Desktop", "Printer", "Projector", "Vehicle", "Meeting Room", "Furniture", "Monitor", "Keyboard", "Mouse", "Networking Equipment", "Tablet", "Mobile Phone"];
  const bookableCats = new Set(["Projector", "Vehicle", "Meeting Room", "Tablet", "Mobile Phone", "Networking Equipment"]);
  const cats = {};
  for (const n of catNames) {
    cats[n] = await prisma.assetCategory.create({ data: { name: n, description: n + " category" } });
  }

  // ---- Assets (~50) ----
  const statusPlan = [
    ...Array(20).fill("AVAILABLE"),
    ...Array(15).fill("ALLOCATED"),
    ...Array(5).fill("RESERVED"),
    ...Array(5).fill("UNDER_MAINTENANCE"),
    ...Array(3).fill("RETIRED"),
    "LOST", "DISPOSED",
  ];
  const conditions = ["NEW", "GOOD", "FAIR", "POOR"];
  const locations = ["HQ Floor 1", "HQ Floor 2", "Warehouse", "Remote", "Datacenter", "Branch Office"];
  const assets = [];
  let serial = 1000;
  for (let i = 0; i < statusPlan.length; i++) {
    const catName = catNames[i % catNames.length];
    const status = statusPlan[i];
    const cat = cats[catName];
    const deptCode = empDept[i % empDept.length];
    const isBookable = bookableCats.has(catName);
    const a = await prisma.asset.create({
      data: {
        name: `${catName} #${i + 1}`,
        assetTag: `AST-${String(1000 + i)}`,
        serialNumber: `SN-${serial++}`,
        acquisitionDate: daysAgo(200 + i * 5),
        acquisitionCost: 300 + (i % 7) * 150,
        condition: conditions[i % conditions.length],
        location: locations[i % locations.length],
        isBookable,
        status,
        categoryId: cat.id,
        departmentId: depts[deptCode].id,
        holderId: status === "ALLOCATED" ? employees[i % employees.length].id : null,
      },
    });
    await prisma.assetHistory.create({
      data: { assetId: a.id, action: "CREATED", performedById: admin.id, departmentId: depts[deptCode].id, notes: "Seeded asset" },
    });
    assets.push(a);
  }
  const byStatus = (s) => assets.filter((a) => a.status === s);
  const availableAssets = byStatus("AVAILABLE");
  const allocatedAssets = byStatus("ALLOCATED");
  const maintAssets = byStatus("UNDER_MAINTENANCE");
  const bookableAssets = assets.filter((a) => a.isBookable && a.status === "AVAILABLE");

  // ---- Allocations (active for every allocated asset + upcoming/overdue) ----
  for (let i = 0; i < allocatedAssets.length; i++) {
    const a = allocatedAssets[i];
    if (!a) break;
    await prisma.assetAllocation.create({
      data: { assetId: a.id, userId: a.holderId, departmentId: a.departmentId, allocatedById: mgr1.id, allocatedAt: daysAgo(10 + i), expectedReturnDate: daysAhead(20 + i), conditionNotes: "Good condition", isActive: true },
    });
  }
  for (let i = 0; i < 5; i++) {
    const a = availableAssets[i];
    await prisma.assetAllocation.create({
      data: { assetId: a.id, userId: employees[(i + 2) % employees.length].id, departmentId: a.departmentId, allocatedById: mgr2.id, allocatedAt: daysAgo(2 + i), expectedReturnDate: daysAhead(3 + i), isActive: true },
    });
  }
  for (let i = 0; i < 5; i++) {
    const a = availableAssets[i + 5];
    await prisma.assetAllocation.create({
      data: { assetId: a.id, userId: employees[(i + 7) % employees.length].id, departmentId: a.departmentId, allocatedById: mgr2.id, allocatedAt: daysAgo(40 + i), expectedReturnDate: daysAgo(5 + i), isActive: true },
    });
  }

  // ---- Bookings ----
  const bookingPlans = [
    { status: "UPCOMING", start: daysAhead(2), end: daysAhead(4) },
    { status: "UPCOMING", start: daysAhead(7), end: daysAhead(9) },
    { status: "COMPLETED", start: daysAgo(10), end: daysAgo(8) },
    { status: "COMPLETED", start: daysAgo(20), end: daysAgo(18) },
    { status: "CANCELLED", start: daysAhead(1), end: daysAhead(3) },
    { status: "CURRENT", start: hoursAgo(2), end: hoursAhead(2) },
  ];
  for (let i = 0; i < bookingPlans.length; i++) {
    const p = bookingPlans[i];
    const asset = bookableAssets[i % bookableAssets.length];
    if (!asset) break;
    await prisma.resourceBooking.create({
      data: { assetId: asset.id, userId: employees[i % employees.length].id, startTime: p.start, endTime: p.end, purpose: `Booking ${i + 1}`, status: p.status },
    });
  }

  // ---- Maintenance ----
  const maintPlans = [
    { status: "PENDING" },
    { status: "APPROVED", approvedAt: daysAgo(3) },
    { status: "REJECTED", approvedAt: daysAgo(2) },
    { status: "IN_PROGRESS", approvedAt: daysAgo(5) },
    { status: "RESOLVED", approvedAt: daysAgo(8), resolvedAt: daysAgo(2) },
  ];
  for (let i = 0; i < maintPlans.length; i++) {
    const p = maintPlans[i];
    const asset = maintAssets[i % maintAssets.length] || availableAssets[i];
    await prisma.maintenanceRequest.create({
      data: {
        assetId: asset.id, requestedById: employees[i % employees.length].id,
        issueDescription: `Issue ${i + 1}: device not powering on`, priority: ["LOW", "MEDIUM", "HIGH", "CRITICAL"][i % 4],
        status: p.status, approvedById: p.approvedAt ? mgr1.id : null, approvedAt: p.approvedAt || null,
        resolvedAt: p.resolvedAt || null, technicianId: p.status === "IN_PROGRESS" || p.status === "RESOLVED" ? mgr1.id : null,
      },
    });
  }

  // ---- Transfers (PENDING, APPROVED, REJECTED) ----
  const tPending = allocatedAssets[0];
  if (tPending) {
    await prisma.transferRequest.create({
      data: { assetId: tPending.id, requestedById: tPending.holderId, fromUserId: tPending.holderId, toUserId: employees[1].id, fromDeptId: tPending.departmentId, toDeptId: employees[1].departmentId, reason: "Reassignment", status: "PENDING" },
    });
  }
  const tAppr = allocatedAssets[1] || allocatedAssets[0];
  if (tAppr) {
    const toUser = employees[3];
    await prisma.transferRequest.create({
      data: { assetId: tAppr.id, requestedById: tAppr.holderId, fromUserId: tAppr.holderId, toUserId: toUser.id, fromDeptId: tAppr.departmentId, toDeptId: toUser.departmentId, reason: "Dept move", status: "APPROVED", reviewedById: mgr1.id, reviewedAt: daysAgo(1) },
    });
    // reflect approval on asset
    await prisma.asset.update({ where: { id: tAppr.id }, data: { holderId: toUser.id, departmentId: toUser.departmentId } });
    await prisma.assetHistory.create({ data: { assetId: tAppr.id, action: "TRANSFERRED", performedById: mgr1.id, fromUserId: tAppr.holderId, toUserId: toUser.id, departmentId: toUser.departmentId, notes: "Approved transfer" } });
  }
  const tRej = allocatedAssets[2] || allocatedAssets[0];
  if (tRej) {
    await prisma.transferRequest.create({
      data: { assetId: tRej.id, requestedById: tRej.holderId, fromUserId: tRej.holderId, toUserId: employees[4].id, fromDeptId: tRej.departmentId, toDeptId: employees[4].departmentId, reason: "Temp need", status: "REJECTED", reviewedById: mgr2.id, reviewedAt: daysAgo(1) },
    });
  }

  // ---- Returns (PENDING, APPROVED, REJECTED, COMPLETED) ----
  const rPending = allocatedAssets[3];
  if (rPending) await prisma.returnRequest.create({ data: { assetId: rPending.id, requestedById: rPending.holderId, conditionNotes: "Returning", status: "PENDING" } });
  const rAppr = allocatedAssets[4];
  if (rAppr) {
    await prisma.returnRequest.create({ data: { assetId: rAppr.id, requestedById: rAppr.holderId, conditionNotes: "OK", status: "APPROVED", reviewedById: mgr1.id, reviewedAt: daysAgo(1) } });
    await prisma.asset.update({ where: { id: rAppr.id }, data: { status: "AVAILABLE", holderId: null } });
    await prisma.assetAllocation.updateMany({ where: { assetId: rAppr.id, isActive: true }, data: { isActive: false, actualReturnDate: daysAgo(1) } });
  }
  const rRej = allocatedAssets[5];
  if (rRej) await prisma.returnRequest.create({ data: { assetId: rRej.id, requestedById: rRej.holderId, conditionNotes: "Worn", status: "REJECTED", reviewedById: mgr2.id, reviewedAt: daysAgo(1) } });
  const rComp = allocatedAssets[6];
  if (rComp) {
    await prisma.returnRequest.create({ data: { assetId: rComp.id, requestedById: rComp.holderId, conditionNotes: "Returned", status: "COMPLETED", reviewedById: mgr1.id, reviewedAt: daysAgo(2) } });
    await prisma.asset.update({ where: { id: rComp.id }, data: { status: "AVAILABLE", holderId: null } });
    await prisma.assetAllocation.updateMany({ where: { assetId: rComp.id, isActive: true }, data: { isActive: false, actualReturnDate: daysAgo(2) } });
  }

  // ---- Notifications ----
  const notifTypes = [
    { type: "ASSET_ASSIGNED", title: "Asset Assigned", read: false },
    { type: "BOOKING_CONFIRMED", title: "Booking Confirmed", read: false },
    { type: "BOOKING_REMINDER", title: "Booking Reminder", read: false },
    { type: "BOOKING_CANCELLED", title: "Booking Cancelled", read: true },
    { type: "MAINTENANCE_APPROVED", title: "Maintenance Approved", read: false },
    { type: "MAINTENANCE_REJECTED", title: "Maintenance Rejected", read: true },
    { type: "TRANSFER_APPROVED", title: "Transfer Approved", read: false },
    { type: "TRANSFER_REJECTED", title: "Transfer Rejected", read: true },
    { type: "RETURN_REMINDER", title: "Return Reminder", read: false },
    { type: "OVERDUE_RETURN", title: "Overdue Return", read: false },
    { type: "AUDIT_NOTIFICATION", title: "Audit Scheduled", read: true },
  ];
  for (let i = 0; i < notifTypes.length; i++) {
    const n = notifTypes[i];
    await prisma.notification.create({
      data: { userId: employees[i % employees.length].id, type: n.type, title: n.title, message: n.title + " message", link: "/dashboard/employee", read: n.read, createdAt: daysAgo(i) },
    });
  }

  // ---- Activity Logs ----
  const acts = ["LOGIN", "LOGOUT", "BOOKING", "TRANSFER", "MAINTENANCE", "RETURN", "PROFILE_UPDATE", "ALLOCATION", "NOTIFICATION"];
  for (let i = 0; i < acts.length; i++) {
    const a = acts[i];
    await prisma.activityLog.create({
      data: { userId: employees[i % employees.length].id, action: a, entityType: "USER", entityId: employees[i % employees.length].id, details: JSON.stringify({ note: a.toLowerCase() + " event" }), ipAddress: "127.0.0.1", createdAt: daysAgo(i) },
    });
  }

  // Summary counts
  const counts = {
    departments: await prisma.department.count(),
    users: await prisma.user.count(),
    categories: await prisma.assetCategory.count(),
    assets: await prisma.asset.count(),
    allocations: await prisma.assetAllocation.count(),
    bookings: await prisma.resourceBooking.count(),
    maintenance: await prisma.maintenanceRequest.count(),
    transfers: await prisma.transferRequest.count(),
    returns: await prisma.returnRequest.count(),
    notifications: await prisma.notification.count(),
    activities: await prisma.activityLog.count(),
  };
  console.log("QA SEED COMPLETE:", JSON.stringify(counts, null, 2));
  console.log("Credentials:");
  console.log("  Admin : admin@assetflow.com / Admin@123");
  console.log("  Mgr1  : manager1@assetflow.com / Manager@123");
  console.log("  Mgr2  : manager2@assetflow.com / Manager@123");
  console.log("  HeadIT: head-it@assetflow.com / Head@123");
  console.log("  HeadHR: head-hr@assetflow.com / Head@123");
  console.log("  HeadFi: head-fin@assetflow.com / Head@123");
  console.log("  Emp   : emp001@assetflow.com .. emp015@assetflow.com / Employee@123");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
