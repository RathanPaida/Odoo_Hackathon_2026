# scripts/e2e-test.py
import json, urllib.request, urllib.error, http.cookiejar

BASE = "http://localhost:3001"

def jar():
    cj = http.cookiejar.CookieJar()
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

def req(method, path, body=None, cj=None, as_text=False):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"} if data else {}
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    op = cj if cj else urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    try:
        resp = op.open(r)
        raw = resp.read().decode()
        return resp.status, (raw if as_text else json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, (raw if as_text else json.loads(raw) if raw else None)
        except Exception:
            return e.code, raw

results = []
def check(name, cond, detail=""):
    results.append((name, cond, detail))
    print(("PASS " if cond else "FAIL ") + name + ("  -> " + detail if detail else ""))

# ---- AUTH ----
emp_cj = jar()
st, login = req("POST", "/api/auth/login", {"email":"employee@assetflow.dev","password":"Password123!"}, cj=emp_cj)
check("auth: employee login", st==200 and login.get("ok"), str(st))
st, me = req("GET", "/api/auth/me", cj=emp_cj)
check("auth: /me returns EMPLOYEE", st==200 and me.get("data",{}).get("role")=="EMPLOYEE", str(me.get("data",{}).get("role")))
check("auth: /me needs auth (no cookie)", req("GET","/api/auth/me")[0]==401)

# RBAC: employee hitting admin API
st, _ = req("GET", "/api/admin/assets", cj=emp_cj)
check("rbac: employee blocked from /api/admin (403)", st==403, str(st))

# ---- EMPLOYEE GET ----
for ep in ["dashboard","assets","transfers","returns","maintenance","bookings","activity","employees","resources"]:
    st, d = req("GET", "/api/employee/"+ep, cj=emp_cj)
    check("get /employee/%s"%ep, st==200 and d.get("ok"), str(st))

# colleague id
_, empdir = req("GET", "/api/employee/employees", cj=emp_cj)
colleague = next((u for u in empdir["data"]["data"] if u["email"]=="colleague@assetflow.dev"), None)
col_id = colleague["id"] if colleague else None

# allocated asset id
_, assets = req("GET", "/api/employee/assets", cj=emp_cj)
alloc = assets["data"]["data"][0]
asset_id = alloc["assetId"]

# ---- EMPLOYEE WRITE ----
st, tr = req("POST", "/api/employee/transfers", {"assetId":asset_id,"targetEmployeeId":col_id,"reason":"Team move"}, cj=emp_cj)
check("post /employee/transfers (PENDING)", st==201 and tr.get("ok") and tr["data"]["status"]=="PENDING", str(st))
transfer_id = tr["data"]["id"]

st, rt = req("POST", "/api/employee/returns", {"assetId":asset_id,"conditionNotes":"Upgrade return"}, cj=emp_cj)
check("post /employee/returns (PENDING)", st==201 and rt.get("ok") and rt["data"]["status"]=="PENDING", str(st))
return_id = rt["data"]["id"]

# booking (future, non-conflicting)
from datetime import datetime, timedelta
start = (datetime.utcnow()+timedelta(days=5)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
end = (datetime.utcnow()+timedelta(days=5,hours=2)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
st, bk = req("POST", "/api/employee/bookings", {"assetId":asset_id,"startTime":start,"endTime":end,"purpose":"Demo"}, cj=emp_cj)
check("post /employee/bookings", st==201 and bk.get("ok"), str(st))
booking_id = bk["data"]["id"]

# booking conflict (same window)
st, bk2 = req("POST", "/api/employee/bookings", {"assetId":asset_id,"startTime":start,"endTime":end,"purpose":"Conflict"}, cj=emp_cj)
check("post /employee/bookings CONFLICT rejected", st==409 and not bk2.get("ok"), str(st)+" "+str(bk2.get("message")))

# maintenance
st, mt = req("POST", "/api/employee/maintenance", {"assetId":asset_id,"priority":"HIGH","issueDescription":"Fan noise"}, cj=emp_cj)
check("post /employee/maintenance (PENDING)", st==201 and mt.get("ok") and mt["data"]["status"]=="PENDING", str(st))
maint_id = mt["data"]["id"]

# ---- SINGLE GET [id] ----
alloc_id = alloc["id"]
for name, path in [("asset", "/api/employee/assets/"+alloc_id),("transfer", "/api/employee/transfers/"+transfer_id),
                   ("return", "/api/employee/returns/"+return_id),("maintenance", "/api/employee/maintenance/"+maint_id),
                   ("booking", "/api/employee/bookings/"+booking_id)]:
    st, d = req("GET", path, cj=emp_cj)
    check("get %s/[id]"%name, st==200 and d.get("ok"), str(st))

# ---- PATCH maintenance (employee note) ----
st, d = req("PATCH", "/api/employee/maintenance/"+maint_id, {"issueDescription":"Added more detail"}, cj=emp_cj)
check("patch /employee/maintenance/[id]", st==200 and d.get("ok"), str(st))

# ---- reschedule + cancel booking (PATCH with action) ----
nst = (datetime.utcnow()+timedelta(days=6)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
nen = (datetime.utcnow()+timedelta(days=6,hours=2)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
st, d = req("PATCH", "/api/employee/bookings/"+booking_id, {"action":"reschedule","startTime":nst,"endTime":nen}, cj=emp_cj)
check("patch /employee/bookings/[id] reschedule", st==200 and d.get("ok"), str(st))
st, d = req("PATCH", "/api/employee/bookings/"+booking_id, {"action":"cancel"}, cj=emp_cj)
check("patch /employee/bookings/[id] cancel", st==200 and d.get("ok"), str(st))

# ---- notifications ----
st, d = req("PATCH", "/api/employee/notifications/"+ (assets and transfer_id and "x"), cj=emp_cj) if False else (None,None)
# mark one read: grab an unread id
_, notifs = req("GET", "/api/employee/notifications", cj=emp_cj)
unread = next((n for n in notifs["data"]["data"] if not n["read"]), None)
if unread:
    st, d = req("PATCH", "/api/employee/notifications/"+unread["id"], cj=emp_cj)
    check("patch /employee/notifications/[id] mark read", st==200 and d.get("ok") and d["data"]["read"]==True, str(st))
st, d = req("POST", "/api/employee/notifications", cj=emp_cj)
check("post /employee/notifications mark all read", st==200 and d.get("ok"), "count="+str(d.get("data",{}).get("count")))

# ---- DEPARTMENT HEAD MODULE ----
head_cj = jar()
st, hlogin = req("POST", "/api/auth/login", {"email":"head@assetflow.dev","password":"Password123!"}, cj=head_cj)
check("auth: head login", st==200 and hlogin.get("ok"), str(st))
# head page renders (server component) -> 200 HTML
st, html = req("GET", "/dashboard/head", cj=head_cj, as_text=True)
check("head: /dashboard/head page loads", st==200 and "Department" in html, str(st))
st, html = req("GET", "/dashboard/head/assets", cj=head_cj, as_text=True)
check("head: /dashboard/head/assets page loads", st==200, str(st))
# employee must NOT access head page
st, _ = req("GET", "/dashboard/head", cj=emp_cj, as_text=True)
check("rbac: employee blocked from /dashboard/head", st in (401,403), str(st))

# ---- SUMMARY ----
passed = sum(1 for _,c,_ in results if c)
print("\n==== %d/%d checks passed ====" % (passed, len(results)))
if passed != len(results):
    print("FAILURES:")
    for n,c,d in results:
        if not c: print(" -", n, d)
