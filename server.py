#!/usr/bin/env python3
"""Skrydžių svetainės serveris: atiduoda puslapį ir /api/search (Travelpayouts / Aviasales).

Raktai skaitomi iš .env failo, todėl jie niekada nepatenka į naršyklę.
Paleidimas:  python3 server.py
"""
import json
import os
import re
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PUBLIC_FILES = {"index.html", "app.js", "data.js", "provider.js", "i18n.js", "style.css"}
CONTENT_TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8"}
AVIASALES = "https://www.aviasales.com"


def load_env():
    env_file = ROOT / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env()
TOKEN = os.environ.get("TRAVELPAYOUTS_TOKEN", "")
MARKER = os.environ.get("TRAVELPAYOUTS_MARKER", "")
CURRENCY = os.environ.get("CURRENCY", "eur").lower()
API_URL = os.environ.get("TRAVELPAYOUTS_API_URL", "https://api.travelpayouts.com/aviasales/v3/prices_for_dates")  # keičiama tik testams
SERPAPI_KEY = os.environ.get("SERPAPI_KEY", "")
SERPAPI_URL = os.environ.get("SERPAPI_URL", "https://serpapi.com/search.json")  # keičiama tik testams
SERPAPI_MONTHLY_CAP = int(os.environ.get("SERPAPI_MONTHLY_CAP", "200"))  # saugiklis nemokamam limitui
PORT = int(os.environ.get("PORT", "5173"))
HOST = os.environ.get("HOST", "127.0.0.1")

# python.org Python macOS sistemoje dažnai neturi CA sertifikatų; naudojame sistemos rinkinį (tikrinimas lieka įjungtas)
_SYSTEM_CA = "/etc/ssl/cert.pem"
SSL_CONTEXT = ssl.create_default_context(cafile=_SYSTEM_CA if os.path.exists(_SYSTEM_CA) else None)

IATA = re.compile(r"^[A-Z]{3}$")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def parse_dt(text):
    """Aviasales grąžina laiką su laiko juosta, pvz. 2026-11-03T12:25:00+02:00."""
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def affiliate_link(origin, dest, depart_date, return_date, adults):
    """Gyvos paieškos nuoroda maršrutui ir datai (ne konkrečiam talpykloje rastam bilietui,
    kuris dažnai jau išparduotas). Formatas: IŠ + DDMM + Į [+ DDMM grįžimo] + keleiviai."""
    ddmm = lambda iso: iso[8:10] + iso[5:7]
    code = f"{origin}{ddmm(depart_date)}{dest}{ddmm(return_date) if return_date else ''}{adults}"
    url = f"{AVIASALES}/search/{code}"
    if MARKER:
        url += "?" + urllib.parse.urlencode({"marker": MARKER})
    return url


def normalize(item, origin, dest, adults):
    """Aviasales įrašas -> mūsų formatas (žr. provider.js)."""
    depart = parse_dt(item["departure_at"])
    minutes = int(item.get("duration_to") or item.get("duration") or 0)
    arrive = depart + timedelta(minutes=minutes)
    offer = {
        "code": item.get("airline", ""),
        "airline": item.get("airline", ""),
        "departIso": depart.isoformat(),
        "arriveIso": arrive.isoformat(),
        "durationMin": minutes,
        "stops": int(item.get("transfers") or 0),
        "price": round(float(item["price"]) * adults),
        "currency": CURRENCY.upper(),
        "url": affiliate_link(origin, dest, item["departure_at"][:10], (item.get("return_at") or "")[:10], adults),
    }
    if item["departure_at"].endswith("Z"):
        offer["timeUnknown"] = True  # UTC laikas – oro uosto vietos laiko nežinome
    else:
        offer["departLocal"] = item["departure_at"][11:16]  # laikrodžio laikas išvykimo oro uoste
    if item.get("return_at"):
        offer["returnIso"] = parse_dt(item["return_at"]).isoformat()
        offer["returnStops"] = int(item.get("return_transfers") or 0)
    return offer


_serp_cache = {}   # (maršrutas) -> (laikas, pasiūlymai): kad nevartotume limito dėl pasikartojančių paieškų
_serp_used = {"month": "", "count": 0}


def serpapi_flights(origin, dest, date, return_date, adults):
    """Gyvos Google Flights kainos tiksliai dienai (per SerpApi). Neprivaloma: be rakto grąžina [].
    Niekada nemeta klaidos – jei nepavyksta, svetainė naudoja Aviasales duomenis."""
    if not SERPAPI_KEY:
        return []
    key = (origin, dest, date, return_date)
    now = time.time()
    cached = _serp_cache.get(key)
    if cached and now - cached[0] < 900:
        return [dict(o, price=round(o["price"] / o["_adults"] * adults), _adults=adults) for o in cached[1]]
    month = datetime.now().strftime("%Y-%m")
    if _serp_used["month"] != month:
        _serp_used.update(month=month, count=0)
    if _serp_used["count"] >= SERPAPI_MONTHLY_CAP:
        return []
    _serp_used["count"] += 1
    query = {"engine": "google_flights", "departure_id": origin, "arrival_id": dest, "outbound_date": date,
             "type": "1" if return_date else "2", "currency": CURRENCY.upper(), "hl": "lt", "adults": "1",
             "api_key": SERPAPI_KEY}
    if return_date:
        query["return_date"] = return_date
    try:
        req = urllib.request.Request(f"{SERPAPI_URL}?{urllib.parse.urlencode(query)}")
        with urllib.request.urlopen(req, timeout=25, context=SSL_CONTEXT) as resp:
            payload = json.load(resp)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError):
        return []
    link = (payload.get("search_metadata") or {}).get("google_flights_url") or ""
    offers = []
    for item in (payload.get("best_flights") or []) + (payload.get("other_flights") or []):
        try:
            legs = item["flights"]
            first, last = legs[0], legs[-1]
            dep = first["departure_airport"]["time"]          # "2027-01-25 07:45" (oro uosto vietos laikas)
            arr = last["arrival_airport"]["time"]
            code = (first.get("flight_number") or "").split(" ")[0][:2].upper()
            offer = {
                "code": code, "airline": first.get("airline") or code,
                "departIso": dep.replace(" ", "T") + ":00", "departLocal": dep[11:16],
                "arriveIso": arr.replace(" ", "T") + ":00",
                "durationMin": int(item.get("total_duration") or 0),
                "stops": len(legs) - 1, "price": float(item["price"]), "_adults": 1,
                "currency": CURRENCY.upper(), "url": link or affiliate_link(origin, dest, date, return_date, 1),
                "source": "google", "exact": True,
            }
            if return_date:
                offer["returnIso"] = f"{return_date}T00:00:00"
            offers.append(offer)
        except (KeyError, TypeError, ValueError, IndexError):
            continue
    _serp_cache[key] = (now, offers)
    if len(_serp_cache) > 500:
        _serp_cache.clear()
    return [dict(o, price=round(o["price"] * adults), _adults=adults) for o in offers]


class ApiError(Exception):
    pass


def search(params):
    origin = params.get("from", [""])[0].upper()
    dest = params.get("to", [""])[0].upper()
    date = params.get("date", [""])[0]
    return_date = params.get("returnDate", [""])[0]
    try:
        adults = max(1, min(9, int(params.get("adults", ["1"])[0])))
    except ValueError:
        adults = 1
    if not (IATA.match(origin) and IATA.match(dest) and DATE.match(date) and (not return_date or DATE.match(return_date))):
        return 400, {"error": "Neteisingi paieškos parametrai"}

    if not TOKEN:
        return 200, {"demo": True, "reason": "no_token"}

    def collect(departure_at, return_at):
        """Du užklausos: visi variantai ir tik tiesioginiai (talpykla kitaip grąžina vos vieną pigiausią)."""
        base = {
            "origin": origin, "destination": dest, "departure_at": departure_at,
            "currency": CURRENCY, "sorting": "price", "limit": 1000, "unique": "false",
            "one_way": "false" if return_at else "true",
        }
        if return_at:
            base["return_at"] = return_at
        found, seen = [], set()
        for extra in ({}, {"direct": "true"}):
            req = urllib.request.Request(f"{API_URL}?{urllib.parse.urlencode({**base, **extra})}", headers={"X-Access-Token": TOKEN})
            try:
                with urllib.request.urlopen(req, timeout=12, context=SSL_CONTEXT) as resp:
                    payload = json.load(resp)
            except urllib.error.HTTPError as err:
                raise ApiError(f"Aviasales API klaida {err.code}" + (" (patikrinkite TRAVELPAYOUTS_TOKEN)" if err.code in (401, 403) else ""))
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
                if extra:
                    break  # papildoma užklausa nepavyko – pakanka pirmosios
                raise ApiError("Nepavyko pasiekti Aviasales API")
            if not payload.get("success", True):
                raise ApiError(str(payload.get("error") or "Aviasales API grąžino klaidą"))
            for item in payload.get("data", []):
                try:
                    offer = normalize(item, origin, dest, adults)
                except (KeyError, ValueError, TypeError):
                    continue  # praleidžiame sugadintus įrašus
                key = (offer["code"], offer["departIso"], offer.get("returnIso"))
                if key not in seen:
                    seen.add(key)
                    found.append(offer)
        return found

    # Mėnesiai: kalendoriaus langas (-3..+17 dienų nuo pasirinktos datos) gali apimti kelis mėnesius
    # (tik į vieną pusę; į abi puses imamas vienas mėnuo, nes grįžimo mėnuo priklauso nuo trukmės)
    months = [date[:7]]
    if not return_date:
        picked = datetime.strptime(date, "%Y-%m-%d")
        now_month = datetime.now().strftime("%Y-%m")
        for offset in (-3, 17):
            ym = (picked + timedelta(days=offset)).strftime("%Y-%m")
            if ym >= now_month and ym not in months:
                months.append(ym)

    # v3 prices_for_dates yra retas (dažnai tuščias), todėl papildome senesniais endpoint'ais,
    # kurie turi daug daugiau dienų: prices/cheap, prices/direct (tiksli diena) ir prices/calendar (mėnuo).
    V1 = os.environ.get("TRAVELPAYOUTS_V1_URL", "https://api.travelpayouts.com/v1/prices")  # keičiama tik testams

    def get_json(url, query):
        req = urllib.request.Request(f"{url}?{urllib.parse.urlencode(query)}", headers={"X-Access-Token": TOKEN})
        with urllib.request.urlopen(req, timeout=15, context=SSL_CONTEXT) as resp:
            return json.load(resp)

    def v1_stops(endpoint, dep):
        """prices/cheap ir prices/direct: {kryptis: {persėdimų_skaičius: įrašas}}."""
        q = {"origin": origin, "destination": dest, "depart_date": dep, "currency": CURRENCY}
        if return_date:
            q["return_date"] = return_date
        data = get_json(f"{V1}/{endpoint}", q).get("data") or {}
        found = []
        for by_stops in data.values():
            for stops, item in (by_stops or {}).items():
                found.append({**item, "transfers": int(stops) if str(stops).isdigit() else 0})
        return found

    def v1_calendar(month):
        """prices/calendar: {data: įrašas} – pigiausias skrydis kiekvienai dienai."""
        q = {"origin": origin, "destination": dest, "depart_date": month, "calendar_type": "departure_date", "currency": CURRENCY}
        if return_date:
            q["return_date"] = return_date[:7]
        data = get_json(f"{V1}/calendar", q).get("data") or {}
        return [{**item, "transfers": item.get("transfers", item.get("number_of_changes", 0))}
                for item in data.values() if str(item.get("departure_at", ""))[:7] in months]

    def run(task):
        kind, a, b, required = task
        try:
            if kind == "v3":
                return "v3", collect(a, b)
            if kind == "cheap":
                return "v1", v1_stops("cheap", a)
            if kind == "direct":
                return "v1", v1_stops("direct", a)
            return "v1", v1_calendar(a)
        except ApiError:
            if required:
                raise  # tiksliai dienai pagrindinė užklausa svarbi; kitos gali tyliai nepavykti
            return kind, []
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError, AttributeError):
            return kind, []

    tasks = [("v3", date, return_date, True), ("v3", date[:7], return_date[:7] if return_date else "", False),
             ("cheap", date, "", False), ("direct", date, "", False)]
    tasks += [("calendar", m, "", False) for m in months]
    tasks += [("v3", m, "", False) for m in months[1:]]
    try:
        with ThreadPoolExecutor(max_workers=6) as pool:
            results = list(pool.map(run, tasks))
    except ApiError as err:
        return 502, {"error": str(err)}

    today = datetime.now().date().isoformat()
    best = {}  # tas pats skrydis keliuose languose -> paliekame pigiausią kainą
    v3_days = set()  # (aviakompanija, diena, persėdimai) iš v3, kuri turi tikrą laiką
    for source, found in results:
        if source != "v3":
            continue
        for offer in found:
            key = (offer["code"], offer["departIso"], offer.get("returnIso"))
            if offer["departIso"][:10] < today:
                continue
            if key not in best or offer["price"] < best[key]["price"]:
                offer["exact"] = offer["departIso"][:10] == date
                best[key] = offer
            v3_days.add((offer["code"], offer["departIso"][:10], offer["stops"]))
    for source, found in results:
        if source == "v3":
            continue
        for item in found:
            try:
                offer = normalize(item, origin, dest, adults)
            except (KeyError, ValueError, TypeError):
                continue
            day_key = (offer["code"], offer["departIso"][:10], offer["stops"])
            if offer["departIso"][:10] < today or day_key in v3_days:
                continue  # v3 jau turi šį skrydį su tikru laiku
            key = ("v1",) + day_key + (offer.get("returnIso"),)
            if key not in best or offer["price"] < best[key]["price"]:
                offer["exact"] = offer["departIso"][:10] == date
                best[key] = offer
    # Aviasales senesni endpoint'ai maišo kainas į vieną ir į abi puses – paliekame tik prašomą tipą
    offers = [o for o in best.values() if bool(o.get("returnIso")) == bool(return_date)]
    # Gyvos Google Flights kainos tiksliai dienai (jei sukonfigūruota): jos tikslesnės už talpyklą
    live = [dict(o) for o in serpapi_flights(origin, dest, date, return_date, adults)]
    for o in live:
        o.pop("_adults", None)
    if live:
        offers = [o for o in offers if not o["exact"]] + live
    offers.sort(key=lambda o: (o["departIso"], o["price"]))
    offers = offers[:400]
    exact_count = sum(1 for o in offers if o["exact"])
    nearby = exact_count == 0 and bool(offers)
    live_url = affiliate_link(origin, dest, date, return_date, adults)
    return 200, {"demo": False, "offers": offers, "nearby": nearby, "exactCount": exact_count, "liveUrl": live_url}


MONTH = re.compile(r"^\d{4}-\d{2}$")


def explore(params):
    """Pigiausios kryptys iš vieno oro uosto (vienas pasiūlymas kiekvienai krypčiai)."""
    origin = params.get("from", [""])[0].upper()
    month = params.get("month", [""])[0]
    direct = params.get("direct", ["0"])[0] == "1"
    try:
        budget = int(params.get("budget", ["0"])[0])
    except ValueError:
        budget = 0
    if not IATA.match(origin) or (month and not MONTH.match(month)):
        return 400, {"error": "Neteisingi paieškos parametrai"}
    if not TOKEN:
        return 200, {"demo": True, "reason": "no_token"}

    query = {"origin": origin, "currency": CURRENCY, "sorting": "price", "limit": 100,
             "unique": "true", "one_way": "true"}
    if month:
        query["departure_at"] = month
    if direct:
        query["direct"] = "true"
    req = urllib.request.Request(f"{API_URL}?{urllib.parse.urlencode(query)}", headers={"X-Access-Token": TOKEN})
    try:
        with urllib.request.urlopen(req, timeout=15, context=SSL_CONTEXT) as resp:
            payload = json.load(resp)
    except urllib.error.HTTPError as err:
        return 502, {"error": f"Aviasales API klaida {err.code}"}
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return 502, {"error": "Nepavyko pasiekti Aviasales API"}
    if not payload.get("success", True):
        return 502, {"error": str(payload.get("error") or "Aviasales API grąžino klaidą")}

    today = datetime.now().date().isoformat()
    best = {}  # kryptis -> pigiausias pasiūlymas
    for item in payload.get("data", []):
        dest = (item.get("destination") or item.get("destination_airport") or "").upper()
        if not IATA.match(dest) or dest == origin:
            continue
        try:
            offer = normalize(item, origin, dest, 1)
        except (KeyError, ValueError, TypeError):
            continue
        if offer["departIso"][:10] < today or (budget and offer["price"] > budget):
            continue
        offer["dest"] = dest
        if dest not in best or offer["price"] < best[dest]["price"]:
            best[dest] = offer
    return 200, {"demo": False, "destinations": sorted(best.values(), key=lambda o: o["price"])}


def weekend(params):
    """Savaitgalio kelionės pirmyn ir atgal: išvykimas penktadienį/šeštadienį, grįžimas sekmadienį/pirmadienį.
    Grąžina pigiausią pasiūlymą kiekvienai krypčiai (kaina yra už abi puses)."""
    origin = params.get("from", [""])[0].upper()
    month = params.get("month", [""])[0]
    direct = params.get("direct", ["0"])[0] == "1"
    try:
        budget = int(params.get("budget", ["0"])[0])
    except ValueError:
        budget = 0
    if not IATA.match(origin) or (month and not MONTH.match(month)):
        return 400, {"error": "Neteisingi paieškos parametrai"}
    if not TOKEN:
        return 200, {"demo": True, "reason": "no_token"}

    now = datetime.now()
    if month:
        months = [month]
    else:  # „Bet kada“ = artimiausi trys mėnesiai
        months = []
        y, m = now.year, now.month
        for _ in range(3):
            months.append(f"{y:04d}-{m:02d}")
            y, m = (y + 1, 1) if m == 12 else (y, m + 1)

    def fetch(ym):
        query = {"origin": origin, "departure_at": ym, "currency": CURRENCY, "sorting": "price",
                 "limit": 1000, "unique": "false", "one_way": "false"}
        if direct:
            query["direct"] = "true"
        req = urllib.request.Request(f"{API_URL}?{urllib.parse.urlencode(query)}", headers={"X-Access-Token": TOKEN})
        with urllib.request.urlopen(req, timeout=20, context=SSL_CONTEXT) as resp:
            return json.load(resp)

    payloads = []
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = [pool.submit(fetch, ym) for ym in months]
        for future in futures:
            try:
                payloads.append(future.result())
            except urllib.error.HTTPError as err:
                return 502, {"error": f"Aviasales API klaida {err.code}"}
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
                return 502, {"error": "Nepavyko pasiekti Aviasales API"}

    today = now.date().isoformat()
    best = {}
    for payload in payloads:
        if not payload.get("success", True):
            return 502, {"error": str(payload.get("error") or "Aviasales API grąžino klaidą")}
        for item in payload.get("data", []):
            try:
                dest = (item.get("destination") or item.get("destination_airport") or "").upper()
                dep, ret = item["departure_at"][:10], (item.get("return_at") or "")[:10]
                if not IATA.match(dest) or dest == origin or not ret or dep < today:
                    continue
                d1, d2 = datetime.strptime(dep, "%Y-%m-%d"), datetime.strptime(ret, "%Y-%m-%d")
                # Penktadienis (4) arba šeštadienis (5) -> sekmadienis (6) arba pirmadienis (0), 1-3 naktys
                if d1.weekday() not in (4, 5) or d2.weekday() not in (6, 0) or not 1 <= (d2 - d1).days <= 3:
                    continue
                offer = normalize(item, origin, dest, 1)
            except (KeyError, ValueError, TypeError):
                continue
            offer["stops"] = max(offer["stops"], int(item.get("return_transfers") or 0))
            offer["dest"] = dest
            offer["nights"] = (d2 - d1).days
            if budget and offer["price"] > budget:
                continue
            if dest not in best or offer["price"] < best[dest]["price"]:
                best[dest] = offer
    return 200, {"demo": False, "destinations": sorted(best.values(), key=lambda o: (o["price"], o["departIso"]))}


# Paprasta užklausų riba vienam IP, kad svetimi robotai neišnaudotų tavo API limito
RATE_LIMIT, RATE_WINDOW = 20, 60  # užklausų per sekundžių langą
_hits = {}


def rate_limited(ip):
    now = time.time()
    recent = [t for t in _hits.get(ip, []) if now - t < RATE_WINDOW]
    recent.append(now)
    _hits[ip] = recent
    if len(_hits) > 5000:  # neleidžiame žodynui augti be galo
        _hits.clear()
    return len(recent) > RATE_LIMIT


class Handler(BaseHTTPRequestHandler):
    def client_ip(self):
        # už Render/kitų proxy tikrasis IP yra X-Forwarded-For pirmame įraše
        forwarded = self.headers.get("X-Forwarded-For", "")
        return forwarded.split(",")[0].strip() or self.client_address[0]

    def send(self, status, body, content_type="application/json; charset=utf-8"):
        data = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/search":
            if rate_limited(self.client_ip()):
                return self.send(429, {"error": "Per daug užklausų. Pabandykite už minutės."})
            status, body = search(urllib.parse.parse_qs(parsed.query))
            return self.send(status, body)
        if parsed.path == "/api/weekend":
            if rate_limited(self.client_ip()):
                return self.send(429, {"error": "Per daug užklausų. Pabandykite už minutės."})
            status, body = weekend(urllib.parse.parse_qs(parsed.query))
            return self.send(status, body)
        if parsed.path == "/api/explore":
            if rate_limited(self.client_ip()):
                return self.send(429, {"error": "Per daug užklausų. Pabandykite už minutės."})
            status, body = explore(urllib.parse.parse_qs(parsed.query))
            return self.send(status, body)
        name = "index.html" if parsed.path == "/" else parsed.path.lstrip("/")
        if name not in PUBLIC_FILES:
            return self.send(404, {"error": "Nerasta"})
        self.send(200, (ROOT / name).read_bytes(), CONTENT_TYPES[Path(name).suffix])

    def log_message(self, fmt, *args):  # tyliau: be raktų žurnaluose
        pass


if __name__ == "__main__":
    mode = "tikri duomenys (Aviasales)" if TOKEN else "DEMO režimas (nėra TRAVELPAYOUTS_TOKEN)"
    print(f"Serveris: http://{HOST}:{PORT}  ·  {mode}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
