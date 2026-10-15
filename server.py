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
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PUBLIC_FILES = {"index.html", "app.js", "data.js", "provider.js", "style.css"}
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


def affiliate_link(link):
    url = AVIASALES + link if link.startswith("/") else link
    if MARKER:
        url += ("&" if "?" in url else "?") + urllib.parse.urlencode({"marker": MARKER})
    return url


def normalize(item, adults):
    """Aviasales įrašas -> mūsų formatas (žr. provider.js)."""
    depart = parse_dt(item["departure_at"])
    minutes = int(item.get("duration_to") or item.get("duration") or 0)
    arrive = depart + timedelta(minutes=minutes)
    offer = {
        "code": item.get("airline", ""),
        "airline": item.get("airline", ""),
        "departIso": depart.isoformat(),
        "departLocal": item["departure_at"][11:16],  # laikrodžio laikas išvykimo oro uoste
        "arriveIso": arrive.isoformat(),
        "durationMin": minutes,
        "stops": int(item.get("transfers") or 0),
        "price": round(float(item["price"]) * adults),
        "currency": CURRENCY.upper(),
        "url": affiliate_link(item.get("link", "")),
    }
    if item.get("return_at"):
        offer["returnIso"] = parse_dt(item["return_at"]).isoformat()
        offer["returnStops"] = int(item.get("return_transfers") or 0)
    return offer


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

    base = {
        "origin": origin, "destination": dest, "departure_at": date,
        "currency": CURRENCY, "sorting": "price", "limit": 30, "unique": "false",
        "one_way": "false" if return_date else "true",
    }
    if return_date:
        base["return_at"] = return_date

    # Du užklausos: visi variantai ir tik tiesioginiai (talpykla kitaip grąžina vos vieną pigiausią)
    offers, seen = [], set()
    for extra in ({}, {"direct": "true"}):
        req = urllib.request.Request(f"{API_URL}?{urllib.parse.urlencode({**base, **extra})}", headers={"X-Access-Token": TOKEN})
        try:
            with urllib.request.urlopen(req, timeout=12, context=SSL_CONTEXT) as resp:
                payload = json.load(resp)
        except urllib.error.HTTPError as err:
            return 502, {"error": f"Aviasales API klaida {err.code}" + (" (patikrinkite TRAVELPAYOUTS_TOKEN)" if err.code in (401, 403) else "")}
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
            if extra:
                break  # papildoma užklausa nepavyko – pakanka pirmosios
            return 502, {"error": "Nepavyko pasiekti Aviasales API"}
        if not payload.get("success", True):
            return 502, {"error": str(payload.get("error") or "Aviasales API grąžino klaidą")}
        for item in payload.get("data", []):
            try:
                offer = normalize(item, adults)
            except (KeyError, ValueError, TypeError):
                continue  # praleidžiame sugadintus įrašus
            key = (offer["code"], offer["departIso"], offer.get("returnIso"))
            if key not in seen:
                seen.add(key)
                offers.append(offer)
    return 200, {"demo": False, "offers": offers}


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
