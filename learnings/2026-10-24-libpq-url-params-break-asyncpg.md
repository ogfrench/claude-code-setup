---
date: 2026-10-24
source: a private project
tags: [database, deploy]
status: raw
promoted_to: []
---

# A libpq connection URL is not an asyncpg URL: switching the driver can drop the database

**What happened.** An ORM upgrade moved the app to SQLAlchemy's async engine, and the code
turned `postgresql://` into `postgresql+asyncpg://`. The hosted Postgres URL carried
`sslmode=require&channel_binding=require`. The new API started and passed every unit test,
then answered every health check with the database down. Two production deploys rolled
back before anyone found why.

**Why.** SQLAlchemy forwards URL query parameters to the driver as keyword arguments, and
asyncpg does not take libpq's `sslmode` or `channel_binding`. The old stack had passed the
URL to a libpq-based driver, which reads them natively. Local and CI databases use plain
URLs, so nothing there exercised the parameters.

**Do instead.** When the production URL has libpq parameters, use a libpq-based async
driver (psycopg 3, `postgresql+psycopg://`). Keep the security parameters; never strip them
to make a driver connect. Add an offline test that builds the engine from a URL with those
parameters and checks they reach the driver's connect arguments. Run one check against the
real connection string's shape before the first deploy.

**Evidence.** The health endpoint said `database: down` with Redis, search and the worker
all ok. With the same environment and the same URL, the psycopg 3 build deployed healthy
on the first try.
