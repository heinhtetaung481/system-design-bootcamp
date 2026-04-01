-- Migration: 20260401000001_curriculum_prompt_seed
-- Description: Add migration tracking columns and seed curriculum/prompt template data.
--              This extends the schema created by 20260330000002.

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD MISSING COLUMNS (idempotent)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'curriculum_versions' AND column_name = 'source_file'
  ) THEN
    ALTER TABLE curriculum_versions ADD COLUMN source_file text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'curriculum_versions' AND column_name = 'content_hash'
  ) THEN
    ALTER TABLE curriculum_versions ADD COLUMN content_hash text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'curriculum_versions' AND column_name = 'migrated_from_json'
  ) THEN
    ALTER TABLE curriculum_versions ADD COLUMN migrated_from_json boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompt_templates' AND column_name = 'migrated_from_code'
  ) THEN
    ALTER TABLE prompt_templates ADD COLUMN migrated_from_code boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompt_templates' AND column_name = 'original_order'
  ) THEN
    ALTER TABLE prompt_templates ADD COLUMN original_order integer DEFAULT 0;
  END IF;
END
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD INDEXES (idempotent)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS idx_curriculum_single_active
  ON curriculum_versions (1) WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD TRIGGER FOR SYSTEM DEFAULT ENFORCEMENT
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION ensure_system_default_template()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM prompt_templates 
      WHERE slug = NEW.slug 
        AND user_id IS NULL 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Only one system default template allowed per slug';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_system_default ON prompt_templates;
CREATE TRIGGER trigger_ensure_system_default
  BEFORE INSERT OR UPDATE ON prompt_templates
  FOR EACH ROW EXECUTE FUNCTION ensure_system_default_template();

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA - CURRICULUM
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  existing_count integer;
BEGIN
  SELECT COUNT(*) INTO existing_count FROM curriculum_versions WHERE label = 'v1';
  
  IF existing_count = 0 THEN
    UPDATE curriculum_versions SET is_active = false WHERE is_active = true;
    
    INSERT INTO curriculum_versions (label, content, is_active, source_file, migrated_from_json)
    VALUES (
      'v1',
      '[{"phase":1,"phaseTitle":"Foundation Mastery","phaseColor":"#4F9DFF","phaseEmoji":"🏗️","weeks":[{"week":1,"weekTitle":"Networking, Scaling & Data","topics":[{"id":"networking","title":"Networking Fundamentals","emoji":"🌐","difficulty":"Beginner","tag":"Core","diagramId":"networking","keyPoints":["HTTP is stateless, runs over TCP — the default for all API calls","WebSockets = persistent bidirectional connection — use for real-time chat, live data","gRPC uses Protocol Buffers over HTTP/2 — faster, typed, better for internal microservices","DNS resolution: browser cache → OS cache → resolver → root → authoritative → IP","CDN serves static content from edge nodes close to users — reduces latency 50–90%"],"practice":[{"q":"When would you choose WebSockets over REST? Give a real-world example.","h":"Think about who initiates each message.","a":"Choose WebSockets when you need real-time bidirectional communication where the server pushes data without the client explicitly requesting it."},{"q":"A user in Auckland requests content from a US-East origin server. How would you reduce their latency?","h":"Think geographically.","a":"Add a CDN with edge nodes in Asia-Pacific (AWS CloudFront, Cloudflare). Static content cached at the edge — latency drops from 200ms to 20ms."}]},{"id":"scaling","title":"Scaling & Load Balancing","emoji":"⚖️","difficulty":"Beginner","tag":"Core","diagramId":"scaling","keyPoints":["Horizontal scaling: add more machines (scale out) — stateless required, more resilient","Vertical scaling: bigger machine (scale up) — simple, but has hardware ceiling and SPOF","Load balancer distributes traffic: round-robin, least connections, IP hash, weighted","Stateless services: session in Redis, not server memory — any server can handle any request","Auto-scaling: CloudWatch metrics trigger new instances"],"practice":[{"q":"Your service handles 1K RPS today. Design it to handle 100K RPS.","h":"Start with the bottleneck.","a":"Add a load balancer, make services stateless, add read replicas, set up auto-scaling groups."}]},{"id":"databases","title":"Database Internals & Indexing","emoji":"🗄️","difficulty":"Intermediate","tag":"Core","diagramId":"databases","keyPoints":["B-tree index: O(log N) reads/writes — default for most relational DB indexes","LSM tree: optimized for write-heavy workloads — used by Cassandra, RocksDB","Index tradeoffs: reads O(log N) vs writes slower vs storage cost","Query planner: analyzes indexes, chooses cheapest execution plan","N+1 problem: 1 query returns N rows, then N more queries per row"],"practice":[{"q":"A query takes 30 seconds on 100M rows. How do you fix it?","h":"Think about what the DB is doing without an index.","a":"Add an index: CREATE INDEX ON users(email). Now the query does a B-tree lookup: O(log N) instead of 100M."}]}]},{"week":2,"weekTitle":"Caching, CAP & Consistency","topics":[{"id":"caching","title":"Caching Strategies","emoji":"⚡","difficulty":"Intermediate","tag":"Component","diagramId":"caching","keyPoints":["Cache-aside (lazy loading): app checks cache, on miss reads DB and populates cache","Write-through: write to cache AND DB simultaneously","Write-back: write to cache only, async flush to DB","Cache eviction: LRU (least recently used) is default","Redis vs Memcached: Redis has persistence and data structures"],"practice":[{"q":"Your homepage shows a leaderboard that takes 5 seconds to compute. How do you cache it?","h":"Cache-aside with background refresh.","a":"On request: check Redis. Cache HIT: return. Cache MISS: compute, store with TTL=60s. Background refresh before TTL expires."}]},{"id":"cap","title":"CAP Theorem & Consistency","emoji":"⚖️","difficulty":"Intermediate","tag":"Core","diagramId":"cap","keyPoints":["CAP: in a distributed system, you can only guarantee 2 of 3: Consistency, Availability, Partition Tolerance","P (Partition Tolerance) is always required in distributed systems","CP systems (ZooKeeper, HBase): return error on partition rather than stale data","AP systems (Cassandra, DynamoDB): always respond, may return stale data"],"practice":[{"q":"You are designing a bank transfer system. Which side of CAP do you choose?","h":"Think about what stale data means in a financial context.","a":"Choose CP (Consistency over Availability). A bank cannot show stale account balance."}]},{"id":"hashing","title":"Consistent Hashing","emoji":"🔄","difficulty":"Intermediate","tag":"Component","diagramId":"hashing","keyPoints":["Consistent hashing minimizes key remapping when servers are added/removed","Virtual nodes: each server maps to 100–150 positions on the ring","Used by Cassandra, DynamoDB, Riak for partitioning data","Simple modulo hashing fails badly when N changes — all keys remapped"],"practice":[{"q":"You have 4 Redis servers. You add a 5th. What happens with modulo hashing?","h":"Calculate what fraction of keys move.","a":"With modulo hashing, ~80% of all keys now map to a different server — massive cache miss storm."}]}]},{"week":3,"weekTitle":"Message Queues & Microservices","topics":[{"id":"kafka","title":"Kafka & Event Streaming","emoji":"📨","difficulty":"Intermediate","tag":"Component","diagramId":"kafka","keyPoints":["Kafka topics are partitioned and replicated — ordered, immutable log","Consumer groups: each partition consumed by one consumer in the group","Retention: messages kept for 7 days — consumers can replay from any offset","At-least-once delivery by default — idempotent consumers required"],"practice":[{"q":"When would you use Kafka instead of a simple database queue table?","h":"Think about throughput and replayability.","a":"Use Kafka when: multiple consumers need same events, replay capability needed, 1M+ events/sec throughput."}]},{"id":"microservices","title":"Microservices & API Design","emoji":"🔌","difficulty":"Intermediate","tag":"Core","keyPoints":["Microservices: each service owns its data, deployed independently","Service communication: REST, gRPC (synchronous), Kafka (async)","API Gateway: single entry point, handles auth, rate limiting","Circuit breaker: fail fast when downstream is down"],"practice":[{"q":"Order Service needs to notify Inventory Service. REST vs Kafka?","h":"Think about what happens when Inventory Service is down.","a":"REST: immediate confirmation, but fails if Inventory is down. Kafka: Order Service succeeds even if Inventory is down."}]},{"id":"resilience","title":"Resilience & Fault Tolerance","emoji":"🛡️","difficulty":"Intermediate","tag":"Component","keyPoints":["Circuit breaker: closed → open after N failures","Retry with exponential backoff + jitter: avoid thundering herd","Bulkhead pattern: isolate failure domains","Timeout: always set timeouts"],"practice":[{"q":"Why is retry with jitter better than fixed backoff?","h":"Think about what happens when 1000 services all retry at once.","a":"Fixed backoff: all retry at T+2s simultaneously — thundering herd. Jitter adds randomness, spreads out retries."}]}]}]},{"phase":3,"phaseTitle":"Real-World Systems","phaseColor":"#FF8C42","phaseEmoji":"🏛️","weeks":[{"week":5,"weekTitle":"Classic Systems","topics":[{"id":"urlshortener","title":"Design URL Shortener","emoji":"🔗","difficulty":"Intermediate","tag":"System","diagramId":"urlshortener","keyPoints":["Read:write ratio = 1000:1 — heavy read optimization with aggressive caching","Base62 encoding: 7 chars = 62^7 = 3.5 trillion unique URLs","Use Redis atomic counter for ID generation","301 redirect: browser caches it. 302: browser always checks"],"practice":[{"q":"Walk through shortening a URL.","h":"Requirements → Estimation → API → DB → Architecture","a":"Requirements: shorten URL, redirect. Estimation: 100M DAU × 1/day. API: POST /shorten. DB: KV store. Architecture: LB → Redis → DynamoDB."}]},{"id":"twitter","title":"Design Twitter/X Feed","emoji":"🐦","difficulty":"Advanced","tag":"System","diagramId":"twitter","keyPoints":["Fan-out on write: push tweet to all followers Redis timelines immediately","Fan-out on read: merge timelines at query time","Hybrid: fan-out on write for users < 1M followers, on-read for celebrities","Tweet storage: Cassandra"],"practice":[{"q":"Katy Perry has 150M followers. She posts. What happens?","h":"Apply the hybrid fan-out strategy.","a":"Celebrity threshold: > 1M followers → NO fan-out on write. Tweet to Cassandra. Followers fetch from Cassandra on read."}]},{"id":"youtube","title":"Design YouTube","emoji":"▶️","difficulty":"Advanced","tag":"System","keyPoints":["Upload pipeline: raw → queue → transcoder → multiple bitrates","Adaptive bitrate: HLS/DASH serves different quality based on bandwidth","Video in S3, metadata in MySQL, recommendations in Bigtable/Cassandra","CDN serves 80%+ of traffic from ISP peering points"],"practice":[{"q":"Video upload pipeline for a 1GB video.","h":"Browser to final viewable video.","a":"Browser → S3: upload chunks. S3 → Lambda → Kafka. Transcoder workers: FFmpeg to 360p, 720p, 1080p, 4K. Store to S3. Update MySQL."}]}]},{"week":6,"weekTitle":"Advanced Real Systems","topics":[{"id":"uber","title":"Design Uber Ride Matching","emoji":"🚗","difficulty":"Advanced","tag":"System","diagramId":"uber","keyPoints":["Geohash encodes lat/lng into a string prefix","Redis GEOADD/GEORADIUS: O(N+log M) queries for nearby drivers","Driver location updates: 10M drivers × 1 update/4s = 2.5M writes/sec","Matching algorithm: find N nearest drivers, rank by ETA","Surge pricing: demand/supply ratio per geohash cell"],"practice":[{"q":"Design driver location tracking for 10M drivers updating every 4 seconds.","h":"That is 2.5M writes/sec.","a":"Redis Cluster with GEOADD. 10M drivers × 100 bytes = 1GB per node. Shard by city. 2.5M writes/sec across 50 nodes."}]},{"id":"ticketmaster","title":"Design Ticketmaster","emoji":"🎫","difficulty":"Advanced","tag":"System","keyPoints":["Flash sale problem: millions try to buy same seats simultaneously","Distributed lock: Redis SETNX with TTL — hold seat for 10 minutes","Virtual queue: place users in queue, process in order","Inventory service: strong consistency required"],"practice":[{"q":"5M users click Buy at once. Design the seat reservation system.","h":"Core concurrency problem.","a":"Virtual queue: all 5M users enter Redis queue. Process N users/sec. Redis SETNX {seat_id} {user_id} EX 600. Payment: write SOLD to DB."}]}]},{"week":7,"weekTitle":"Large Scale Design","topics":[{"id":"webcrawler","title":"Design a Web Crawler","emoji":"🕷️","difficulty":"Intermediate","tag":"System","diagramId":"webcrawler","keyPoints":["URL Frontier: priority queue sorted by page rank/freshness","Bloom Filter: O(1) have we seen this URL? — 1% false positive","Politeness: one request/second per domain","Content deduplication: SHA-256 hash of page body"],"practice":[{"q":"Prevent crawling same URL twice at 1 billion URLs scale?","h":"A database lookup would be too slow. Think probabilistic.","a":"Use a Bloom Filter: ~10 billion bits (1.25GB). Hash URL with K functions, set bits. Check: all bits set = probably seen."}]},{"id":"notification","title":"Design Notification System","emoji":"🔔","difficulty":"Intermediate","tag":"System","diagramId":"notification","keyPoints":["Multi-channel: push (APNs/FCM), email (SendGrid), SMS (Twilio)","Kafka topics per channel: independent scaling","User preferences: opt-in/out per channel","Idempotency: notification_id prevents duplicate sends"],"practice":[{"q":"Handle notification failures and retries?","h":"Dead letter queues and exponential backoff.","a":"429: exponential backoff. 410: remove token. Max retries exceeded: dead letter queue."}]}]}]},{"phase":4,"phaseTitle":"Advanced Patterns","phaseColor":"#9B7FFF","phaseEmoji":"🚀","weeks":[{"week":9,"weekTitle":"Enterprise & Advanced Scale","topics":[{"id":"cqrs","title":"CQRS & Event Sourcing","emoji":"⚡","difficulty":"Advanced","tag":"Advanced","keyPoints":["CQRS: separate read model from write model — each can scale independently","Event sourcing: store all state changes as events, not current state","Event replay: rebuild any read model by replaying events","Projections: materialized views built from event stream"],"practice":[{"q":"Design an order management system using CQRS.","h":"What are the write and read models?","a":"Write: OrderPlaced, PaymentProcessed commands. Read: OrderSummaryView, OrderDetailView — denormalized for each query pattern."}]},{"id":"saga","title":"Distributed Transactions & Saga","emoji":"🔄","difficulty":"Advanced","tag":"Advanced","keyPoints":["Two-phase commit: coordinator asks all to prepare, then commit — blocking","Saga pattern: sequence of local transactions, compensating for failures","Orchestration: central saga orchestrator drives the flow","Compensating transactions: undo actions when saga step fails"],"practice":[{"q":"Design a saga for e-commerce checkout.","h":"What happens if payment fails after inventory reserved?","a":"Step 1: ReserveInventory. Step 2: ChargeCard → FAIL → ReleaseInventory (compensating). Step 3: SendConfirmation."}]},{"id":"multiregion","title":"Multi-Region Architecture","emoji":"🌐","difficulty":"Advanced","tag":"Advanced","keyPoints":["Active-active: multiple regions serve traffic simultaneously","Active-passive: one region active, others on standby","Cross-region replication lag: 80-150ms US-East to EU-West","Geo-routing: Route53/Cloudflare routes to nearest region"],"practice":[{"q":"Design a globally distributed B2B SaaS. Handle GDPR?","h":"GDPR requires EU data to stay in EU.","a":"Region partitioning: EU customers → EU-West-1 only. US customers → US-East-1. Each region has own DB cluster."}]}]}]},{"phase":5,"phaseTitle":"Mock & Polish","phaseColor":"#FFB830","phaseEmoji":"🎯","weeks":[{"week":10,"weekTitle":"Interview Readiness","topics":[{"id":"netflix","title":"Design Netflix","emoji":"🎬","difficulty":"Advanced","tag":"System","keyPoints":["Open Connect: Netflix CDN — ISP-colocated servers serving 80%+ of traffic","Microservices: 700+ services, each independently deployed","Recommendation engine: collaborative filtering on watch history","Chaos Engineering: Chaos Monkey randomly kills production services"],"practice":[{"q":"Design Netflix video delivery for 200M concurrent streams.","h":"CDN strategy and adaptive bitrate.","a":"Open Connect in 1000+ ISP data centers. For 200M streams at 5Mbps: 1 Petabit/sec total."}]},{"id":"framework","title":"Interview Framework & Communication","emoji":"🎤","difficulty":"Beginner","tag":"Interview","keyPoints":["Always clarify requirements before designing","Back-of-envelope estimation shows you think at scale","Explicitly state your tradeoffs","Drive the interview — propose, get buy-in, go deep"],"practice":[{"q":"Interviewer says Design Instagram. First 5 minutes?","h":"Resist drawing boxes immediately.","a":"Clarify scope: photo feed, Stories, Reels, DMs? Scale: millions or billions? Functional: upload, follow, feed, like. Non-functional: 1B DAU, <5s upload."}]}]}]},{"phase":6,"phaseTitle":"Hello Interview Specials","phaseColor":"#00D4FF","phaseEmoji":"🎓","weeks":[{"week":11,"weekTitle":"Classic HI Problems I","topics":[{"id":"messenger","title":"Design Facebook Messenger","emoji":"💭","difficulty":"Advanced","tag":"System","keyPoints":["Message delivery: WebSocket for online users, push for offline","Message storage: one table per user or sharded by conversation_id","Read receipts: client sends ACK when message is read","Typing indicators: debounced WebSocket message"],"practice":[{"q":"Design message delivery for 1B users, handling online/offline.","h":"WebSocket for online, push for offline.","a":"Online: WebSocket → write to Cassandra. Offline: write + push. When online: deliver pending messages."}]},{"id":"dropbox","title":"Design Dropbox","emoji":"☁️","difficulty":"Advanced","tag":"System","diagramId":"dropbox","keyPoints":["Block-level sync: split files into 4MB blocks, only sync changed","Content-addressable storage: SHA-256(block) = block ID","Metadata: file tree, version history in distributed DB","Conflict resolution: last-write-wins or create conflict copy"],"practice":[{"q":"Block-level sync for a 10GB file where only 1MB changed?","h":"Delta sync.","a":"Split into 4MB blocks. Compute SHA-256. Send only blocks where hash differs. 10GB with 1MB change: send 1MB instead of 10GB."}]}]},{"week":12,"weekTitle":"Classic HI Problems II","topics":[{"id":"datamodeling","title":"Data Modeling at Scale","emoji":"🧬","difficulty":"Advanced","tag":"Advanced","keyPoints":["Denormalization: trade storage for read performance","Entity-Attribute-Value (EAV): flexible schema, but slow at scale","Time-series data: partition by time, compress old data","Soft deletes: deleted_at timestamp instead of DELETE"],"practice":[{"q":"Multi-tenant SaaS data model. Tenant isolation at scale?","h":"Three approaches.","a":"(1) Separate DB per tenant — highest isolation, expensive. (2) Separate schema per tenant. (3) Shared tables with tenant_id + PostgreSQL RLS."}]},{"id":"systemdesignreview","title":"Full System Design Walkthrough","emoji":"🏆","difficulty":"Advanced","tag":"Interview","keyPoints":["Requirements: functional + non-functional","Estimation: QPS = DAU × actions/day ÷ 86400","High-level design: 3-5 boxes — get buy-in first","Deep dive: pick the hardest component","Tradeoffs: present 2 options, state recommendation"],"practice":[{"q":"Design Instagram in 45 minutes.","h":"Requirements (5min) → Estimation → API → DB → Architecture → Deep Dive","a":"Requirements: 1B DAU, <5s upload, <200ms feed, 99.99% availability. Estimation: 100M photos/day = 1,160/sec writes. DB: MySQL + Redis + Cassandra + S3."}]}]}]},{"phase":7,"phaseTitle":"Capstone & Leadership","phaseColor":"#FFB830","phaseEmoji":"👑","weeks":[{"week":13,"weekTitle":"Staff-Level Thinking","topics":[{"id":"techlead","title":"Technical Leadership","emoji":"👨‍💻","difficulty":"Advanced","tag":"Advanced","keyPoints":["Influence without authority: build consensus, communicate rationale","Strategic vs tactical: say no to tactical wins that compromise vision","Technical debt: track it, pay it down systematically","Architecture decision records (ADRs): document decisions for future"],"practice":[{"q":"Conflicting stakeholder priorities. How do you navigate?","h":"Influence and prioritization.","a":"(1) Understand priorities deeply. (2) Find common ground on business outcomes. (3) Facilitate discussion with data. (4) Document decision."}]},{"id":"architecture","title":"Architecture at Scale","emoji":"🏗️","difficulty":"Advanced","tag":"Advanced","keyPoints":["Evolutionary architecture: design for change, embrace incremental evolution","Right-sized architecture: do not over-engineer for hypothetical scale","Cost optimization: understand cost per user, per transaction","Reliability patterns: SLAs, SLOs, SLIs — measure what matters"],"practice":[{"q":"System needs to handle 10x growth. What changes?","h":"Order of changes.","a":"(1) Profile first. (2) Add caching before scaling services. (3) Read replicas before sharding. (4) Async for non-critical paths."}]}]}]}]'::jsonb,
      true,
      'modules/curriculum/lib/curriculum-data.json',
      true
    );
    
    RAISE NOTICE 'Curriculum seeded successfully';
  ELSE
    RAISE NOTICE 'Curriculum already seeded, skipping';
  END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA - PROMPT TEMPLATES
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  INSERT INTO prompt_templates (slug, title, content, migrated_from_code, original_order)
  VALUES ('lesson', 'Lesson Generation Prompt', 
'You are an expert system design instructor at a FAANG company teaching a senior software engineer who is a visual learner preparing for system design interviews. Write a comprehensive, deeply detailed lesson.

CRITICAL RULES:
- Write COMPLETE content — do NOT truncate.
- Use rich visual HTML structure.
- Use callout boxes: <div class="callout callout-blue"><div class="callout-title">💡 KEY INSIGHT</div><p>text</p></div>
- Use stat cards: <div class="stat-grid"><div class="stat-card"><span class="stat-val">99ms</span><span class="stat-label">Redis p99</span></div></div>
- Use theory boxes: <div class="theory-box"><div class="theory-title">🔬 HOW IT WORKS</div></div>

FORMAT STRUCTURE:
<h2>🎯 What Is It & Why It Matters</h2>
<h2>🧠 Theory Deep Dive</h2>
<h2>📊 Scale & Numbers to Know</h2>
<h2>🏭 How Top Companies Actually Use This</h2>
<h2>⚖️ Tradeoffs — When To Use What</h2>
<h2>🔴 Common Failure Modes</h2>
<h2>🎤 Interview Playbook</h2>

Write with the depth of a senior staff engineer. Use real product names, real numbers, real failure stories.',
true, 1)
  ON CONFLICT (slug, user_id) DO UPDATE SET content = EXCLUDED.content, updated_at = now();

  INSERT INTO prompt_templates (slug, title, content, migrated_from_code, original_order)
  VALUES ('ask', 'Ask Question Response Prompt',
'You are an expert system design instructor. The student is a senior software engineer studying "{{topicTitle}}". Answer their question clearly and practically. Use concrete examples, real numbers, and reference actual systems. Format with HTML: <p>, <strong>, <ul><li> as needed. Be direct — no padding. Always write complete answers.',
true, 2)
  ON CONFLICT (slug, user_id) DO UPDATE SET content = EXCLUDED.content, updated_at = now();

  INSERT INTO prompt_templates (slug, title, content, migrated_from_code, original_order)
  VALUES ('diagram', 'Diagram Generation Prompt',
'You are an expert system design architect. Generate a visual architecture diagram as JSON.

{
  "title": "Descriptive diagram title",
  "nodes": [
    {"id": "unique_id", "label": "Label", "shape": "rect", "color": "#4F9DFF", "x": 100, "y": 100, "width": 140, "height": 50}
  ],
  "edges": [
    {"from": "source_id", "to": "target_id", "label": "optional label", "dashed": false}
  ]
}

SHAPES: rect (services), cylinder (databases), diamond (load balancers), circle (users)
COLORS: #4F9DFF (blue), #00D68F (green), #FF8C42 (orange), #9B7FFF (purple), #00D4FF (cyan), #FF5470 (red)
LAYOUT: x: 50–850, y: 50–550. Max 12 nodes.

OUTPUT: ONLY the JSON object. No markdown. No explanation. No code fences.',
true, 3)
  ON CONFLICT (slug, user_id) DO UPDATE SET content = EXCLUDED.content, updated_at = now();

  INSERT INTO prompt_templates (slug, title, content, migrated_from_code, original_order)
  VALUES ('models', 'AI Model Options Configuration',
'[{"id":"meta-llama/llama-4-scout:free","name":"Llama 4 Scout","description":"Meta'\''s Llama 4 Scout - free tier","color":"#7C3AED"},{"id":"google/gemini-2.0-flash-exp:free","name":"Gemini 2.0 Flash","description":"Google'\''s Gemini 2.0 Flash - free tier","color":"#1A73E8"},{"id":"deepseek/deepseek-r1:free","name":"DeepSeek R1","description":"DeepSeek R1 reasoning model - free tier","color":"#EF4444"},{"id":"mistralai/mistral-7b-instruct:free","name":"Mistral 7B","description":"Mistral 7B Instruct - fast and free","color":"#F59E0B"}]',
true, 4)
  ON CONFLICT (slug, user_id) DO UPDATE SET content = EXCLUDED.content, updated_at = now();

  RAISE NOTICE 'Prompt templates seeded successfully';
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION RECORD
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO schema_migrations (version, name) 
VALUES ('20260401000001', '20260401000001_curriculum_prompt_seed.sql')
ON CONFLICT (version) DO NOTHING;
