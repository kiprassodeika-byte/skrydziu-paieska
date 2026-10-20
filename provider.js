// Skrydžių duomenų tiekėjas.
// Dabar naudojami DEMO duomenys. Norint tikrų kainų, pakeisk searchFlights()
// kvietimu į tikrą API (Amadeus, Kiwi/Tequila, Duffel...) ir grąžink tą patį formatą:
// [{ airline, code, url, departIso, arriveIso, durationMin, stops, price, currency }]

function haversineKm(a, b) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Deterministinis atsitiktinių skaičių generatorius, kad tie patys paieškos rezultatai nesikeistų
function seeded(str) {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

async function searchFlightsDemo({ from, to, date, adults, returnDate }) {
  const a = AIRPORTS.find((x) => x.code === from);
  const b = AIRPORTS.find((x) => x.code === to);
  const km = haversineKm(a, b);
  const rand = seeded(`${from}${to}${date}`);
  const daysAhead = Math.max(0, (new Date(date) - new Date()) / 86400000);
  const urgency = daysAhead < 7 ? 1.5 : daysAhead < 21 ? 1.2 : 1;

  const eligible = AIRLINES.filter((al) => {
    if (al.type === "longhaul") return km > 2500;
    if (al.type === "lowcost") return km < 3500;
    return km < 6000 || al.type === "full";
  });

  const offers = [];
  for (const al of eligible) {
    if (rand() < 0.2) continue;
    const slots = 1 + Math.floor(rand() * 2);
    for (let i = 0; i < slots; i++) {
      const stops = km < 1500 ? (rand() < 0.15 ? 1 : 0) : km < 5000 ? (rand() < 0.45 ? 1 : 0) : 1;
      const flightMin = Math.round((km / 780) * 60 + 30 + stops * (70 + rand() * 120));
      const base = 25 + km * 0.07 * al.factor;
      const price = Math.round((base * (0.8 + rand() * 0.5) * urgency * adults * (returnDate ? 1.85 : 1)) / 1);
      const hour = 5 + Math.floor(rand() * 17);
      const minute = Math.floor(rand() * 12) * 5;
      const dep = new Date(`${date}T00:00:00`);
      dep.setHours(hour, minute);
      const arr = new Date(dep.getTime() + flightMin * 60000);
      offers.push({
        airline: al.name, code: al.code, url: al.url,
        departIso: dep.toISOString(), arriveIso: arr.toISOString(),
        durationMin: flightMin, stops, price, currency: "EUR",
        ...(returnDate ? { returnIso: new Date(`${returnDate}T12:00:00`).toISOString() } : {}),
      });
    }
  }
  await new Promise((r) => setTimeout(r, 600)); // imituojam tinklo vėlavimą
  return offers;
}

// Pirmiausia bandome tikrą serverį (/api/search). Jei jis neturi rakto arba nepasiekiamas,
// grįžtame prie demo duomenų. Grąžina { offers, demo, notice }.
async function searchFlights(params) {
  const q = new URLSearchParams({ from: params.from, to: params.to, date: params.date, adults: params.adults });
  if (params.returnDate) q.set("returnDate", params.returnDate);
  let notice = "";
  try {
    const res = await fetch(`/api/search?${q}`);
    const body = await res.json();
    if (res.ok && body.demo === false) {
      const offers = body.offers.map((o) => {
        const al = AIRLINES.find((a) => a.code === o.code);
        return { ...o, airline: al ? al.name : o.code };
      });
      return { offers, demo: false, notice: "", nearby: !!body.nearby, liveUrl: body.liveUrl || "" };
    }
    if (!res.ok) notice = body.error || "Serverio klaida.";
  } catch (e) {
    notice = "Serveris nepasiekiamas.";
  }
  const offers = await searchFlightsDemo(params);
  return { offers, demo: true, notice };
}

window.searchFlights = searchFlights;
window.haversineKm = haversineKm;

// ---- „Kur nuskristi?“: pigiausios kryptys iš vieno oro uosto ----

function exploreDemo({ from, month, budget, direct }) {
  const origin = AIRPORTS.find((x) => x.code === from);
  const list = [];
  for (const dest of AIRPORTS) {
    if (dest.code === from) continue;
    const rand = seeded(`${from}${dest.code}${month}`);
    const km = haversineKm(origin, dest);
    const stops = km < 1500 ? (rand() < 0.15 ? 1 : 0) : km < 5000 ? (rand() < 0.45 ? 1 : 0) : 1;
    if (direct && stops > 0) continue;
    const al = AIRLINES.filter((a) => (a.type === "longhaul" ? km > 2500 : a.type === "lowcost" ? km < 3500 : true))[0];
    const price = Math.round((25 + km * 0.07 * al.factor) * (0.8 + rand() * 0.5));
    if (budget && price > budget) continue;
    const day = new Date(month ? `${month}-01T00:00:00` : Date.now() + 14 * 864e5);
    day.setDate(day.getDate() + Math.floor(rand() * 25));
    list.push({
      dest: dest.code, airline: al.name, code: al.code, url: al.url, price, currency: "EUR",
      stops, departIso: day.toISOString(), durationMin: Math.round((km / 780) * 60 + 30),
    });
  }
  return list.sort((a, b) => a.price - b.price);
}

async function exploreFlights(params) {
  const q = new URLSearchParams({ from: params.from, budget: params.budget || 0, direct: params.direct ? 1 : 0 });
  if (params.month) q.set("month", params.month);
  let notice = "";
  try {
    const res = await fetch(`/api/explore?${q}`);
    const body = await res.json();
    if (res.ok && body.demo === false) {
      const destinations = body.destinations.map((o) => {
        const al = AIRLINES.find((a) => a.code === o.code);
        return { ...o, airline: al ? al.name : o.code };
      });
      return { destinations, demo: false, notice: "" };
    }
    if (!res.ok) notice = body.error || "Serverio klaida.";
  } catch (e) {
    notice = "Serveris nepasiekiamas.";
  }
  await new Promise((r) => setTimeout(r, 400));
  return { destinations: exploreDemo(params), demo: true, notice };
}
window.exploreFlights = exploreFlights;


// ---- Savaitgalio kelionės: išvykimas Pen/Šeš, grįžimas Sek/Pir, kaina už abi puses ----

function weekendDemo({ from, month, budget, direct }) {
  const origin = AIRPORTS.find((x) => x.code === from);
  const base = month ? new Date(`${month}-01T12:00:00Z`) : new Date(Date.now() + 3 * 864e5);
  const list = [];
  for (const dest of AIRPORTS) {
    if (dest.code === from) continue;
    const rand = seeded(`wk${from}${dest.code}${month}`);
    const km = haversineKm(origin, dest);
    const stops = km < 1500 ? (rand() < 0.15 ? 1 : 0) : km < 5000 ? (rand() < 0.45 ? 1 : 0) : 1;
    if (direct && stops > 0) continue;
    const al = AIRLINES.filter((a) => (a.type === "longhaul" ? km > 2500 : a.type === "lowcost" ? km < 3500 : true))[0];
    const price = Math.round((25 + km * 0.07 * al.factor) * (0.8 + rand() * 0.5) * 1.85);
    if (budget && price > budget) continue;
    const dep = new Date(base.getTime());
    dep.setUTCDate(dep.getUTCDate() + ((5 - dep.getUTCDay() + 7) % 7) + 7 * Math.floor(rand() * 3));  // artimiausi penktadieniai
    const nights = rand() < 0.5 ? 2 : 3;
    const ret = new Date(dep.getTime() + nights * 864e5);
    list.push({
      dest: dest.code, airline: al.name, code: al.code, url: al.url, price, currency: "EUR", stops, nights,
      departIso: dep.toISOString(), returnIso: ret.toISOString(), durationMin: Math.round((km / 780) * 60 + 30),
    });
  }
  return list.sort((a, b) => a.price - b.price);
}

async function weekendFlights(params) {
  const q = new URLSearchParams({ from: params.from, budget: params.budget || 0, direct: params.direct ? 1 : 0 });
  if (params.month) q.set("month", params.month);
  let notice = "";
  try {
    const res = await fetch(`/api/weekend?${q}`);
    const body = await res.json();
    if (res.ok && body.demo === false) {
      const destinations = body.destinations.map((o) => {
        const al = AIRLINES.find((a) => a.code === o.code);
        return { ...o, airline: al ? al.name : o.code };
      });
      return { destinations, demo: false, notice: "" };
    }
    if (!res.ok) notice = body.error || "Serverio klaida.";
  } catch (e) {
    notice = "Serveris nepasiekiamas.";
  }
  await new Promise((r) => setTimeout(r, 400));
  return { destinations: weekendDemo(params), demo: true, notice };
}
window.weekendFlights = weekendFlights;
