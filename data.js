// Oro uostai: kodas, miestas, šalis, koordinatės
window.AIRPORTS = [
  { code: "VNO", city: "Vilnius", country: "Lietuva", lat: 54.634, lon: 25.286 },
  { code: "KUN", city: "Kaunas", country: "Lietuva", lat: 54.964, lon: 24.085 },
  { code: "PLQ", city: "Palanga", country: "Lietuva", lat: 55.973, lon: 21.094 },
  { code: "RIX", city: "Ryga", country: "Latvija", lat: 56.924, lon: 23.971 },
  { code: "TLL", city: "Talinas", country: "Estija", lat: 59.413, lon: 24.833 },
  { code: "WAW", city: "Varšuva", country: "Lenkija", lat: 52.166, lon: 20.967 },
  { code: "KRK", city: "Krokuva", country: "Lenkija", lat: 50.078, lon: 19.785 },
  { code: "BER", city: "Berlynas", country: "Vokietija", lat: 52.362, lon: 13.501 },
  { code: "FRA", city: "Frankfurtas", country: "Vokietija", lat: 50.033, lon: 8.571 },
  { code: "MUC", city: "Miunchenas", country: "Vokietija", lat: 48.354, lon: 11.786 },
  { code: "LHR", city: "Londonas (Heathrow)", country: "Didžioji Britanija", lat: 51.47, lon: -0.454 },
  { code: "STN", city: "Londonas (Stansted)", country: "Didžioji Britanija", lat: 51.885, lon: 0.235 },
  { code: "DUB", city: "Dublinas", country: "Airija", lat: 53.421, lon: -6.27 },
  { code: "CDG", city: "Paryžius", country: "Prancūzija", lat: 49.013, lon: 2.55 },
  { code: "AMS", city: "Amsterdamas", country: "Nyderlandai", lat: 52.31, lon: 4.768 },
  { code: "BRU", city: "Briuselis", country: "Belgija", lat: 50.901, lon: 4.484 },
  { code: "ZRH", city: "Ciurichas", country: "Šveicarija", lat: 47.458, lon: 8.548 },
  { code: "VIE", city: "Viena", country: "Austrija", lat: 48.11, lon: 16.57 },
  { code: "PRG", city: "Praha", country: "Čekija", lat: 50.101, lon: 14.26 },
  { code: "BUD", city: "Budapeštas", country: "Vengrija", lat: 47.44, lon: 19.262 },
  { code: "CPH", city: "Kopenhaga", country: "Danija", lat: 55.618, lon: 12.656 },
  { code: "ARN", city: "Stokholmas", country: "Švedija", lat: 59.651, lon: 17.919 },
  { code: "OSL", city: "Oslas", country: "Norvegija", lat: 60.194, lon: 11.1 },
  { code: "HEL", city: "Helsinkis", country: "Suomija", lat: 60.317, lon: 24.963 },
  { code: "MAD", city: "Madridas", country: "Ispanija", lat: 40.494, lon: -3.567 },
  { code: "BCN", city: "Barselona", country: "Ispanija", lat: 41.297, lon: 2.078 },
  { code: "LIS", city: "Lisabona", country: "Portugalija", lat: 38.774, lon: -9.134 },
  { code: "FCO", city: "Roma", country: "Italija", lat: 41.8, lon: 12.239 },
  { code: "MXP", city: "Milanas", country: "Italija", lat: 45.63, lon: 8.723 },
  { code: "ATH", city: "Atėnai", country: "Graikija", lat: 37.936, lon: 23.947 },
  { code: "IST", city: "Stambulas", country: "Turkija", lat: 41.275, lon: 28.752 },
  { code: "DXB", city: "Dubajus", country: "JAE", lat: 25.253, lon: 55.366 },
  { code: "BKK", city: "Bankokas", country: "Tailandas", lat: 13.69, lon: 100.75 },
  { code: "SIN", city: "Singapūras", country: "Singapūras", lat: 1.364, lon: 103.991 },
  { code: "HND", city: "Tokijas", country: "Japonija", lat: 35.549, lon: 139.78 },
  { code: "JFK", city: "Niujorkas", country: "JAV", lat: 40.641, lon: -73.778 },
  { code: "ORD", city: "Čikaga", country: "JAV", lat: 41.974, lon: -87.907 },
  { code: "LAX", city: "Los Andželas", country: "JAV", lat: 33.942, lon: -118.408 },
];

// Aviakompanijos. lowcost – pigios, tik trumpi maršrutai; longhaul – tolimi skrydžiai.
// kaina – kainos koeficientas, url – kur nukreipiame pirkti.
window.AIRLINES = [
  { code: "FR", name: "Ryanair", type: "lowcost", factor: 0.6, url: "https://www.ryanair.com/lt/lt" },
  { code: "W6", name: "Wizz Air", type: "lowcost", factor: 0.65, url: "https://wizzair.com/lt-lt" },
  { code: "BT", name: "airBaltic", type: "regional", factor: 0.9, url: "https://www.airbaltic.com/lt" },
  { code: "LO", name: "LOT Polish Airlines", type: "regional", factor: 1.0, url: "https://www.lot.com/lt/lt" },
  { code: "AY", name: "Finnair", type: "regional", factor: 1.1, url: "https://www.finnair.com/lt-lt" },
  { code: "SK", name: "SAS", type: "regional", factor: 1.1, url: "https://www.flysas.com/lt-lt" },
  { code: "LH", name: "Lufthansa", type: "full", factor: 1.2, url: "https://www.lufthansa.com/lt/lt" },
  { code: "KL", name: "KLM", type: "full", factor: 1.15, url: "https://www.klm.lt" },
  { code: "AF", name: "Air France", type: "full", factor: 1.15, url: "https://wwws.airfrance.lt" },
  { code: "BA", name: "British Airways", type: "full", factor: 1.25, url: "https://www.britishairways.com" },
  { code: "TK", name: "Turkish Airlines", type: "longhaul", factor: 0.95, url: "https://www.turkishairlines.com/lt-lt/" },
  { code: "EK", name: "Emirates", type: "longhaul", factor: 1.2, url: "https://www.emirates.com/lt/lithuanian/" },
  { code: "QR", name: "Qatar Airways", type: "longhaul", factor: 1.15, url: "https://www.qatarairways.com/lt-lt" },
];

// Papildomi miestų pavadinimai (IATA kodas -> lietuviškas vardas) krypčių sąrašui.
// Kas čia nėra, rodomas pats kodas.
window.CITY_NAMES = {
  LON: "Londonas", PAR: "Paryžius", NYC: "Niujorkas", MIL: "Milanas", ROM: "Roma", STO: "Stokholmas",
  LGW: "Londonas (Gatwick)", LTN: "Londonas (Luton)", ORY: "Paryžius (Orly)", BVA: "Paryžius (Beauvais)",
  SXF: "Berlynas", HAM: "Hamburgas", DUS: "Diuseldorfas", CGN: "Kelnas", STR: "Štutgartas", NUE: "Niurnbergas",
  EIN: "Eindhovenas", RTM: "Roterdamas", CRL: "Briuselis (Charleroi)", GVA: "Ženeva", BSL: "Bazelis",
  MLA: "Malta", LCA: "Larnaka", PFO: "Pafas", HER: "Heraklionas", SKG: "Salonikai", RHO: "Rodas", CFU: "Korfu",
  SPU: "Splitas", DBV: "Dubrovnikas", ZAG: "Zagrebas", LJU: "Liubliana", BEG: "Belgradas", SOF: "Sofija",
  OTP: "Bukareštas", CLJ: "Kluž-Napoka", BTS: "Bratislava", GDN: "Gdanskas", WRO: "Vroclavas", POZ: "Poznanė",
  KTW: "Katovicai", LUZ: "Liublinas", RZE: "Ževuvas", AGP: "Malaga", ALC: "Alikantė", PMI: "Maljorka",
  IBZ: "Ibiza", TFS: "Tenerifė", LPA: "Gran Kanarija", SVQ: "Sevilija", VLC: "Valensija", OPO: "Porto",
  FAO: "Faras", NCE: "Nica", MRS: "Marselis", LYS: "Lionas", TLS: "Tulūza", BOD: "Bordo", NAP: "Neapolis",
  VCE: "Venecija", BLQ: "Bolonija", PSA: "Piza", CTA: "Katanija", PMO: "Palermas", CAG: "Kaljaris", BGY: "Milanas (Bergamas)",
  EDI: "Edinburgas", MAN: "Mančesteris", BHX: "Birmingemas", GLA: "Glazgas", BRS: "Bristolis", LPL: "Liverpulis",
  BLL: "Billundas", GOT: "Geteborgas", BGO: "Bergenas", TRF: "Sandefjordas", TKU: "Turku", RVN: "Rovaniemis",
  KEF: "Reikjavikas", TRD: "Trondheimas", AAR: "Orhusas", MMX: "Malmė", NYO: "Stokholmas (Skavsta)",
  TLV: "Tel Avivas", AMM: "Amanas", CAI: "Kairas", HRG: "Hurgada", SSH: "Šarm el Šeichas", RAK: "Marakešas",
  AUH: "Abu Dabis", DOH: "Doha", TBS: "Tbilisis", EVN: "Jerevanas", GYD: "Baku", KBP: "Kijevas",
  BOS: "Bostonas", MIA: "Majamis", SFO: "San Franciskas", WAS: "Vašingtonas", YTO: "Toronas", YMQ: "Monrealis",
  BKK: "Bankokas", DMK: "Bankokas (Don Mueang)", HKT: "Puketas", SIN: "Singapūras", KUL: "Kuala Lumpūras",
  DPS: "Balis", DEL: "Delis", BOM: "Mumbajus", CMB: "Kolombas", MLE: "Male", HKG: "Honkongas", ICN: "Seulas",
  PEK: "Pekinas", PVG: "Šanchajus", NRT: "Tokijas (Narita)", TYO: "Tokijas", OSA: "Osaka", SYD: "Sidnėjus",
  JNB: "Johanesburgas", CPT: "Keiptaunas", GRU: "San Paulas", GIG: "Rijus de Žaneiras", EZE: "Buenos Airės",
};
window.destName = (code) => {
  const a = AIRPORTS.find((x) => x.code === code);
  return a ? a.city : (CITY_NAMES[code] || code);
};

// ---- Anglų kalbos pavadinimai (kai LANG === "en") ----
window.EN_COUNTRY = {
  "Lietuva": "Lithuania", "Latvija": "Latvia", "Estija": "Estonia", "Lenkija": "Poland", "Vokietija": "Germany",
  "Didžioji Britanija": "United Kingdom", "Airija": "Ireland", "Prancūzija": "France", "Nyderlandai": "Netherlands",
  "Belgija": "Belgium", "Šveicarija": "Switzerland", "Austrija": "Austria", "Čekija": "Czechia", "Vengrija": "Hungary",
  "Danija": "Denmark", "Švedija": "Sweden", "Norvegija": "Norway", "Suomija": "Finland", "Ispanija": "Spain",
  "Portugalija": "Portugal", "Italija": "Italy", "Graikija": "Greece", "Turkija": "Turkey", "JAE": "UAE",
  "Tailandas": "Thailand", "Singapūras": "Singapore", "Japonija": "Japan", "JAV": "USA",
};
window.EN_CITY = {
  VNO: "Vilnius", KUN: "Kaunas", PLQ: "Palanga", RIX: "Riga", TLL: "Tallinn", WAW: "Warsaw", KRK: "Krakow", BER: "Berlin",
  FRA: "Frankfurt", MUC: "Munich", LHR: "London (Heathrow)", STN: "London (Stansted)", DUB: "Dublin", CDG: "Paris",
  AMS: "Amsterdam", BRU: "Brussels", ZRH: "Zurich", VIE: "Vienna", PRG: "Prague", BUD: "Budapest", CPH: "Copenhagen",
  ARN: "Stockholm", OSL: "Oslo", HEL: "Helsinki", MAD: "Madrid", BCN: "Barcelona", LIS: "Lisbon", FCO: "Rome", MXP: "Milan",
  ATH: "Athens", IST: "Istanbul", DXB: "Dubai", BKK: "Bangkok", SIN: "Singapore", HND: "Tokyo", JFK: "New York",
  ORD: "Chicago", LAX: "Los Angeles",
  LON: "London", PAR: "Paris", NYC: "New York", MIL: "Milan", ROM: "Rome", STO: "Stockholm", LGW: "London (Gatwick)",
  LTN: "London (Luton)", ORY: "Paris (Orly)", BVA: "Paris (Beauvais)", SXF: "Berlin", HAM: "Hamburg", DUS: "Düsseldorf",
  CGN: "Cologne", STR: "Stuttgart", NUE: "Nuremberg", EIN: "Eindhoven", RTM: "Rotterdam", CRL: "Brussels (Charleroi)",
  GVA: "Geneva", BSL: "Basel", MLA: "Malta", LCA: "Larnaca", PFO: "Paphos", HER: "Heraklion", SKG: "Thessaloniki",
  RHO: "Rhodes", CFU: "Corfu", SPU: "Split", DBV: "Dubrovnik", ZAG: "Zagreb", LJU: "Ljubljana", BEG: "Belgrade",
  SOF: "Sofia", OTP: "Bucharest", CLJ: "Cluj-Napoca", BTS: "Bratislava", GDN: "Gdansk", WRO: "Wroclaw", POZ: "Poznan",
  KTW: "Katowice", LUZ: "Lublin", RZE: "Rzeszow", AGP: "Malaga", ALC: "Alicante", PMI: "Palma de Mallorca", IBZ: "Ibiza",
  TFS: "Tenerife", LPA: "Gran Canaria", SVQ: "Seville", VLC: "Valencia", OPO: "Porto", FAO: "Faro", NCE: "Nice",
  MRS: "Marseille", LYS: "Lyon", TLS: "Toulouse", BOD: "Bordeaux", NAP: "Naples", VCE: "Venice", BLQ: "Bologna",
  PSA: "Pisa", CTA: "Catania", PMO: "Palermo", CAG: "Cagliari", BGY: "Milan (Bergamo)", EDI: "Edinburgh", MAN: "Manchester",
  BHX: "Birmingham", GLA: "Glasgow", BRS: "Bristol", LPL: "Liverpool", BLL: "Billund", GOT: "Gothenburg", BGO: "Bergen",
  TRF: "Sandefjord", TKU: "Turku", RVN: "Rovaniemi", KEF: "Reykjavik", TRD: "Trondheim", AAR: "Aarhus", MMX: "Malmo",
  NYO: "Stockholm (Skavsta)", TLV: "Tel Aviv", AMM: "Amman", CAI: "Cairo", HRG: "Hurghada", SSH: "Sharm El Sheikh",
  RAK: "Marrakech", AUH: "Abu Dhabi", DOH: "Doha", TBS: "Tbilisi", EVN: "Yerevan", GYD: "Baku", KBP: "Kyiv", BOS: "Boston",
  MIA: "Miami", SFO: "San Francisco", WAS: "Washington", YTO: "Toronto", YMQ: "Montreal", DMK: "Bangkok (Don Mueang)",
  HKT: "Phuket", KUL: "Kuala Lumpur", DPS: "Bali", DEL: "Delhi", BOM: "Mumbai", CMB: "Colombo", MLE: "Male", HKG: "Hong Kong",
  ICN: "Seoul", PEK: "Beijing", PVG: "Shanghai", NRT: "Tokyo (Narita)", TYO: "Tokyo", OSA: "Osaka", SYD: "Sydney",
  JNB: "Johannesburg", CPT: "Cape Town", GRU: "São Paulo", GIG: "Rio de Janeiro", EZE: "Buenos Aires", RMI: "Rimini", TRN: "Turin",
};
CITY_NAMES.RMI = "Rimini"; CITY_NAMES.TRN = "Turinas";

// Miesto ir šalies pavadinimas pagal pasirinktą kalbą
window.airportCity = (a) => (LANG === "en" ? EN_CITY[a.code] || a.city : a.city);
window.airportCountry = (a) => (LANG === "en" ? EN_COUNTRY[a.country] || a.country : a.country);
window.destName = (code) => {
  if (LANG === "en" && EN_CITY[code]) return EN_CITY[code];
  const a = AIRPORTS.find((x) => x.code === code);
  return a ? a.city : (CITY_NAMES[code] || code);
};
