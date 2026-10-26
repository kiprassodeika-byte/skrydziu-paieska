# Skrydžių paieška

Svetainė skrydžiams ir kainoms rasti. „Mano vieta“ nustato artimiausią oro uostą, o paspaudus skrydį žmogus nukreipiamas į pirkimo puslapį.

## Paleidimas

```bash
python3 server.py
```

Atidaryk http://127.0.0.1:5173. Papildomų paketų nereikia, tik Python 3.

Be raktų svetainė veikia **demo režimu** (išgalvotos kainos).

## Tikros kainos (Travelpayouts / Aviasales)

1. Užsiregistruok https://www.travelpayouts.com ir prisijunk prie Aviasales programos.
2. Profilyje rask **API token** ir **marker** (partnerio ID).
3. Nukopijuok `.env.example` į `.env` ir įrašyk reikšmes:
   ```
   TRAVELPAYOUTS_TOKEN=tavo_tokenas
   TRAVELPAYOUTS_MARKER=tavo_markeris
   ```
4. Perleisk `python3 server.py`. Terminale turi atsirasti „tikri duomenys (Aviasales)“.

`.env` niekada nekelk į viešą saugyklą ir niekam nesiųsk.

## Režimai

- **Ieškoti skrydžio**: konkretus maršrutas ir data.
- **Kur nuskristi?**: įvedate išvykimo oro uostą, biudžetą ir mėnesį, o svetainė parodo pigiausias kryptis (vienas pasiūlymas kiekvienai krypčiai). Naudoja `/api/explore`.

## Ką reikia žinoti

- Aviasales Data API grąžina **talpykloje saugomas kainas** (ką vartotojai rado per paskutines ~48 val.), ne gyvą prieinamumą. Galutinė kaina pirkimo puslapyje gali skirtis.
- Dėl talpyklos rezultatų būna nedaug (dažnai 1–3 pasiūlymai maršrutui ir datai), o retiems maršrutams gali nebūti nė vieno. Daugiau ir gyvų pasiūlymų duotų Aviasales Flight Search API, bet jam reikia atskiro patvirtinimo iš Travelpayouts.
- „Pirkti“ nuoroda veda į Aviasales, kur matyti pardavėjai (aviakompanija ar agentūra). Už pirkimus per tavo `marker` mokamas komisinis.
- Rodomas išvykimo laikas yra oro uosto vietos laikas. Atvykimo laiko tikri duomenys neduoda, todėl jo nerodome.
- Nuorodos formatas (`/search/...` + `marker`) sudarytas pagal viešą dokumentaciją. Pirmą kartą paspausk „Pirkti“ ir patikrink, ar atsidaro teisingas puslapis ir ar nuorodoje yra tavo marker.

## Failai

| Failas | Paskirtis |
|---|---|
| `server.py` | Serveris: atiduoda puslapį ir `/api/search`, laiko raktus |
| `provider.js` | Kreipiasi į `/api/search`, o be rakto naudoja demo duomenis |
| `app.js`, `index.html`, `style.css` | Sąsaja |
| `data.js` | Oro uostai ir aviakompanijos (pavadinimai pagal kodą) |

## Talpinimas internete

Paruošta [Render](https://render.com) (failas `render.yaml`):

1. Įkelk projektą į GitHub saugyklą. `.gitignore` jau neleidžia įkelti `.env`.
2. Render: **New → Blueprint**, pasirink saugyklą.
3. Paprašytas įvesk `TRAVELPAYOUTS_TOKEN` ir `TRAVELPAYOUTS_MARKER` (jų nėra kode, tik Render nustatymuose).
4. Po kelių minučių gausi adresą `https://….onrender.com`.

Pastabos: nemokamas Render planas užmiega po ~15 min. neveiklos (pirmas atidarymas lėtas). HTTPS gaunamas automatiškai, o jo reikia mygtukui „Mano vieta“. Serveris riboja užklausas iki 20 per minutę vienam IP.
