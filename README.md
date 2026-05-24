# Crypto·Watch Terminal

A real-time cryptocurrency price dashboard with a Bloomberg-terminal aesthetic. Live prices, high/low ranges, interactive charts, relative-performance overlays, multi-timezone clocks, and CSV/JSON export — built on a clean-architecture Rust backend and an Astro + React frontend.

> **🚧 Work in progress.** The core feature set is complete and functional, but this project is **not finished**. More cryptocurrencies will be added (currently Bitcoin, Litecoin, Solana, and Ethereum), along with further enhancements. See [Roadmap](#roadmap).

---

## Features

- **Live spot prices** for BTC, LTC, SOL, ETH in USD & EUR
- **Real-time updates** over WebSockets — prices flash green/red as they move, no refresh
- **24h percent change** indicators on each price
- **High / Low range** with day / week / month tabs and a computed spread %
- **Per-coin price charts** — a 2×2 grid, each auto-scaled
- **Relative performance overlay** — all coins normalized to % change on one axis
- **Multi-timezone clocks** — New York, London, Tokyo, Madrid, ticking live
- **Data export** — download any coin's price series as CSV or JSON
- **Dark / light theme** toggle with an amber accent, persisted across sessions

---

## Tech Stack

**Backend**
- [Rust](https://www.rust-lang.org/) with [Axum](https://github.com/tokio-rs/axum) (web framework)
- [SQLx](https://github.com/launchbadge/sqlx) with PostgreSQL, over **TLS 1.3** (rustls)
- [Tokio](https://tokio.rs/) async runtime
- Price data from the [CoinGecko API](https://www.coingecko.com/en/api)
- Clean / hexagonal architecture (domain · application · infrastructure · presentation)

**Frontend**
- [Astro](https://astro.build/) with React islands
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) for charting
- TypeScript, mirroring the backend's clean-architecture layering

---

## Architecture

Both backend and frontend follow the same hexagonal pattern: inner layers know nothing of outer ones, and dependencies point inward through interfaces ("ports").

```
Backend (Rust)                      Frontend (TypeScript)
├── domain/          entities       ├── domain/          types
├── application/     ports +        ├── application/     ports +
│                    use cases      │                    use cases
├── infrastructure/  adapters       ├── infrastructure/  adapters
│   ├── persistence  (sqlx)         │   ├── http          (fetch)
│   ├── external     (coingecko)    │   ├── websocket      (live)
│   └── scheduler    (polling)      │   └── container      (composition root)
└── presentation/    axum handlers  └── presentation/    components + hooks
```

The backend polls CoinGecko on an interval, stores snapshots in PostgreSQL, and broadcasts each batch to WebSocket subscribers. The frontend reads via REST for the initial load and subscribes to the WebSocket for live updates — components depend only on use cases, never on `fetch` or the API URL directly.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Liveness check |
| `GET` | `/api/prices/latest` | Latest price for every coin/currency |
| `GET` | `/api/prices/extremes?coin=&currency=&period=` | Highest & lowest over a period |
| `GET` | `/api/prices/series?coin=&currency=&period=` | Time-series for charts |
| `GET` | `/api/prices/export?coin=&currency=&period=` | Download price series as CSV |
| `WS`  | `/api/ws` | Real-time price broadcast |

`coin` ∈ `BTC, LTC, SOL, ETH` · `currency` ∈ `USD, EUR` · `period` ∈ `day, week, month`

---

## Getting Started

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Node.js](https://nodejs.org/) 18+ (20+ recommended)
- [PostgreSQL](https://www.postgresql.org/) with SSL enabled

### 1. Database setup

Create the database and enable SSL on your PostgreSQL server (generate a self-signed cert for local development and set `ssl = on` in `postgresql.conf`).

```sql
CREATE DATABASE crypto_dashboard;
```

### 2. Backend

Create a `.env` file in the project root:

```env
DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/crypto_dashboard
DB_MAX_CONNECTIONS=5
DB_SSL_MODE=require
DB_CA_CERT_PATH=
POLL_INTERVAL_SECONDS=60
```

Run the migrations and start the server:

```bash
sqlx migrate run
cargo run
```

The backend starts on `http://127.0.0.1:8080`, begins polling CoinGecko, and serves the API.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard is available at `http://localhost:4321`.

> Run both the backend and frontend simultaneously. CORS is configured to allow the frontend's dev origin.

---

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — (required) |
| `DB_MAX_CONNECTIONS` | Connection pool size | `5` |
| `DB_SSL_MODE` | `require` or `verify-full` | `require` |
| `DB_CA_CERT_PATH` | CA cert path (required for `verify-full`) | — |
| `POLL_INTERVAL_SECONDS` | How often to poll CoinGecko | `300` |

**TLS:** The backend connects to PostgreSQL over TLS. `require` encrypts the connection; `verify-full` additionally verifies the server certificate against a CA (set `DB_CA_CERT_PATH`). Switching modes is a `.env` change — no code edits.

---

## Roadmap

This project is actively being developed. Planned additions:

- [ ] **More cryptocurrencies** — expand beyond the current four coins
- [ ] 24h volume and market-cap indicators
- [ ] Configurable / user-selectable coins
- [ ] Excel (`.xlsx`) export
- [ ] `verify-full` TLS in production
- [ ] Deployment guide
- [ ] Additional timezones / configurable clocks

---

## License

This project is provided as-is for educational and personal use.

---

## Acknowledgements

Price data provided by [CoinGecko](https://www.coingecko.com/). Built with Rust, Axum, Astro, and Recharts.
