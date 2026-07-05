# Sync & Failover — Supabase → InsForge

Each of the 4 clusters runs on **Supabase (primary)** and **InsForge (warm
standby)**. This doc defines how the standby stays in sync and how the router
fails over to it. Goal: **high availability** — a Supabase cluster outage degrades
to its InsForge twin instead of taking the app down.

---

## Direction: strictly one-way (Supabase → InsForge)

```text
   writes ──► Supabase primary ──(continuous replication)──► InsForge standby
                    ▲                                              │
   normal reads ────┘                    failover reads ◄──────────┘
```

- The app **only writes to Supabase**. InsForge is read-only until promoted.
- This avoids dual-write divergence (a write that lands on one provider but not
  the other). A failover standby that's subtly wrong is worse than no standby.

---

## Sync mechanism — decision tree

The right mechanism depends on what InsForge actually supports. **Verify this
first** (blocking action item from [`01-projects.md`](01-projects.md)).

```text
Does InsForge expose a standard Postgres you can replicate INTO?
├─ YES, supports inbound LOGICAL REPLICATION
│     └─► Option A: Postgres logical replication
│         Supabase publishes; InsForge subscribes per table.
│         Near-real-time, low lag, built-in. BEST.
│
├─ PARTIAL, writable Postgres but no logical-replication subscriber
│     └─► Option B: CDC pipeline
│         Read Supabase WAL / change feed → apply to InsForge
│         (Debezium-style, or Supabase webhooks/triggers → queue → writer).
│         Near-real-time, more moving parts.
│
└─ NO, only app-level DB access
      └─► Option C: change-log table + replayer  (fallback)
          Router appends every write to an outbox table on Supabase;
          a worker replays the outbox into InsForge.
          Simplest to reason about; lag = worker interval; at-least-once.
          (For non-critical clusters only: Option D — scheduled dump/restore.)
```

**Recommendation order: A > B > C.** Use A if InsForge allows it; it's the least
code and the most faithful copy. Do **not** use naive dual-write.

### Per-cluster sync posture

| Cluster | Mechanism | Max acceptable lag | Notes |
|---|---|---|---|
| CORE | A (or B) | seconds | Identity must be fresh on failover |
| LEARN | A (or B) | seconds–minutes | |
| ANALYTICS | C or D acceptable | minutes | Losing recent telemetry on failover is OK |
| CONTENT | A/B | seconds–minutes | `chat_*` realtime won't replicate |

---

## Failover — how the router switches to InsForge

Failover is **per-cluster**, not all-or-nothing. If Supabase-LEARN is down but
the rest are healthy, only LEARN fails over.

### Health check

`health.ts` probes each cluster's Supabase side (cheap `SELECT 1` + latency,
every few seconds, with a circuit breaker). A cluster is "down" after N
consecutive failures / timeout.

### Read failover (automatic, immediate)

- Supabase side unhealthy → router serves **reads** from the InsForge standby
  right away. Standby may be slightly behind (bounded by sync lag) — acceptable
  for reads.

### Write failover (requires promotion — deliberate)

Writes are the dangerous part. You must **not** write to a standby that is still
receiving replication, or you get split-brain when Supabase returns.

- **Critical clusters (CORE, LEARN):** writes **fail fast** until an operator (or
  an automated runbook) **promotes** InsForge: stop replication, mark InsForge
  writable, flip `health.isPromoted(cluster)`. Only then does the router send
  writes to InsForge. This is a conscious "we've lost Supabase for a while"
  action, not an automatic flap.
- **Non-critical clusters (ANALYTICS, CONTENT):** the router may **queue writes**
  (outbox in Redis/CORE) and replay them when Supabase returns, or simply drop
  best-effort telemetry. Configurable per cluster.

### Failback (Supabase recovers)

1. Re-sync Supabase from InsForge **only if** InsForge was promoted and took
   writes (reverse replication or a reconciliation import). If InsForge never took
   writes, no reverse sync needed.
2. Re-establish Supabase → InsForge replication.
3. Flip health back; router returns to Supabase primary.
4. This is the trickiest step — **document a runbook and rehearse it** (see
   checklist below). Failback done wrong is how you lose data.

---

## Split-brain: the rule that prevents data loss

> **At most one provider per cluster is writable at any time.**

- Normal: Supabase writable, InsForge read-only (replicating).
- Failed over + promoted: InsForge writable, Supabase down (or fenced).
- Never both. The router enforces this via `isPromoted` + the health circuit
  breaker; promotion/demotion are explicit state transitions, not implicit.

---

## Auth on failover (CORE-specific)

Supabase Auth / RLS does **not** exist on InsForge. When CORE fails over to
InsForge-CORE:

- Session/JWT validation must work without Supabase Auth → the router validates
  tokens and enforces authz in the app for the duration of failover.
- **Plan this before you need it** — an untested auth path on failover means an
  outage becomes a security incident. See [`04-tradeoffs.md`](04-tradeoffs.md) §5.

---

## Operational checklist

- [ ] Confirm InsForge inbound-replication capability → pick mechanism A/B/C.
- [ ] Stand up sync per cluster; monitor **replication lag** as a first-class metric.
- [ ] Implement `health.ts` probes + circuit breaker per cluster/provider.
- [ ] Implement read failover; test by pausing a Supabase cluster.
- [ ] Write the **promotion** and **failback** runbooks; **rehearse** each.
- [ ] Verify CORE auth works in the promoted-InsForge path.
- [ ] Alert on: replication lag > threshold, cluster health flips, promotion events.
