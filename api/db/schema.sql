-- Tiger Data (Postgres + TimescaleDB). Idempotent: safe to re-run.
-- Records keep the 06-data-model-contract.md shape in a jsonb column;
-- a few fields are pulled out as columns for filtering and joins.

CREATE TABLE IF NOT EXISTS regions (
    id           text PRIMARY KEY,
    name         text NOT NULL,
    kind         text NOT NULL CHECK (kind IN ('earth', 'orbit')),
    state        text,
    lat          double precision,
    lng          double precision,
    has_parcels  boolean NOT NULL DEFAULT false,
    record       jsonb NOT NULL,          -- full contract record
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parcels (
    id                  text PRIMARY KEY, -- e.g. hou-001
    region_id           text NOT NULL REFERENCES regions(id),
    costar_property_id  bigint,
    lat                 double precision,
    lng                 double precision,
    record              jsonb NOT NULL,
    updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Time series: one row per (month, state, sector).
CREATE TABLE IF NOT EXISTS electricity_prices (
    time         timestamptz NOT NULL,    -- first day of the observed month
    state        text NOT NULL,
    sector       text NOT NULL,
    usd_per_kwh  double precision NOT NULL,
    status       text NOT NULL,           -- preliminary | final
    source_url   text NOT NULL,
    retrieved    date NOT NULL,
    PRIMARY KEY (state, sector, time)
);
SELECT create_hypertable('electricity_prices', by_range('time'), if_not_exists => TRUE);

-- Time series: every computed score/verdict, so "what changed" = latest vs previous.
CREATE TABLE IF NOT EXISTS score_history (
    time                 timestamptz NOT NULL DEFAULT now(),
    kind                 text NOT NULL CHECK (kind IN ('region', 'parcel')),
    target_id            text NOT NULL,
    score                double precision,
    verdict              text CHECK (verdict IN ('buy', 'maybe', 'pass')),
    max_price_per_acre   double precision,
    inputs               jsonb,          -- assumptions used, for explaining the change
    PRIMARY KEY (kind, target_id, time)
);
SELECT create_hypertable('score_history', by_range('time'), if_not_exists => TRUE);

-- One shared demo watchlist, no login.
CREATE TABLE IF NOT EXISTS watchlist (
    kind       text NOT NULL CHECK (kind IN ('region', 'parcel')),
    target_id  text NOT NULL,
    added_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (kind, target_id)
);

CREATE TABLE IF NOT EXISTS reports (
    report_id     text PRIMARY KEY,
    kind          text NOT NULL,
    target_id     text NOT NULL,
    status        text NOT NULL CHECK (status IN ('running', 'done', 'failed')),
    body          jsonb,
    generated_at  timestamptz NOT NULL DEFAULT now()
);
