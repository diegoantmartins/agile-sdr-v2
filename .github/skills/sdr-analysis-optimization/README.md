# SDR Performance Analysis & Optimization Skill

## 📊 What This Skill Does

A **complete performance audit workflow** for the SDR Core system with:
- ✅ Bottleneck detection checklist
- ✅ Database optimization recommendations + SQL
- ✅ API optimization (pagination, caching, reduce API calls)
- ✅ Cron job optimization (native vs N8N decision matrix)
- ✅ Daily lead dispatch implementation (ready-to-use code)
- ✅ Performance targets & validation steps
- ✅ Load testing configuration

**Expected results:**
- 4-6x faster lead queries
- 50-80% fewer API calls to OpenAI
- 50-60x better throughput with batching
- 50% cost reduction overall

---

## 🚀 Quick Start (5-10 min)

### 1. **Open the Skill Documentation**
```bash
# The main skill is here:
.github/skills/sdr-analysis-optimization/SKILL.md

# Also included:
- daily-dispatch.job.ts          → Production-ready Cron job code
- n8n-daily-dispatch-workflow.json → N8N workflow template
- load-test.yml                   → Artillery performance test config
```

### 2. **Run Discovery Phase**
Follow the "📊 Discovery Phase" section in SKILL.md to:
- Check current database indexes
- Review cron job configuration
- Measure OpenAI API usage
- Check database connection pooling

**Time:** 2-3 minutes

### 3. **Review Bottleneck Checklist**
Cross-reference the "🚦 Performance Bottleneck Checklist" against your system:
- Which items have you noticed? (slow queries, API costs, latency)
- What's your current volume? (<50K, 50-100K, >100K leads)

**Time:** 2-3 minutes

### 4. **Choose Your Daily Dispatch Approach**
Decision matrix in SKILL.md:
- **Option A (Native Cron):** <50K leads/day, simple logic → Use `daily-dispatch.job.ts`
- **Option B (N8N):** >100K leads/day, complex workflows → Use `n8n-daily-dispatch-workflow.json`
- **Option C (Hybrid):** Best of both → Combine them

**Time:** 2 minutes

### 5. **Implement Phase 1: Database Optimization**
```bash
# Copy the SQL from SKILL.md Phase 1 and run in PostgreSQL:
psql -h localhost -p 5433 -U sdr -d sdr_core < phase1-indexes.sql

# Expected improvement: +60% query speed
```

---

## 📁 Included Files

| File | Purpose | Use Case |
|------|---------|----------|
| **SKILL.md** | Complete workflow + decision matrix | Read first, follow phases |
| **daily-dispatch.job.ts** | Production Cron job implementation | Paste into `src/application/cron/` |
| **n8n-daily-dispatch-workflow.json** | N8N visual workflow | Import into N8N UI |
| **load-test.yml** | Artillery performance test | Validate improvements |

---

## 🔍 How to Use This Skill

### Via /ask Command (Recommended)
```
/ask analyze this SDR system for performance bottlenecks
```
The agent will:
1. Load this skill automatically
2. Run discovery phase on your codebase
3. Generate performance report
4. Recommend implementation order

### Manual Reading
1. Open [SKILL.md](./SKILL.md)
2. Follow the numbered phases (1-4)
3. Copy code snippets to your project
4. Run validation checks at the end

### Quick Assessment
**Answer these 5 questions:**
1. How many leads per day? <5K | 5-50K | 50-500K | >500K
2. Current P99 API latency? <100ms | 100-500ms | 500ms-2s | >2s
3. OpenAI monthly cost? <$100 | $100-500 | $500-2K | >$2K
4. Number of servers? 1 | 2-3 | 4-10 | >10
5. Dispatch frequency? Once/day | Multiple times | Real-time

→ Jump to the relevant phase in SKILL.md

---

## 💡 Key Decisions Explained

### 1. **Cron vs N8N: When to Use Each?**

**Use Native Cron if:**
- <50K leads per day
- Can tolerate 1-2 second gaps between batches
- Want zero external dependencies
- Single deployment or highly available setup

**Use N8N if:**
- >100K leads per day OR complex workflows
- Want visual monitoring/debugging
- Need automatic retries + error handling
- Want to scale dispatch independently

**Hybrid (Recommended):**
- Local Cron for: cold storage cleanup, hourly follow-ups, metadata updates
- N8N for: daily bulk dispatches (scalable)

### 2. **Database Indexes Priority**

| Index | P0/P1 | Why | Speed Improvement |
|-------|-------|-----|------------------|
| `status + score DESC` | P0 | Filters hot leads + sorts by engagement | 60% |
| `createdAt DESC` | P0 | Time-based queries (new leads, time windows) | 40% |
| `company + phone` | P1 | Multi-column searches | 20% |
| `lastDispatch` | P1 | Dispatch scheduling queries | 25% |

### 3. **API Optimization Priority**

| Optimization | P0/P1 | Impact | Effort |
|--------------|-------|--------|--------|
| Add pagination | P0 | 40% memory reduction | 15min |
| Cache with Redis | P0 | 3x faster repeated queries | 20min |
| Pattern-first intent classification | P0 | 80% fewer API calls | already implemented ✅ |
| N+1 query fix (add `include` clauses) | P0 | 70% throughput increase | 10min |
| Connection pooling config | P1 | 50% more concurrent users | 5min |

---

## 📊 Performance Targets & Validation

After implementing optimizations, validate against targets:

```bash
# 1. Query performance (should be <200ms)
curl -w "Time: %{time_total}s\n" \
  http://localhost:3030/api/leads?status=HOT&limit=50

# 2. Load test (100 concurrent users)
artillery run load-test.yml

# 3. Database connections (should be <20)
psql -h localhost -p 5433 -U sdr -d sdr_core \
  -c "SELECT count(*) FROM pg_stat_activity;"

# 4. Cache efficiency (N8N/Redis metrics)
# Check via monitoring dashboard
```

---

## 🎯 Implementation Timeline

**Recommended phasing:**

| Phase | Duration | Impact | Blocking |
|-------|----------|--------|----------|
| **Phase 1: Database Indexes** | 15 min | +60% query speed | P0 ❌ Do first |
| **Phase 2: API Optimization** | 20 min | +40% throughput | P1 📋 After P1 |
| **Phase 3: Cron/N8N Setup** | 25 min | +30x throughput | P2 🎯 After database |
| **Phase 4: Monitoring** | 10 min | Visibility | P2 📊 Ongoing |

**Total: ~70 minutes for full optimization**

---

## 🆘 Troubleshooting

### "Queries still slow after indexes"
→ Check EXPLAIN ANALYZE output in Phase 1 to verify indexes are being used

### "N8N webhook times out"
→ Reduce batch size in n8n-daily-dispatch-workflow.json (default 500 → try 100)

### "OpenAI calls still high"
→ Verify pattern matching in intent.classifier.ts is running FIRST (before OpenAI call)

### "Load test shows connection pool exhausted"
→ Increase `connectionLimit` in datasource block of prisma/schema.prisma

---

## 📚 Related Documentation

- Main skill: [SKILL.md](./SKILL.md)
- SDR API docs: [../../API_EXAMPLES.md](../../API_EXAMPLES.md)
- Deployment guide: [../../DEPLOYMENT_GUIDE.md](../../DEPLOYMENT_GUIDE.md)
- Status checks: [../../STATUS.md](../../STATUS.md)

---

## ✅ Before You Start

- [ ] You have PostgreSQL access (for running indexes)
- [ ] Node.js 20+ installed locally
- [ ] Redis available (for caching)
- [ ] N8N instance running (if choosing N8N approach)
- [ ] UAZAPI credentials ready (for testing dispatches)

---

## 🎓 Learning Path

1. **New to SDR?** Read [../../README.md](../../README.md) first
2. **Performance concepts?** Start with "🚦 Bottleneck Checklist" in SKILL.md
3. **Ready to implement?** Follow Phases 1-4 in SKILL.md step-by-step
4. **Need code?** Copy from `daily-dispatch.job.ts` or `n8n-daily-dispatch-workflow.json`
5. **Validating?** Use `load-test.yml` to measure improvements

---

## 💬 Questions?

- "How do I know which optimization to do first?" → Answer the 5 questions in the QuickStart section
- "Should I use Cron or N8N?" → See decision matrix in SKILL.md
- "How long will this take?" → See Implementation Timeline above
- "What if my system is already optimized?" → Run the load test to verify baseline metrics

