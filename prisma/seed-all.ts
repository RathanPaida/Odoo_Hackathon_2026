// prisma/seed-all.ts
// Comprehensive seed: users, departments, assets, allocations, transfers,
// bookings, maintenance, audits, notifications, activity logs, return requests.
// Run: npx tsx prisma/seed-all.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

async function hash(pw: string) {
  return bcrypt.hash(pw, 12);
}

async function main() {
  const pw = await hash("Admin@123456");

  // ── Users ──────────────────────────────────────────────
  const usersData = [
    { email: "admin@oodoprep.com", firstName: "Rajesh", lastName: "Kumar", role: "ADMIN" },
    { email: "manager@oodoprep.com", firstName: "Priya", lastName: "Sharma", role: "ASSET_MANAGER" },
    { email: "head@oodoprep.com", firstName: "Ankit", lastName: "Verma", role: "DEPARTMENT_HEAD" },
    { email: "head2@oodoprep.com", firstName: "Sneha", lastName: "Patel", role: "DEPARTMENT_HEAD" },
    { email: "emp1@oodoprep.com", firstName: "Vikram", lastName: "Singh", role: "EMPLOYEE" },
    { email: "emp2@oodoprep.com", firstName: "Meera", lastName: "Nair", role: "EMPLOYEE" },
    { email: "emp3@oodoprep.com", firstName: "Arjun", lastName: "Reddy", role: "EMPLOYEE" },
    { email: "emp4@oodoprep.com", firstName: "Kavya", lastName: "Iyer", role: "EMPLOYEE" },
    { email: "emp5@oodoprep.com", firstName: "Rohan", lastName: "Gupta", role: "EMPLOYEE" },
    { email: "emp6@oodoprep.com", firstName: "Divya", lastName: "Joshi", role: "EMPLOYEE" },
  ];

  const users: Record<string, any> = {};
  for (const u of usersData) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      users[u.email] = existing;
    } else {
      users[u.email] = await prisma.user.create({
        data: { ...u, passwordHash: pw, emailVerified: true, status: "ACTIVE" },
      });
      console.log(`Created user: ${u.email}`);
    }
  }

  // ── Departments ────────────────────────────────────────
  const deptsData = [
    { name: "Headquarters", code: "HQ-01", desc: "Main HQ" },
    { name: "IT Operations", code: "IT-01", desc: "IT & Engineering" },
    { name: "Finance", code: "FIN-01", desc: "Finance & Accounts" },
    { name: "Human Resources", code: "HR-01", desc: "People & Culture" },
    { name: "Marketing", code: "MKT-01", desc: "Brand & Growth" },
  ];

  const depts: Record<string, any> = {};
  for (const d of deptsData) {
    const existing = await prisma.department.findUnique({ where: { code: d.code } });
    if (existing) {
      depts[d.code] = existing;
    } else {
      depts[d.code] = await prisma.department.create({
        data: { name: d.name, code: d.code, description: d.desc, parentId: depts["HQ-01"]?.id },
      });
      console.log(`Created dept: ${d.name}`);
    }
  }

  // Assign heads
  await prisma.department.update({ where: { code: "IT-01" }, data: { headId: users["head@oodoprep.com"].id } });
  await prisma.department.update({ where: { code: "FIN-01" }, data: { headId: users["head2@oodoprep.com"].id } });

  // Assign employees to departments
  const empDeptMap: [string, string][] = [
    ["emp1@oodoprep.com", "IT-01"], ["emp2@oodoprep.com", "IT-01"],
    ["emp3@oodoprep.com", "FIN-01"], ["emp4@oodoprep.com", "HR-01"],
    ["emp5@oodoprep.com", "MKT-01"], ["emp6@oodoprep.com", "MKT-01"],
    ["head@oodoprep.com", "IT-01"], ["head2@oodoprep.com", "FIN-01"],
    ["manager@oodoprep.com", "HQ-01"],
  ];
  for (const [email, code] of empDeptMap) {
    await prisma.user.update({ where: { email }, data: { departmentId: depts[code].id } });
  }

  // ── Asset Categories ───────────────────────────────────
  const catsData = [
    { name: "Laptops", desc: "Notebooks & Ultrabooks" },
    { name: "Monitors", desc: "Desktop Displays" },
    { name: "Phones", desc: "Mobile Devices" },
    { name: "Furniture", desc: "Desks & Chairs" },
    { name: "Vehicles", desc: "Company Vehicles" },
    { name: "Projectors", desc: "Presentation Equipment" },
  ];

  const cats: Record<string, any> = {};
  for (const c of catsData) {
    const existing = await prisma.assetCategory.findFirst({ where: { name: c.name } });
    if (existing) {
      cats[c.name] = existing;
    } else {
      cats[c.name] = await prisma.assetCategory.create({
        data: { name: c.name, description: c.desc },
      });
      console.log(`Created category: ${c.name}`);
    }
  }

  // ── Assets ─────────────────────────────────────────────
  const assetsData = [
    { name: "MacBook Pro 14\"", tag: "LAP-001", serial: "C02X12345", cat: "Laptops", status: "ALLOCATED", cond: "GOOD", cost: 199999, loc: "IT Floor 3", dept: "IT-01", holder: "emp1@oodoprep.com" },
    { name: "MacBook Air M2", tag: "LAP-002", serial: "C02Y67890", cat: "Laptops", status: "ALLOCATED", cond: "NEW", cost: 129999, loc: "IT Floor 3", dept: "IT-01", holder: "emp2@oodoprep.com" },
    { name: "Dell XPS 15", tag: "LAP-003", serial: "DL8X98765", cat: "Laptops", status: "AVAILABLE", cond: "GOOD", cost: 149999, loc: "Store Room A", dept: "HQ-01" },
    { name: "Lenovo ThinkPad T14", tag: "LAP-004", serial: "LN4T54321", cat: "Laptops", status: "ALLOCATED", cond: "FAIR", cost: 110099, loc: "Finance Wing", dept: "FIN-01", holder: "emp3@oodoprep.com" },
    { name: "HP EliteBook 840", tag: "LAP-005", serial: "HP8G11223", cat: "Laptops", status: "IN_MAINTENANCE", cond: "POOR", cost: 89999, loc: "Service Center", dept: "HR-01", holder: "emp4@oodoprep.com" },

    { name: "Dell UltraSharp 27\"", tag: "MON-001", serial: "DELL27001", cat: "Monitors", status: "ALLOCATED", cond: "NEW", cost: 42999, loc: "IT Floor 3", dept: "IT-01", holder: "emp1@oodoprep.com" },
    { name: "LG UltraWide 34\"", tag: "MON-002", serial: "LG34001", cat: "Monitors", status: "AVAILABLE", cond: "GOOD", cost: 55999, loc: "Store Room A", dept: "HQ-01" },
    { name: "Samsung 24\" FHD", tag: "MON-003", serial: "SAM24001", cat: "Monitors", status: "ALLOCATED", cond: "GOOD", cost: 18999, loc: "Finance Wing", dept: "FIN-01", holder: "emp3@oodoprep.com" },
    { name: "BenQ PD2700U", tag: "MON-004", serial: "BENQ27001", cat: "Monitors", status: "ALLOCATED", cond: "NEW", cost: 38999, loc: "Marketing", dept: "MKT-01", holder: "emp5@oodoprep.com" },

    { name: "iPhone 15 Pro", tag: "PHN-001", serial: "APL15P001", cat: "Phones", status: "ALLOCATED", cond: "NEW", cost: 134900, loc: "IT Floor 3", dept: "IT-01", holder: "emp2@oodoprep.com" },
    { name: "Samsung Galaxy S24", tag: "PHN-002", serial: "SAM24P001", cat: "Phones", status: "AVAILABLE", cond: "GOOD", cost: 74999, loc: "Store Room A", dept: "HQ-01" },
    { name: "OnePlus 12", tag: "PHN-003", serial: "OP12P001", cat: "Phones", status: "ALLOCATED", cond: "GOOD", cost: 64999, loc: "Marketing", dept: "MKT-01", holder: "emp6@oodoprep.com" },

    { name: "Herman Miller Aeron", tag: "FRN-001", serial: "HM-AER01", cat: "Furniture", status: "ALLOCATED", cond: "GOOD", cost: 98000, loc: "IT Floor 3", dept: "IT-01", holder: "emp1@oodoprep.com" },
    { name: "Standing Desk - FlexiSpot", tag: "FRN-002", serial: "FS-SD001", cat: "Furniture", status: "AVAILABLE", cond: "NEW", cost: 35000, loc: "Store Room B", dept: "HQ-01" },
    { name: "ErgoChair Pro", tag: "FRN-003", serial: "EC-PRO01", cat: "Furniture", status: "ALLOCATED", cond: "FAIR", cost: 28000, loc: "Finance Wing", dept: "FIN-01", holder: "emp3@oodoprep.com" },

    { name: "Toyota Innova Crysta", tag: "VEH-001", serial: "MH12AB1234", cat: "Vehicles", status: "AVAILABLE", cond: "GOOD", cost: 2500000, loc: "Parking A", dept: "HQ-01", isBookable: true },
    { name: "Mahindra XUV700", tag: "VEH-002", serial: "KA01CD5678", cat: "Vehicles", status: "ALLOCATED", cond: "NEW", cost: 2200000, loc: "Parking A", dept: "HQ-01", isBookable: true },

    { name: "Epson EB-X51", tag: "PRJ-001", serial: "EPS-X5101", cat: "Projectors", status: "ALLOCATED", cond: "GOOD", cost: 52000, loc: "Marketing", dept: "MKT-01", holder: "emp5@oodoprep.com" },
    { name: "BenQ TH685i", tag: "PRJ-002", serial: "BENQ-TH001", cat: "Projectors", status: "AVAILABLE", cond: "NEW", cost: 78000, loc: "Store Room A", dept: "HQ-01", isBookable: true },
  ];

  const assets: Record<string, any> = {};
  for (const a of assetsData) {
    const existing = await prisma.asset.findUnique({ where: { assetTag: a.tag } });
    if (existing) {
      assets[a.tag] = existing;
    } else {
      assets[a.tag] = await prisma.asset.create({
        data: {
          name: a.name,
          assetTag: a.tag,
          serialNumber: a.serial,
          categoryId: cats[a.cat].id,
          status: a.status,
          condition: a.cond,
          acquisitionCost: a.cost,
          location: a.loc,
          departmentId: depts[a.dept]?.id,
          holderId: a.holder ? users[a.holder].id : null,
          isBookable: (a as any).isBookable ?? false,
          acquisitionDate: daysAgo(Math.floor(Math.random() * 180) + 30),
        },
      });
      console.log(`Created asset: ${a.tag}`);
    }
  }

  // ── Asset Allocations ──────────────────────────────────
  const allocationsData = [
    { asset: "LAP-001", user: "emp1@oodoprep.com", by: "manager@oodoprep.com", dept: "IT-01", daysAgo: 45 },
    { asset: "LAP-002", user: "emp2@oodoprep.com", by: "manager@oodoprep.com", dept: "IT-01", daysAgo: 30 },
    { asset: "LAP-004", user: "emp3@oodoprep.com", by: "manager@oodoprep.com", dept: "FIN-01", daysAgo: 60 },
    { asset: "LAP-005", user: "emp4@oodoprep.com", by: "manager@oodoprep.com", dept: "HR-01", daysAgo: 90 },
    { asset: "MON-001", user: "emp1@oodoprep.com", by: "manager@oodoprep.com", dept: "IT-01", daysAgo: 45 },
    { asset: "MON-003", user: "emp3@oodoprep.com", by: "manager@oodoprep.com", dept: "FIN-01", daysAgo: 55 },
    { asset: "PHN-001", user: "emp2@oodoprep.com", by: "manager@oodoprep.com", dept: "IT-01", daysAgo: 20 },
    { asset: "PHN-003", user: "emp6@oodoprep.com", by: "manager@oodoprep.com", dept: "MKT-01", daysAgo: 15 },
    { asset: "FRN-001", user: "emp1@oodoprep.com", by: "manager@oodoprep.com", dept: "IT-01", daysAgo: 120 },
    { asset: "FRN-003", user: "emp3@oodoprep.com", by: "manager@oodoprep.com", dept: "FIN-01", daysAgo: 80 },
    { asset: "PRJ-001", user: "emp5@oodoprep.com", by: "manager@oodoprep.com", dept: "MKT-01", daysAgo: 10 },
  ];

  for (const a of allocationsData) {
    const existing = await prisma.assetAllocation.findFirst({
      where: { assetId: assets[a.asset].id, userId: users[a.user].id, isActive: true },
    });
    if (!existing) {
      await prisma.assetAllocation.create({
        data: {
          assetId: assets[a.asset].id,
          userId: users[a.user].id,
          allocatedById: users[a.by].id,
          departmentId: depts[a.dept]?.id,
          allocatedAt: daysAgo(a.daysAgo),
          expectedReturnDate: daysFromNow(Math.floor(Math.random() * 60) + 15),
          isActive: true,
        },
      });
      console.log(`Allocated ${a.asset} -> ${a.user}`);
    }
  }

  // ── Asset History ──────────────────────────────────────
  const histActions = ["CREATED", "ALLOCATED", "TRANSFERRED", "MAINTENANCE_REPORTED", "RETURNED"];
  for (const tag of Object.keys(assets).slice(0, 8)) {
    const count = await prisma.assetHistory.count({ where: { assetId: assets[tag].id } });
    if (count === 0) {
      const numEntries = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numEntries; i++) {
        const action = histActions[Math.floor(Math.random() * histActions.length)];
        const empEmails = ["emp1@oodoprep.com", "emp2@oodoprep.com", "emp3@oodoprep.com"];
        const from = users[empEmails[Math.floor(Math.random() * empEmails.length)]];
        const to = users[empEmails[Math.floor(Math.random() * empEmails.length)]];
        await prisma.assetHistory.create({
          data: {
            assetId: assets[tag].id,
            action,
            performedById: users["manager@oodoprep.com"].id,
            fromUserId: from.id,
            toUserId: to.id,
            notes: `Auto: ${action.toLowerCase()} record`,
            createdAt: daysAgo(Math.floor(Math.random() * 30) + 1),
          },
        });
      }
      console.log(`History created for ${tag}`);
    }
  }

  // ── Transfer Requests ──────────────────────────────────
  const transfersData = [
    { asset: "LAP-003", from: "emp1@oodoprep.com", to: "emp5@oodoprep.com", status: "PENDING", reason: "Need a laptop for field work" },
    { asset: "MON-002", from: "emp3@oodoprep.com", to: "emp4@oodoprep.com", status: "APPROVED", reason: "Extra monitor for HR dashboard" },
    { asset: "PHN-002", from: "emp2@oodoprep.com", to: "emp6@oodoprep.com", status: "REJECTED", reason: "Phone not needed for current project" },
  ];

  for (const t of transfersData) {
    const existing = await prisma.transferRequest.findFirst({
      where: { assetId: assets[t.asset].id, status: t.status },
    });
    if (!existing) {
      await prisma.transferRequest.create({
        data: {
          assetId: assets[t.asset].id,
          requestedById: users[t.from].id,
          fromUserId: users[t.from].id,
          toUserId: users[t.to].id,
          reason: t.reason,
          status: t.status,
          reviewedById: t.status !== "PENDING" ? users["manager@oodoprep.com"].id : null,
          reviewedAt: t.status !== "PENDING" ? daysAgo(2) : null,
        },
      });
      console.log(`Transfer ${t.asset}: ${t.status}`);
    }
  }

  // ── Resource Bookings ──────────────────────────────────
  const bookingsData = [
    { asset: "VEH-001", user: "emp5@oodoprep.com", purpose: "Client visit in Pune", status: "UPCOMING", startDays: 3, endDays: 4 },
    { asset: "VEH-002", user: "emp1@oodoprep.com", purpose: "Team offsite event", status: "UPCOMING", startDays: 7, endDays: 8 },
    { asset: "PRJ-002", user: "emp6@oodoprep.com", purpose: "Marketing presentation", status: "COMPLETED", startDays: -5, endDays: -4 },
    { asset: "MON-004", user: "emp5@oodoprep.com", purpose: "Design review session", status: "UPCOMING", startDays: 2, endDays: 2 },
  ];

  for (const b of bookingsData) {
    const existing = await prisma.resourceBooking.findFirst({
      where: { assetId: assets[b.asset].id, userId: users[b.user].id, purpose: b.purpose },
    });
    if (!existing) {
      await prisma.resourceBooking.create({
        data: {
          assetId: assets[b.asset].id,
          userId: users[b.user].id,
          purpose: b.purpose,
          status: b.status,
          startTime: daysFromNow(b.startDays),
          endTime: daysFromNow(b.endDays),
        },
      });
      console.log(`Booking: ${b.purpose}`);
    }
  }

  // ── Maintenance Requests ───────────────────────────────
  const maintData = [
    { asset: "LAP-005", user: "emp4@oodoprep.com", issue: "Screen flickering intermittently", priority: "HIGH", status: "IN_PROGRESS", tech: "emp1@oodoprep.com" },
    { asset: "LAP-001", user: "emp1@oodoprep.com", issue: "Battery drains in 30 minutes", priority: "MEDIUM", status: "PENDING" },
    { asset: "MON-003", user: "emp3@oodoprep.com", issue: "Dead pixels on bottom-right corner", priority: "LOW", status: "RESOLVED", tech: "emp2@oodoprep.com" },
    { asset: "FRN-003", user: "emp3@oodoprep.com", issue: "Chair armrest broken", priority: "MEDIUM", status: "PENDING" },
    { asset: "PRJ-001", user: "emp5@oodoprep.com", issue: "Lamp hours near end, dim image", priority: "LOW", status: "APPROVED", tech: "emp1@oodoprep.com" },
  ];

  for (const m of maintData) {
    const existing = await prisma.maintenanceRequest.findFirst({
      where: { assetId: assets[m.asset].id, issueDescription: m.issue },
    });
    if (!existing) {
      await prisma.maintenanceRequest.create({
        data: {
          assetId: assets[m.asset].id,
          requestedById: users[m.user].id,
          issueDescription: m.issue,
          priority: m.priority,
          status: m.status,
          technicianId: m.tech ? users[m.tech].id : undefined,
          resolvedAt: m.status === "RESOLVED" ? daysAgo(5) : undefined,
        },
      });
      console.log(`Maintenance: ${m.issue.slice(0, 40)}`);
    }
  }

  // ── Return Requests ────────────────────────────────────
  const returnsData = [
    { asset: "LAP-004", user: "emp3@oodoprep.com", status: "PENDING", notes: "Upgraded to new laptop, returning old one" },
    { asset: "MON-001", user: "emp1@oodoprep.com", status: "APPROVED", notes: "Monitor replaced under warranty" },
  ];

  for (const r of returnsData) {
    const existing = await prisma.returnRequest.findFirst({
      where: { assetId: assets[r.asset].id, requestedById: users[r.user].id },
    });
    if (!existing) {
      await prisma.returnRequest.create({
        data: {
          assetId: assets[r.asset].id,
          requestedById: users[r.user].id,
          conditionNotes: r.notes,
          status: r.status,
          reviewedById: r.status !== "PENDING" ? users["manager@oodoprep.com"].id : null,
          reviewedAt: r.status !== "PENDING" ? daysAgo(1) : null,
        },
      });
      console.log(`Return: ${r.asset}: ${r.status}`);
    }
  }

  // ── Audit Cycles ───────────────────────────────────────
  const auditExisting = await prisma.auditCycle.findFirst({ where: { name: "Q1 2026 IT Audit" } });
  let auditCycle: any = auditExisting;
  if (!auditExisting) {
    auditCycle = await prisma.auditCycle.create({
      data: {
        name: "Q1 2026 IT Audit",
        description: "Quarterly audit of all IT department assets",
        scope: "DEPARTMENT",
        scopeValue: depts["IT-01"].id,
        startDate: daysAgo(30),
        endDate: daysFromNow(30),
        status: "IN_PROGRESS",
        createdById: users["admin@oodoprep.com"].id,
      },
    });
    console.log("Created audit cycle");

    await prisma.auditorAssignment.create({
      data: { auditCycleId: auditCycle.id, userId: users["manager@oodoprep.com"].id },
    });

    const itAssets = ["LAP-001", "LAP-002", "MON-001"];
    for (const tag of itAssets) {
      await prisma.auditItem.create({
        data: {
          auditCycleId: auditCycle.id,
          assetId: assets[tag].id,
          auditorId: users["manager@oodoprep.com"].id,
          status: tag === "LAP-001" ? "VERIFIED" : "PENDING",
          notes: tag === "LAP-001" ? "Verified in person" : undefined,
        },
      });
    }
    console.log("Created audit items");
  }

  // ── Notifications ──────────────────────────────────────
  const notifData = [
    { user: "emp1@oodoprep.com", type: "ASSET_ASSIGNED", title: "Asset Allocated", message: "MacBook Pro 14\" has been allocated to you.", read: false },
    { user: "emp1@oodoprep.com", type: "MAINTENANCE", title: "Maintenance Update", message: "Your maintenance request for MacBook Pro has been picked up by a technician.", read: false },
    { user: "emp2@oodoprep.com", type: "TRANSFER", title: "Transfer Approved", message: "Transfer of Samsung Galaxy S24 to Divya Joshi has been approved.", read: true },
    { user: "emp3@oodoprep.com", type: "RETURN", title: "Return Reminder", message: "Dell XPS 15 return is due in 7 days.", read: false },
    { user: "emp5@oodoprep.com", type: "BOOKING", title: "Booking Confirmed", message: "Your vehicle booking for Toyota Innova is confirmed.", read: false },
    { user: "emp6@oodoprep.com", type: "ASSET_ASSIGNED", title: "New Asset Assigned", message: "OnePlus 12 has been assigned to you.", read: true },
    { user: "admin@oodoprep.com", type: "REMINDER", title: "Audit Reminder", message: "Q1 2026 IT Audit is in progress. 2 items pending verification.", read: false },
    { user: "emp4@oodoprep.com", type: "MAINTENANCE", title: "Maintenance In Progress", message: "Your HP EliteBook screen repair is now being worked on.", read: false },
  ];

  for (const n of notifData) {
    const existing = await prisma.notification.findFirst({
      where: { userId: users[n.user].id, title: n.title },
    });
    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: users[n.user].id,
          type: n.type,
          title: n.title,
          message: n.message,
          link: "/dashboard/employee/notifications",
          read: n.read,
        },
      });
    }
  }
  console.log("Created notifications");

  // ── Activity Logs ──────────────────────────────────────
  const activityData = [
    { user: "emp1@oodoprep.com", action: "ASSET_ALLOCATED", entity: "ASSET", entityId: "LAP-001", details: { assetName: "MacBook Pro 14\"" } },
    { user: "emp2@oodoprep.com", action: "ASSET_ALLOCATED", entity: "ASSET", entityId: "LAP-002", details: { assetName: "MacBook Air M2" } },
    { user: "manager@oodoprep.com", action: "TRANSFER_APPROVED", entity: "TRANSFER", entityId: "MON-002", details: { from: "emp3", to: "emp4" } },
    { user: "emp3@oodoprep.com", action: "MAINTENANCE_REQUESTED", entity: "MAINTENANCE", entityId: "MON-003", details: { issue: "Dead pixels" } },
    { user: "emp5@oodoprep.com", action: "BOOKING_CREATED", entity: "BOOKING", entityId: "VEH-001", details: { purpose: "Client visit" } },
    { user: "admin@oodoprep.com", action: "AUDIT_CREATED", entity: "AUDIT", entityId: auditCycle.id, details: { name: "Q1 2026 IT Audit" } },
    { user: "emp4@oodoprep.com", action: "MAINTENANCE_REPORTED", entity: "MAINTENANCE", entityId: "LAP-005", details: { issue: "Screen flickering" } },
    { user: "emp6@oodoprep.com", action: "ASSET_RECEIVED", entity: "ASSET", entityId: "PHN-003", details: { assetName: "OnePlus 12" } },
  ];

  for (const a of activityData) {
    const existing = await prisma.activityLog.findFirst({
      where: { userId: users[a.user].id, action: a.action, entityId: a.entityId },
    });
    if (!existing) {
      await prisma.activityLog.create({
        data: {
          userId: users[a.user].id,
          action: a.action,
          entityType: a.entity,
          entityId: a.entityId,
          details: JSON.stringify(a.details),
          createdAt: daysAgo(Math.floor(Math.random() * 20) + 1),
        },
      });
    }
  }
  console.log("Created activity logs");

  console.log("\n✅ Seed complete! All dummy data inserted.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
