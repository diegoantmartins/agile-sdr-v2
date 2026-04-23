#!/bin/bash
# Database optimization helper script
# Run PostgreSQL optimization commands for SDR Core

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_USER="${DB_USER:-sdr}"
DB_NAME="${DB_NAME:-sdr_core}"

echo "🚀 SDR Performance Optimization - Database Phase"
echo "=================================================="
echo "Target: PostgreSQL on $DB_HOST:$DB_PORT"
echo ""

# Phase 1: Add Performance Indexes
echo "📊 Phase 1: Creating performance indexes..."
echo ""

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF

-- Index 1: Hot leads filtering + sorting by score
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_status_score 
ON leads(status) 
WHERE status != 'ARCHIVED'
INCLUDE (score)
WITH (fillfactor = 80);

-- Index 2: Time-based queries (new leads, time windows)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_created_at 
ON leads(createdAt DESC);

-- Index 3: Company + Phone for bulk operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_company_phone 
ON leads(company, phone);

-- Index 4: Last dispatch for scheduling
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_last_dispatch 
ON leads(lastDispatch) 
WHERE lastDispatch IS NOT NULL;

-- Index 5: Score sorting (for leaderboards)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_score_desc 
ON leads(score DESC);

-- Verify indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'leads'
ORDER BY indexname;

EOF

echo "✅ Indexes created successfully!"
echo ""

# Phase 2: Analyze query plans
echo "📈 Phase 2: Analyzing query performance..."
echo ""

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF

-- Query: Get hot leads sorted by score
EXPLAIN ANALYZE
SELECT * FROM leads 
WHERE status = 'HOT' 
ORDER BY score DESC 
LIMIT 100;

-- Query: Get new leads
EXPLAIN ANALYZE
SELECT * FROM leads 
WHERE createdAt > NOW() - INTERVAL '24 hours'
ORDER BY createdAt DESC;

-- Query: Batch dispatch query
EXPLAIN ANALYZE
SELECT id, phone, name, company, score 
FROM leads 
WHERE status = 'HOT' 
  AND lastDispatch < NOW() - INTERVAL '24 hours'
LIMIT 500;

EOF

echo "✅ Query analysis complete!"
echo ""

# Phase 3: Connection pooling stats
echo "🔌 Phase 3: Checking database connections..."
echo ""

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF

SELECT 
  datname,
  usename,
  application_name,
  client_addr,
  state,
  count(*) as connection_count
FROM pg_stat_activity
WHERE datname IS NOT NULL
GROUP BY datname, usename, application_name, client_addr, state
ORDER BY connection_count DESC;

EOF

echo "✅ Database optimization complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update prisma/schema.prisma with connection pool settings:"
echo "   datasource db {"
echo '     provider = "postgresql"'
echo "     url      = env(\"DATABASE_URL\") # ?connection_limit=20&prepared_statement_cache_size=25"
echo "   }"
echo ""
echo "2. Restart Fastify server: npm start"
echo ""
echo "3. Run load test to validate improvements:"
echo "   artillery run load-test.yml"
echo ""
echo "4. Benchmark before/after:"
echo "   curl -w \"\\nTime: %{time_total}s\\n\" http://localhost:3030/api/leads?limit=50"
echo ""
