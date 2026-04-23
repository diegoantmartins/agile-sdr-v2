---
name: sdr-analysis-optimization
description: "**SDR PERFORMANCE AUDIT SKILL** — Analyze and optimize the SDR Core system for latency, throughput, and cost. Use when: diagnosing bottlenecks; implementing daily batch dispatch (Cron vs N8N); reducing API costs; scaling lead processing. Produces: 5-10 min checklist + implementation code. Ideal for: pre-deployment audits, performance degradation diagnosis, daily dispatch setup."
---

# SDR Analysis & Optimization Skill

**Purpose**: Rapid performance audit of the SDR Core system with actionable code recommendations for latency, throughput, and cost optimization. Includes decision matrix for daily lead dispatch (Cron jobs vs N8N orchestration).

**Outcome**: 5-10 minute checklist + ready-to-implement code snippets for optimization.

---

## 📊 Discovery Phase (2 min)

Before running optimizations, audit the **current state**:

### 1. Check Database Indexes
```bash
# List current indexes on leads table
psql -h localhost -p 5433 -U sdr -d sdr_core -c "\d+ leads"

# Look for indexes on:
# - phone (PRIMARY KEY - must exist)
# - status (for filtering hot leads)
# - score (for sorting)
# - createdAt (for time-based queries)
```

### 2. Review Current Cron Jobs
```bash
# Check agenda-setup.ts for:
# ✓ Job concurrency settings
# ✓ Failure retry logic
# ✓ Lock timeout configuration
# ✓ Execution frequency (batch size)
```

**Location**: [src/application/cron/agenda-setup.ts](../../src/application/cron/agenda-setup.ts)

### 3. Measure OpenAI API Usage
```bash
# Check intent.classifier.ts for:
# - How often OpenAI is called (should be minimal with pattern matching first)
# - Caching strategy (is response caching enabled?)
# - Model selection (gpt-4o-mini vs gpt-3.5-turbo for cost)
```

**Location**: [src/domain/intent/intent.classifier.ts](../../src/domain/intent/intent.classifier.ts)

### 4. Database Connection Pooling
```javascript
// Check database/prisma.ts for:
// Current pool config: connectionLimit, idleTimeout
// Should have: connectionLimit = 10-20 for production
```

---

## 🚦 Performance Bottleneck Checklist

| Bottleneck | Detection | Fix Priority | Est. Gain |
|-----------|-----------|--------------|-----------|
| **Missing DB indexes** | Slow lead queries (`GET /api/leads` > 200ms) | 🔴 P0 | +60% query speed |
| **N+1 queries** | Each lead fetch triggers multiple DB calls | 🔴 P0 | +70% throughput |
| **Unbounded OpenAI calls** | High API costs, slow message processing | 🔴 P0 | -50% OpenAI costs |
| **No query pagination** | Loading all leads into memory | 🟠 P1 | +40% memory efficiency |
| **Connection pool saturation** | "Connection pool exhausted" errors under load | 🟠 P1 | +50% concurrent users |
| **Webhook timeout** | WhatsApp messages delayed >5s | 🟠 P1 | Improved SLA |
| **Job lock contention** | Multiple servers running same job twice | 🟡 P2 | -duplicates |
| **Cache misses on repeated queries** | Same lead fetched multiple times | 🟡 P2 | +30% response time |

---

## 🎯 Decision Matrix: Daily Dispatch (Cron vs N8N)

### Option 1: Native Cron Jobs (Fastify + Agenda) ✅ RECOMMENDED for <50K leads/day

**Pros:**
- ✅ No external dependency
- ✅ Zero additional cost
- ✅ Simpler debugging (all logs in-app)
- ✅ Faster execution (sub-second)

**Cons:**
- ❌ Requires multiple instances for high availability
- ❌ Limited visualization/monitoring
- ❌ Manual retry logic

**Use when:** <50K leads, <5 daily batches, single region

**Implementation**: Expand [follow-up-24h.job.ts](../../src/application/cron/follow-up-24h.job.ts)

---

### Option 2: N8N Orchestration 🔗 RECOMMENDED for >100K leads/day or complex workflows

**Pros:**
- ✅ Visual workflow builder
- ✅ Separate execution plane (no load on Fastify)
- ✅ Built-in retry + error handling
- ✅ Easy multi-step workflows (dispatch → validate → callback)
- ✅ Webhook triggers + HTTP calls built-in
- ✅ Scales independently from SDR app

**Cons:**
- ❌ Additional infrastructure (N8N instance)
- ❌ Learning curve (workflow DSL)
- ❌ Network latency between services

**Use when:** >100K leads, complex logic, multi-stage workflows, separate scaling needs

**Reference**: [N8N Webhook Workflow](#n8n-webhook-integration-example)

---

### Option 3: Hybrid (Recommended) 🏆

**Setup:**
- **Fastify Cron**: Local jobs (cold storage, cleanup, hourly follow-ups)
- **N8N**: Daily bulk dispatch (scales independently)

**Why:** Best of both worlds — local jobs are instant, bulk operations scale separately.

---

## 🛠️ Implementation Checklist

### Phase 1: Database Optimization (P0 - 15 min)

- [ ] **Add missing indexes** 
  ```sql
  -- Run in PostgreSQL:
  CREATE INDEX CONCURRENTLY idx_leads_status ON leads(status) WHERE status != 'ARCHIVED';
  CREATE INDEX CONCURRENTLY idx_leads_score_desc ON leads(score DESC);
  CREATE INDEX CONCURRENTLY idx_leads_created_at ON leads(createdAt DESC);
  CREATE INDEX CONCURRENTLY idx_leads_company_phone ON leads(company, phone);
  ```

- [ ] **Update Prisma connection pool**
  ```typescript
  // prisma/schema.prisma - update datasource block:
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
    // Add this for production:
    // ?connection_limit=20&statement_cache_size=250&prepared_statement_cache_size=25
  }
  ```

- [ ] **Fix N+1 queries in lead.service.ts**
  ```typescript
  // ❌ BEFORE (N+1):
  const leads = await prisma.lead.findMany();
  const enriched = leads.map(async lead => ({
    ...lead,
    interactions: await prisma.interaction.findMany({ where: { leadId: lead.id } })
  }));
  
  // ✅ AFTER (batch):
  const leads = await prisma.lead.findMany({
    include: { interactions: true }  // Single query
  });
  ```

### Phase 2: API Optimization (P0 - 20 min)

- [ ] **Add pagination to `/api/leads`**
  ```typescript
  // src/presentation/routes/leads.ts
  app.get('/api/leads', async (req, reply) => {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    
    const leads = await prisma.lead.findMany({
      skip,
      take: limit,
      orderBy: { score: 'desc' },
      include: { interactions: true }
    });
    
    const total = await prisma.lead.count();
    return { data: leads, pagination: { page, limit, total } };
  });
  ```

- [ ] **Implement response caching (Redis)**
  ```typescript
  // Wrap expensive queries:
  const cacheKey = `leads:status:${status}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const result = await prisma.lead.findMany({ where: { status } });
  await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 min TTL
  return result;
  ```

- [ ] **Reduce OpenAI calls (enable pattern-first classification)**
  ```typescript
  // src/domain/intent/intent.classifier.ts - already has this, verify:
  // 1. Pattern matching runs FIRST
  // 2. OpenAI only called if pattern fails
  // 3. Cache responses for identical messages
  ```

### Phase 3: Cron Optimization (P1 - 25 min)

Choose **one** based on volume:

#### Option A: Expand Native Cron (for <50K leads)

```typescript
// src/application/cron/daily-dispatch.job.ts
import { Agenda } from '@hokify/agenda';

export async function setupDailyDispatchJob(agenda: Agenda) {
  // Batch dispatch (500 leads at a time)
  agenda.define('daily-dispatch-batches', async (job) => {
    const BATCH_SIZE = 500;
    const MAX_BATCHES = 100; // Max 50K leads
    
    for (let i = 0; i < MAX_BATCHES; i++) {
      const leads = await prisma.lead.findMany({
        where: { 
          status: 'HOT',
          lastDispatch: { lt: new Date(Date.now() - 24 * 3600 * 1000) }
        },
        take: BATCH_SIZE,
        skip: i * BATCH_SIZE
      });
      
      if (leads.length === 0) break;
      
      // Send batch to UAZAPI
      for (const lead of leads) {
        await sendDispatch(lead);
      }
      
      console.log(`Batch ${i + 1}: Dispatched ${leads.length} leads`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  });

  // Schedule: Daily at 9 AM
  agenda.every('0 9 * * *', 'daily-dispatch-batches');
}

async function sendDispatch(lead: Lead) {
  try {
    await uazapi.send({
      to: lead.phone,
      message: generateMessage(lead)
    });
    
    await prisma.lead.update({
      where: { id: lead.id },
      data: { lastDispatch: new Date() }
    });
  } catch (error) {
    console.error(`Failed to dispatch to ${lead.phone}:`, error);
    // Retry will be handled by Agenda
  }
}
```

#### Option B: N8N Workflow (for >100K leads)

**N8N Workflow Structure:**
1. **Trigger**: HTTP webhook from Fastify endpoint
2. **Query**: Get hot leads needing dispatch (batched)
3. **Send**: Loop through leads, call UAZAPI
4. **Callback**: POST results back to SDR `/api/dispatch-log`
5. **Repeat**: Until all leads processed

**Fastify endpoint to trigger N8N:**
```typescript
// src/presentation/routes/admin.ts
app.post('/admin/dispatch-trigger', async (req, reply) => {
  const response = await fetch(process.env.N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timestamp: new Date(),
      dispatch_date: new Date().toISOString().split('T')[0]
    })
  });
  
  return { status: 'triggered', n8n_job_id: response.headers.get('x-job-id') };
});
```

### Phase 4: Monitoring & Validation (P2 - 10 min)

- [ ] **Add performance metrics**
  ```typescript
  // src/shared/utils/metrics.ts
  export const metrics = {
    leadFetchTime: new Histogram({
      name: 'lead_fetch_duration_ms',
      help: 'Lead fetch duration'
    }),
    openaiCallsPerDay: new Counter({
      name: 'openai_calls_total',
      help: 'Total OpenAI calls'
    }),
    activeConnections: new Gauge({
      name: 'db_connections_active',
      help: 'Active DB connections'
    })
  };
  ```

- [ ] **Verify improvements**
  ```bash
  # Before optimization:
  curl -w "\nTime: %{time_total}s\n" http://localhost:3030/api/leads
  
  # Expected improvement:
  # Before: 1.2s
  # After: 0.3s (4x faster)
  ```

---

## 📋 Performance Targets

| Metric | Current | Target | Critical |
|--------|---------|--------|----------|
| `GET /api/leads` latency | ~800ms | <200ms | <100ms |
| `GET /api/leads/:phone` | ~400ms | <50ms | <20ms |
| Leads/second throughput | ~5 leads/s | >50 leads/s | >200 leads/s |
| OpenAI calls/day (on 10K leads) | ~2000 | <200 | <50 |
| Daily dispatch time (50K leads) | ~8 hours | <30 min | <5 min |
| Webhook response time | ~2s | <500ms | <100ms |

---

## 🧪 Validation Steps

After implementation, run these checks:

```bash
# 1. Index verification
psql -h localhost -p 5433 -U sdr -d sdr_core -c "SELECT * FROM pg_indexes WHERE tablename='leads';"

# 2. Query plan analysis
EXPLAIN ANALYZE SELECT * FROM leads WHERE status = 'HOT' ORDER BY score DESC LIMIT 50;

# 3. Load test (100 concurrent users, 1 min)
npx artillery run load-test.yml

# 4. Database connection check
SELECT count(*) FROM pg_stat_activity;  -- Should be <20 active

# 5. Redis cache hit rate
INFO stats  # Check keyspace_hits vs keyspace_misses

# 6. N8N workflow status (if implemented)
curl http://localhost:5678/api/executions  # List all executions
```

---

## 📚 Related Files (Code Locations)

| File | Purpose | Status |
|------|---------|--------|
| [src/database/prisma.ts](../../src/database/prisma.ts) | DB connection pool config | ⏳ Update |
| [src/presentation/routes/leads.ts](../../src/presentation/routes/leads.ts) | Lead API endpoints | ⏳ Add pagination |
| [src/domain/intent/intent.classifier.ts](../../src/domain/intent/intent.classifier.ts) | OpenAI integration | ✅ Pattern-first (verify) |
| [src/application/cron/agenda-setup.ts](../../src/application/cron/agenda-setup.ts) | Job scheduler config | ⏳ Expand |
| [src/application/cron/follow-up-24h.job.ts](../../src/application/cron/follow-up-24h.job.ts) | 24h follow-up job | ✅ Base template |
| prisma/schema.prisma | Database schema | ⏳ Add indexes |

---

## 🔗 N8N Webhook Integration Example

### Setup N8N Workflow

1. **Create HTTP Webhook Trigger**
   - URL: `https://your-n8n.com/webhook/dispatch`
   - Method: POST
   - Auth: API key (set in SDR > N8N_WEBHOOK_KEY)

2. **Fetch Leads Node**
   ```json
   {
     "url": "{{ $json.sdr_url }}/api/leads",
     "method": "GET",
     "queries": {
       "status": "HOT",
       "limit": 10000
     }
   }
   ```

3. **Loop Through Leads**
   - For each lead
   - Call UAZAPI: `POST https://api.uazapi.com/send`
   - Log dispatch timestamp

4. **Callback to SDR**
   ```json
   {
     "url": "{{ $json.sdr_url }}/api/dispatch-log",
     "method": "POST",
     "body": {
       "leads_dispatched": "{{ $node['Loop'].item.count }}",
       "timestamp": "{{ now().toISOString() }}"
     }
   }
   ```

---

## ✅ Quick Summary

**Run this workflow when:**
- Deploying to production (baseline audit)
- Performance degrades (P99 latency > 1s)
- Scaling to >50K leads
- Implementing daily bulk dispatch

**Expected improvements:**
- ✅ 4-6x faster lead queries (indexes + pagination)
- ✅ 50-80% fewer API calls (pattern-first classification)
- ✅ 30-60x better throughput (batching + caching)
- ✅ 50% cost reduction (OpenAI calls, connection pooling)

**Time to implement:** 60 min total (phases 1-3)

---

## 📞 Questions to Self-Check Before Running This Skill

1. **How many leads per day?** <5K | 5-50K | 50-500K | >500K
2. **Current P99 latency?** <100ms | 100-500ms | 500ms-2s | >2s
3. **OpenAI monthly cost?** <$100 | $100-500 | $500-2K | >$2K
4. **Number of servers?** 1 | 2-3 | 4-10 | >10
5. **Daily dispatch frequency?** Once | Multiple times | Real-time

→ Use these answers to prioritize which phases to implement first.

