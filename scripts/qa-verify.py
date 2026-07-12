import requests, json, datetime

BASE = "http://localhost:3001"
results = []
def rec(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("PASS" if ok else "FAIL"), "-", name, ("| " + detail) if detail else "")

def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

def login(email, pw):
    s = requests.Session()
    r = s.post(f"{BASE}/api/auth/login", json={"email": email, "password": pw}, timeout=15)
    return s, r

accounts = {
    "ADMIN": ("admin@assetflow.com", "Admin@123"),
    "ASSET_MANAGER": ("manager1@assetflow.com", "Manager@123"),
    "DEPARTMENT_HEAD": ("head-it@assetflow.com", "Head@123"),
    "EMPLOYEE": ("emp001@assetflow.com", "Employee@123"),
}
sessions = {}
for role, (em, pw) in accounts.items():
    s, r = login(em, pw)
    ok = r.status_code == 200 and r.json().get("ok")
    rec(f"Login {role}", ok, f"status={r.status_code}")
    sessions[role] = s
    if ok:
        got = s.get(f"{BASE}/api/auth/me").json().get("data", {}).get("role")
        rec(f"  /auth/me role == {role}", got == role, f"got={got}")

dashboards = {"ADMIN": "/dashboard/admin", "ASSET_MANAGER": "/dashboard/manager",
              "DEPARTMENT_HEAD": "/dashboard/head", "EMPLOYEE": "/dashboard/employee"}
for role, s in sessions.items():
    own = dashboards[role]
    r = s.get(f"{BASE}{own}", allow_redirects=False, timeout=15)
    rec(f"Dashboard {role} loads", r.status_code in (200, 307), f"status={r.status_code}")
    for other_role, other in dashboards.items():
        if other_role == role:
            continue
        r2 = s.get(f"{BASE}{other}", allow_redirects=False, timeout=15)
        if role == "ADMIN":
            # admin is superuser: allowed to view all dashboards
            rec(f"  ADMIN can access {other} (superuser)", r2.status_code == 200, f"status={r2.status_code}")
        else:
            rec(f"  {role} -> {other} blocked/redirected", r2.status_code in (307, 308, 403, 401), f"status={r2.status_code}")

emp = sessions["EMPLOYEE"]; mgr = sessions["ASSET_MANAGER"]; admin = sessions["ADMIN"]
r = emp.get(f"{BASE}/api/admin/users", timeout=15)
rec("Employee blocked from /api/admin/users (403)", r.status_code in (403, 401), f"status={r.status_code}")
r = mgr.get(f"{BASE}/api/admin/users", timeout=15)
rec("Manager blocked from /api/admin/users (403)", r.status_code in (403, 401), f"status={r.status_code}")
r = admin.get(f"{BASE}/api/admin/users", timeout=15)
rec("Admin can access /api/admin/users (200)", r.status_code == 200, f"status={r.status_code}")

for ep in ["assets", "dashboard", "employees", "maintenance", "returns", "transfers", "notifications", "bookings", "activity"]:
    r = emp.get(f"{BASE}/api/employee/{ep}?pageSize=5", timeout=15)
    j = r.json()
    ok = r.status_code == 200 and j.get("ok") is True and isinstance(j.get("data"), dict)
    rec(f"Employee GET /api/employee/{ep}", ok, f"status={r.status_code}")

# booking overlap
bookable = None
ra = emp.get(f"{BASE}/api/employee/assets?pageSize=50", timeout=15).json()
for it in ra.get("data", {}).get("data", []):
    if it.get("isBookable"):
        bookable = it; break
if not bookable:
    rm = mgr.get(f"{BASE}/api/manager/assets?pageSize=50", timeout=15).json()
    for it in rm.get("data", {}).get("data", []):
        if it.get("isBookable"):
            bookable = it; break
if bookable:
    aid = bookable["id"]; T = datetime.datetime.utcnow() + datetime.timedelta(days=120)
    t1, t2 = T, T + datetime.timedelta(hours=2)
    b1 = emp.post(f"{BASE}/api/employee/bookings", json={"assetId": aid, "startTime": iso(t1), "endTime": iso(t2), "purpose": "QA base"}, timeout=15)
    rec("Create base booking (200/201)", b1.status_code in (200, 201), f"status={b1.status_code}")
    if b1.status_code in (200, 201):
        bid = b1.json().get("data", {}).get("id")
        t3, t4 = T + datetime.timedelta(hours=1), T + datetime.timedelta(hours=3)
        bo = emp.post(f"{BASE}/api/employee/bookings", json={"assetId": aid, "startTime": iso(t3), "endTime": iso(t4), "purpose": "QA overlap"}, timeout=15)
        rec("Overlapping booking -> 409 Conflict", bo.status_code == 409, f"status={bo.status_code}")
        t5, t6 = T + datetime.timedelta(hours=2), T + datetime.timedelta(hours=4)
        ba = emp.post(f"{BASE}/api/employee/bookings", json={"assetId": aid, "startTime": iso(t5), "endTime": iso(t6), "purpose": "QA adjacent"}, timeout=15)
        rec("Adjacent (back-to-back) booking -> 200/201", ba.status_code in (200, 201), f"status={ba.status_code}")
        baid = ba.json().get("data", {}).get("id") if ba.status_code in (200, 201) else None
        for xid in (bid, baid):
            if xid:
                emp.patch(f"{BASE}/api/employee/bookings/{xid}", json={"action": "cancel"}, timeout=15)
else:
    rec("Found bookable asset", False, "none")

# notifications
rn = emp.get(f"{BASE}/api/employee/notifications?pageSize=5", timeout=15).json()
nlist = rn.get("data", {}).get("data", [])
if nlist:
    nid = nlist[0]["id"]
    rec("Notification mark-one PATCH", emp.patch(f"{BASE}/api/employee/notifications/{nid}", json={}, timeout=15).status_code == 200)
    rec("Notification mark-all POST", emp.post(f"{BASE}/api/employee/notifications", json={}, timeout=15).status_code == 200)
else:
    rec("Notifications present", False, "none")

# search/filter on employee's own allocations (correct semantics)
my = emp.get(f"{BASE}/api/employee/assets?pageSize=50", timeout=15).json().get("data", {}).get("data", [])
if my:
    tag = my[0]["asset"]["assetTag"]
    sr = emp.get(f"{BASE}/api/employee/assets?q={tag}&pageSize=5", timeout=15).json()
    rec("Employee search by own assetTag", sr.get("ok") and len(sr.get("data", {}).get("data", [])) >= 1, f"q={tag}")
    fr = emp.get(f"{BASE}/api/employee/assets?status=ALLOCATED&pageSize=5", timeout=15).json()
    fdata = fr.get("data", {}).get("data", [])
    rec("Employee filter status=ALLOCATED", fr.get("ok") and len(fdata) >= 1 and all(x["asset"]["status"] == "ALLOCATED" for x in fdata), f"count={len(fdata)}")
else:
    rec("Employee has allocations", False, "none")

# manager-wide asset search by assetTag (broader search per spec)
mr = mgr.get(f"{BASE}/api/manager/assets?q=AST-1000&pageSize=5", timeout=15).json()
rec("Manager search assets by assetTag AST-1000", mr.get("ok") and len(mr.get("data", {}).get("data", [])) >= 1, f"count={len(mr.get('data',{}).get('data',[]))}")

# maintenance update
mlist = emp.get(f"{BASE}/api/employee/maintenance?pageSize=5", timeout=15).json().get("data", {}).get("data", [])
if mlist:
    mid = mlist[0]["id"]
    rec("Maintenance PATCH update", emp.patch(f"{BASE}/api/employee/maintenance/{mid}", json={"issueDescription": "QA updated", "priority": "HIGH"}, timeout=15).status_code == 200)
else:
    rec("Maintenance present", False, "none")

# transfer positive (emp001 transfers an asset they hold)
my2 = emp.get(f"{BASE}/api/employee/assets?pageSize=50", timeout=15).json().get("data", {}).get("data", [])
EMP_ASSET = my2[0]["assetId"] if my2 else None
emp002 = None
edir = emp.get(f"{BASE}/api/employee/employees?pageSize=50", timeout=15).json().get("data", {}).get("data", [])
for e in edir:
    if e.get("email", "").startswith("emp002@"):
        emp002 = e.get("id")
        break
if EMP_ASSET and emp002:
    rt = emp.post(f"{BASE}/api/employee/transfers", json={"assetId": EMP_ASSET, "targetEmployeeId": emp002, "reason": "QA transfer"}, timeout=15)
    rec("Transfer POST (own asset) -> 201/PENDING", rt.status_code in (200, 201) and rt.json().get("data", {}).get("status") == "PENDING", f"status={rt.status_code} body={rt.text[:120]}")

    # return positive (emp001 returns an asset they hold)
    rr = emp.post(f"{BASE}/api/employee/returns", json={"assetId": EMP_ASSET, "conditionNotes": "QA return"}, timeout=15)
    rec("Return POST (own asset) -> 201/PENDING", rr.status_code in (200, 201) and rr.json().get("data", {}).get("status") == "PENDING", f"status={rr.status_code} body={rr.text[:120]}")
else:
    rec("Employee has allocation + emp002 id for transfer/return", False, f"asset={EMP_ASSET} emp002={emp002}")

# admin dashboard KPIs
ad = admin.get(f"{BASE}/api/admin/dashboard/kpis", timeout=15)
adj = ad.json() if ad.status_code == 200 else {}
rec("Admin dashboard KPIs present", ad.status_code == 200 and isinstance(adj.get("data"), dict), f"status={ad.status_code} keys={list(adj.get('data',{}).keys())}")

passed = sum(1 for _, ok, _ in results if ok)
failed = len(results) - passed
print("\n==== SUMMARY ====")
print(f"TOTAL={len(results)} PASS={passed} FAIL={failed}")
for n, ok, d in results:
    if not ok:
        print("  FAIL -", n, "|", d)
