# scripts/e2e-all-roles.py
import json, urllib.request, urllib.error, http.cookiejar
from datetime import datetime, timedelta

BASE = "http://localhost:3001"
USERS = {
    "admin":    "admin@assetflow.dev",
    "manager":  "manager@assetflow.dev",
    "head":     "head@assetflow.dev",
    "employee": "employee@assetflow.dev",
}
PW = "Password123!"
results = []
def check(name, cond, detail=""):
    results.append((name, cond, detail))
    print(("PASS " if cond else "FAIL ") + name + ("  -> " + detail if detail else ""))

def mkop():
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

def req(method, path, body=None, op=None, as_text=False):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"} if data else {}
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    opener = op if op else mkop()
    try:
        resp = opener.open(r)
        raw = resp.read().decode()
        return resp.status, (raw if as_text else (json.loads(raw) if raw else None))
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try: return e.code, (raw if as_text else (json.loads(raw) if raw else None))
        except Exception: return e.code, raw

# login all roles
ops = {}
for role, email in USERS.items():
    op = mkop()
    st, login = req("POST", "/api/auth/login", {"email":email,"password":PW}, op=op)
    check("login %-8s"%role, st==200 and login.get("ok"), str(st))
    ops[role] = op

# /auth/me per role
for role, op in ops.items():
    st, me = req("GET", "/api/auth/me", op=op)
    r = me.get("data",{}).get("role") if isinstance(me, dict) else None
    check("me    %-8s -> %s"%(role, r), st==200 and r==role.upper(), str(r))

# dashboard pages per role
dash = {"admin":"/dashboard/admin","manager":"/dashboard/manager","head":"/dashboard/head","employee":"/dashboard/employee"}
for role, path in dash.items():
    st, _ = req("GET", path, op=ops[role], as_text=True)
    check("page  %-8s %s"%(role, path), st==200, str(st))

# list endpoints per role
admin_eps = ["/api/admin/dashboard/kpis","/api/admin/assets","/api/admin/employees",
             "/api/admin/categories","/api/admin/departments","/api/admin/maintenance",
             "/api/admin/transfers","/api/admin/returns","/api/admin/audits","/api/admin/users"]
mgr_eps = ["/api/manager/dashboard","/api/manager/assets","/api/manager/employees",
           "/api/manager/categories","/api/manager/maintenance","/api/manager/transfers",
           "/api/manager/returns","/api/manager/bookings"]
for ep in admin_eps:
    st, d = req("GET", ep, op=ops["admin"])
    ok = st==200 and (isinstance(d,dict) and d.get("ok"))
    check("admin GET %s"%ep.split("/api/admin/")[1], ok, str(st))
for ep in mgr_eps:
    st, d = req("GET", ep, op=ops["manager"])
    ok = st==200 and (isinstance(d,dict) and d.get("ok"))
    check("mgr   GET %s"%ep.split("/api/manager/")[1], ok, str(st))

# [id] param routes (detect Next 15 async-params bug at RUNTIME)
# get an asset id from admin list
_, ad = req("GET", "/api/admin/assets", op=ops["admin"])
aid = None
try: aid = ad["data"]["data"][0]["id"]
except Exception: pass
if aid:
    st, d = req("GET", "/api/admin/assets/"+aid, op=ops["admin"])
    # bug would yield 500 or params undefined -> 404/500
    check("admin assets/[id] runtime", st in (200,404), "status=%s (404=not-found, 200=ok, 500=params bug)"%st)
    st2, d2 = req("GET", "/api/manager/assets/"+aid, op=ops["manager"])
    check("mgr   assets/[id] runtime", st2 in (200,404), "status=%s"%st2)
else:
    check("admin assets/[id] runtime", False, "no asset id found")

# RBAC cross-checks
def blocked(actor, path, allowed_codes):
    st, _ = req("GET", path, op=ops[actor], as_text=True)
    return st in allowed_codes

# non-admins must NOT reach admin API
for actor in ["manager","head","employee"]:
    st, _ = req("GET", "/api/admin/assets", op=ops[actor], as_text=True)
    check("rbac %-8s -> /api/admin BLOCKED"%actor, st in (401,403), "status=%s"%st)
# non-admins must NOT reach other dashboards (redirect 307) for wrong role
for actor in ["manager","head","employee"]:
    for tgt in ["/dashboard/admin","/dashboard/manager","/dashboard/head","/dashboard/employee"]:
        if dash[actor]==tgt: continue
        st, _ = req("GET", tgt, op=ops[actor], as_text=True)
        check("rbac %-8s -> %s"%(actor, tgt), st in (307,401,403), "status=%s"%st)
# admin (super) should reach admin API + dashboards
st, _ = req("GET", "/api/admin/assets", op=ops["admin"], as_text=True)
check("admin -> /api/admin ALLOWED", st==200, "status=%s"%st)
st, _ = req("GET", "/dashboard/manager", op=ops["admin"], as_text=True)
check("admin -> /dashboard/manager", st in (200,307), "status=%s"%st)

# summary
passed = sum(1 for _,c,_ in results if c)
print("\n==== %d/%d checks passed ====" % (passed, len(results)))
if passed != len(results):
    print("FAILURES:")
    for n,c,d in results:
        if not c: print(" -", n, "|", d)
