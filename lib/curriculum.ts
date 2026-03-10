import { Phase } from '@/types';

// Color constants matching original design
const C = {
  blue: '#4F9DFF',
  green: '#00D68F',
  orange: '#FF8C42',
  purple: '#9B7FFF',
  red: '#FF5470',
  cyan: '#00D4FF',
  gold: '#FFB830',
};

export const CURRICULUM: Phase[] = [
  {
    phase: 1, phaseTitle: 'Foundation Mastery', phaseColor: C.blue, phaseEmoji: '🏗️',
    weeks: [
      {
        week: 1, weekTitle: 'Networking, Scaling & Data',
        topics: [
          {
            id: 'networking', title: 'Networking Fundamentals', emoji: '🌐', difficulty: 'Beginner', tag: 'Core',
            diagramId: 'networking',
            keyPoints: [
              'HTTP is stateless, runs over TCP — the default for all API calls',
              'WebSockets = persistent bidirectional connection — use for real-time chat, live data',
              'gRPC uses Protocol Buffers over HTTP/2 — faster, typed, better for internal microservices',
              'DNS resolution: browser cache → OS cache → resolver → root → authoritative → IP',
              'CDN serves static content from edge nodes close to users — reduces latency 50–90%',
            ],
            practice: [
              {
                q: 'When would you choose WebSockets over REST? Give a real-world example.',
                h: 'Think about who initiates each message.',
                a: 'Choose WebSockets when you need real-time bidirectional communication where the server pushes data without the client explicitly requesting it. Examples: live chat apps (WhatsApp, Slack), multiplayer game state, stock tickers, collaborative document editing (Google Docs), live sports scores. REST is better for standard request/response where the client always initiates — like fetching a user profile or submitting a form.',
              },
              {
                q: 'A user in Auckland requests content from a US-East origin server. How would you reduce their latency?',
                h: 'Think geographically. What sits between user and server?',
                a: 'Add a CDN with edge nodes in Asia-Pacific (AWS CloudFront, Cloudflare). Static content (images, JS, CSS, videos) is cached at the edge — served from Sydney or Singapore instead of Virginia. Latency drops from 200ms to 20ms for cached assets. For dynamic content: use API gateway with regional replication, or origin shield to reduce origin hits. For personalized data: geo-route API requests to nearest regional cluster (Route 53 latency-based routing). This is why Netflix Open Connect places servers inside ISPs globally.',
              },
            ],
          },
          {
            id: 'scaling', title: 'Scaling & Load Balancing', emoji: '⚖️', difficulty: 'Beginner', tag: 'Core',
            diagramId: 'scaling',
            keyPoints: [
              'Horizontal scaling: add more machines (scale out) — stateless required, more resilient',
              'Vertical scaling: bigger machine (scale up) — simple, but has hardware ceiling and SPOF',
              'Load balancer distributes traffic: round-robin, least connections, IP hash, weighted',
              'Stateless services: session in Redis, not server memory — any server can handle any request',
              'Auto-scaling: CloudWatch metrics trigger new instances — CPU > 70% → add server',
            ],
            practice: [
              {
                q: 'Your service handles 1K RPS today. Design it to handle 100K RPS.',
                h: 'Start with the bottleneck — is it CPU, memory, or I/O?',
                a: 'First profile to find the bottleneck. For a typical web API: 1) Add a load balancer (AWS ALB) distributing to multiple stateless app servers — scale to 10 instances. 2) Make services stateless — move sessions to Redis. 3) Add read replicas to the database to handle 10x read traffic. 4) Set up auto-scaling groups with CloudWatch metrics (CPU > 70% → add instance). 5) CDN for static assets. The database is usually the first constraint — shard or add read replicas before anything else.',
              },
              {
                q: 'What is a sticky session and when is it a problem?',
                h: 'Think about what breaks when the server goes down.',
                a: 'A sticky session routes the same client to the same server every request (usually via IP hash or cookie). Problem: it breaks horizontal scaling benefits — one server can become hotspot. Worse, if that server goes down, the user\'s session is lost. Solution: Move session state out of server memory into a shared Redis store. Then any server can handle any request, and you can freely scale/replace servers without session loss.',
              },
            ],
          },
          {
            id: 'databases', title: 'Database Internals & Indexing', emoji: '🗄️', difficulty: 'Intermediate', tag: 'Core',
            diagramId: 'databases',
            keyPoints: [
              'B-tree index: O(log N) reads/writes — default for most relational DB indexes',
              'LSM tree (Log-Structured Merge): optimized for write-heavy workloads — used by Cassandra, RocksDB',
              'Index tradeoffs: reads O(log N) vs writes slower (maintain index) vs storage cost',
              'Query planner: analyzes indexes available, chooses cheapest execution plan — EXPLAIN to inspect',
              'N+1 problem: 1 query returns N rows, then N more queries per row — use JOIN or eager loading',
            ],
            practice: [
              {
                q: 'You have a users table with 100M rows. A query SELECT * FROM users WHERE email = ? takes 30 seconds. How do you fix it?',
                h: 'Think about what the DB is doing without an index.',
                a: 'Without an index, the DB does a full table scan — reads all 100M rows. Fix: CREATE INDEX idx_users_email ON users(email). Now the query does a B-tree lookup: O(log N) = ~27 comparisons instead of 100M. Result: <1ms instead of 30 seconds. Considerations: if email is unique, use UNIQUE INDEX (also enforces uniqueness). If you also query by email + status, consider a composite index (email, status). Index has costs: slower writes (index must be updated), extra storage (~8 bytes × 100M = 800MB). Always EXPLAIN ANALYZE before and after to verify.',
              },
              {
                q: 'When would you choose Cassandra over PostgreSQL?',
                h: 'Think about the CAP theorem and access patterns.',
                a: 'Choose Cassandra when: (1) Write-heavy workload: Cassandra writes are O(1) — append to memtable, flush to SSTable. Postgres B-tree writes are O(log N). At 1M writes/sec, Cassandra wins. (2) Horizontal scaling required: Cassandra scales linearly by adding nodes. Postgres sharding is painful. (3) Wide-row access patterns: e.g., fetch all tweets by user_id ordered by timestamp — Cassandra\'s partitioning by user_id is perfect. (4) Multi-region active-active: Cassandra was designed for this. Postgres replication is primary-secondary only. Choose Postgres when: complex queries with JOINs, strong ACID transactions, schema flexibility with JSONB, smaller scale (<10M rows).',
              },
            ],
          },
        ],
      },
      {
        week: 2, weekTitle: 'Caching, CAP & Consistency',
        topics: [
          {
            id: 'caching', title: 'Caching Strategies', emoji: '⚡', difficulty: 'Intermediate', tag: 'Component',
            diagramId: 'caching',
            keyPoints: [
              'Cache-aside (lazy loading): app checks cache, on miss reads DB and populates cache',
              'Write-through: write to cache AND DB simultaneously — no stale data, slower writes',
              'Write-back (write-behind): write to cache only, async flush to DB — fast writes, data loss risk',
              'Cache eviction: LRU (least recently used) is default — removes coldest data when full',
              'Redis vs Memcached: Redis has persistence, data structures, pub/sub — almost always use Redis',
            ],
            practice: [
              {
                q: 'Your homepage shows a leaderboard that\'s expensive to compute (5 seconds). How do you cache it?',
                h: 'Think about TTL, invalidation, and what happens when cache misses.',
                a: 'Cache-aside with background refresh: (1) On request: check Redis for leaderboard key. (2) Cache HIT: return cached JSON in <1ms. (3) Cache MISS (first load or expired): compute leaderboard (5s), store in Redis with TTL=60s. (4) Return to user. Background refresh: set a job to recompute and update cache every 55s (before TTL expires). This way no user waits 5 seconds after initial warm-up. Use Redis EX 60 (expires in 60s). Consider: if leaderboard changes often, reduce TTL. If it changes rarely (daily), set TTL=3600. Dog-pile / thundering herd problem: if cache expires and 100 requests arrive simultaneously, all compute the leaderboard. Fix: use distributed mutex (Redis SETNX) — only one request computes, others wait.',
              },
              {
                q: 'What is cache stampede and how do you prevent it?',
                h: 'Think about what happens when a popular key expires.',
                a: 'Cache stampede: a popular cached key expires, and 1000 simultaneous requests all miss and try to recompute the value concurrently, overloading the database. Prevention strategies: (1) Mutex/distributed lock: first request to miss acquires Redis lock (SETNX), computes value, releases lock. Other requests wait and retry — cache hit after lock released. (2) Probabilistic early expiration: before TTL expires, each request has a small probability of refreshing early — spreads out refreshes. (3) Background refresh: never let the cache expire — background job refreshes before expiry. (4) Stale-while-revalidate: serve stale data immediately, trigger background refresh. HTTP Cache-Control has this as a header. In production, option 3 (background refresh) is most common for predictably expensive computations.',
              },
            ],
          },
          {
            id: 'cap', title: 'CAP Theorem & Consistency', emoji: '⚖️', difficulty: 'Intermediate', tag: 'Core',
            diagramId: 'cap',
            keyPoints: [
              'CAP: in a distributed system, you can only guarantee 2 of 3: Consistency, Availability, Partition Tolerance',
              'P (Partition Tolerance) is always required in distributed systems — network splits happen',
              'CP systems (ZooKeeper, HBase): return error on partition rather than stale data',
              'AP systems (Cassandra, DynamoDB): always respond, may return stale data',
              'PACELC extends CAP: even without partition, choose between latency and consistency',
            ],
            practice: [
              {
                q: 'You\'re designing a bank transfer system. Which side of CAP do you choose and why?',
                h: 'Think about what "stale data" means in a financial context.',
                a: 'Choose CP (Consistency over Availability). A bank cannot show an account balance that is stale — if you have $100 and make two simultaneous withdrawals, the system must prevent both from succeeding (overdraft). This requires strong consistency: all nodes must agree on the current balance before any transaction proceeds. Implementation: Two-phase locking or serializable isolation in PostgreSQL. If network partition: system returns an error ("service temporarily unavailable") rather than allowing potentially inconsistent transactions. The business cost of inconsistency (double-spend, fraud) is much higher than the cost of brief unavailability. Compare: a social media "likes" counter can tolerate AP — seeing 9,999 likes when the real count is 10,000 is acceptable.',
              },
              {
                q: 'What is eventual consistency and when is it acceptable?',
                h: 'Give a concrete example of where stale data is fine.',
                a: 'Eventual consistency: given enough time without new updates, all replicas will converge to the same value. Stale reads are possible in the interim. Acceptable when: (1) Social media likes/view counts — showing 9,999 instead of 10,000 likes is fine. (2) Product recommendation updates — if new recommendations take 5 seconds to propagate, users won\'t notice. (3) User profile updates — if "updated 30 seconds ago" still shows old name briefly, acceptable. (4) Shopping cart in non-checkout phase. NOT acceptable for: bank balances, inventory reservations (can\'t oversell), authentication tokens (security-critical). Cassandra, DynamoDB are AP systems — they can be tuned with quorum reads (QUORUM consistency level) to be "more consistent" at cost of latency.',
              },
            ],
          },
          {
            id: 'hashing', title: 'Consistent Hashing', emoji: '🔄', difficulty: 'Intermediate', tag: 'Component',
            diagramId: 'hashing',
            keyPoints: [
              'Consistent hashing minimizes key remapping when servers are added/removed — only N/S keys move',
              'Virtual nodes (vnodes): each server maps to 100–150 positions on the ring — even distribution',
              'Used by Cassandra, DynamoDB, Riak for partitioning data across nodes',
              'Simple modulo hashing: (key % N) fails badly when N changes — all keys remapped',
              'Ring: 0–360° or 0–2³² — servers and keys hashed to positions, key → nearest server clockwise',
            ],
            practice: [
              {
                q: 'You have 4 Redis cache servers. You use server = hash(key) % 4. You add a 5th server. What happens?',
                h: 'Calculate what fraction of keys move.',
                a: 'With modulo hashing, adding server 5 changes the formula to hash(key) % 5. For almost every key, (hash % 4) ≠ (hash % 5), so ~80% of all keys now map to a different server. This means a massive cache miss storm: all those misses hit the database simultaneously. This is the thundering herd from cache scaling. Consistent hashing solution: only keys between the new server and its predecessor on the ring move — approximately N/S keys total where N = total keys and S = servers. Adding server 5 to a 4-server ring: only 20% of keys move. The other 80% stay on the same server, cache stays warm.',
              },
            ],
          },
        ],
      },
      {
        week: 3, weekTitle: 'Message Queues & Microservices',
        topics: [
          {
            id: 'kafka', title: 'Kafka & Event Streaming', emoji: '📨', difficulty: 'Intermediate', tag: 'Component',
            diagramId: 'kafka',
            keyPoints: [
              'Kafka topics are partitioned and replicated — each partition is an ordered, immutable log',
              'Consumer groups: each partition consumed by one consumer in the group — parallel processing',
              'Retention: messages kept for 7 days (configurable) — consumers can replay from any offset',
              'At-least-once delivery by default — idempotent consumers required to handle duplicates',
              'Kafka vs SQS: Kafka = durable event log (replayable). SQS = ephemeral queue (messages deleted on consume)',
            ],
            practice: [
              {
                q: 'When would you use Kafka instead of a simple database queue table?',
                h: 'Think about throughput, replayability, and consumer patterns.',
                a: 'Use Kafka when: (1) Multiple consumers need to read the same events independently — DB queue is consumed once and deleted. (2) Replay: need to reprocess events (bug fix replay, new consumer joining). DB queue deletes after consume. (3) High throughput: 1M+ events/sec — Kafka handles millions per second. DB polling at scale causes hot spots. (4) Decoupling: producers and consumers evolve independently. (5) Event sourcing: Kafka as the system of record for events. Use DB queue table when: simple use case, low volume (<1K/sec), need exactly-once without idempotency logic, team is unfamiliar with Kafka operational complexity.',
              },
              {
                q: 'A consumer processes a message, crashes, and restarts. How does Kafka ensure the message isn\'t lost or duplicated?',
                h: 'Think about offset commits and at-least-once delivery.',
                a: 'Kafka tracks consumer progress via offsets. At-least-once delivery: (1) Consumer reads message at offset 42. (2) Consumer processes message (writes to DB, sends email, etc.). (3) Consumer commits offset 42 to Kafka. (4) If crash BEFORE step 3: consumer restarts, reads offset 42 again → processes twice. This is at-least-once delivery. Fix: idempotent consumers. Include message_id or offset in the operation. Example: INSERT INTO orders ... ON CONFLICT (message_id) DO NOTHING — duplicate is a no-op. Or check: "have I processed offset 42?" using Redis. Exactly-once semantics: Kafka transactions (enable.idempotence=true, transactional.id) — more complex, used when duplicates are truly unacceptable (payment processing).',
              },
            ],
          },
          {
            id: 'microservices', title: 'Microservices & API Design', emoji: '🔌', difficulty: 'Intermediate', tag: 'Core',
            keyPoints: [
              'Microservices: each service owns its data, deployed independently — loose coupling, high cohesion',
              'Service communication: REST (synchronous), gRPC (synchronous, typed), Kafka (async, decoupled)',
              'API Gateway: single entry point, handles auth, rate limiting, routing, SSL termination',
              'Circuit breaker: fail fast when downstream is down — prevents cascade failures',
              'Service discovery: services find each other dynamically (Consul, Kubernetes DNS) — no hardcoded IPs',
            ],
            practice: [
              {
                q: 'Order Service needs to notify Inventory Service when an order is placed. Use synchronous REST vs async Kafka. Pros and cons?',
                h: 'Think about what happens when Inventory Service is down.',
                a: 'REST (synchronous): Order Service calls POST /inventory/reserve. Pros: immediate confirmation, simple. Cons: if Inventory Service is down, order fails. Tight coupling — if Inventory Service is slow, Order Service is slow. Kafka (async): Order Service publishes order_placed event to Kafka. Inventory Service consumes and processes. Pros: Order Service succeeds even if Inventory Service is down (Kafka buffers). Services evolve independently. Can add more consumers (Analytics, Email) without changing Order Service. Cons: eventual consistency — inventory might not be reserved immediately. Harder to debug. In practice: use async for non-blocking operations (send email, update analytics). Use sync when you need immediate acknowledgment (reserve seat before confirming purchase).',
              },
            ],
          },
          {
            id: 'resilience', title: 'Resilience & Fault Tolerance', emoji: '🛡️', difficulty: 'Intermediate', tag: 'Component',
            keyPoints: [
              'Circuit breaker: closed → open after N failures — stops calling failing service, returns error fast',
              'Retry with exponential backoff + jitter: avoid thundering herd on recovery',
              'Bulkhead pattern: isolate failure domains — thread pool per downstream, prevent cascade',
              'Timeout: always set timeouts — hanging connections exhaust thread pools',
              'Graceful degradation: serve partial/cached response when dependency is down',
            ],
            practice: [
              {
                q: 'Why is "retry with jitter" better than "retry with fixed backoff"?',
                h: 'Think about what happens when 1000 services all retry at the exact same time.',
                a: 'Fixed backoff (retry after exactly 2s, 4s, 8s): if 1000 services all hit the same downstream failure at time T, they all retry at T+2s simultaneously — the "thundering herd." This can overwhelm the recovering service and cause it to fail again. Jitter adds randomness: wait 2s ± random(0, 2s). Retries spread out over a 4-second window instead of all hitting at once. Full jitter: sleep = random(0, min(cap, base * 2^attempt)). Decorrelated jitter (AWS recommended): sleep = random(base, sleep_prev * 3). In production, always add jitter to any scheduled/periodic operations too (cron jobs, cache refreshes).',
              },
              {
                q: 'Your service has a 99.9% uptime SLO. How many minutes of downtime does that allow per year? Per month?',
                h: 'Calculate this — it comes up in system design interviews.',
                a: '99.9% (three nines): 0.1% downtime. Year: 365 × 24 × 60 × 0.001 = 525.6 min ≈ 8.76 hours/year. Month: 30 × 24 × 60 × 0.001 = 43.2 min/month. 99.99% (four nines): Year: 52.6 min. Month: 4.3 min. 99.999% (five nines): Year: 5.26 min. Month: 26 seconds. Practical implication: with 99.9% SLO, you can have one 8-hour outage per year OR roughly one 40-minute outage per month. Five nines requires zero-downtime deployments, multi-region active-active, automated failover. Most SaaS products target 99.9% (three nines).',
              },
            ],
          },
          {
            id: 'observability', title: 'Observability Stack', emoji: '📊', difficulty: 'Intermediate', tag: 'Component',
            keyPoints: [
              'Three pillars: Metrics (Prometheus), Logs (ELK/Loki), Traces (Jaeger/Zipkin)',
              'Metrics: numeric, time-series, aggregatable — latency histograms, error rates, throughput',
              'Distributed traces: follow a single request across multiple services — find where latency lives',
              'Structured logs: JSON-formatted with trace_id, user_id fields — machine-searchable',
              'RED method: Rate (req/sec), Errors (error rate), Duration (latency) — the three key metrics for every service',
            ],
            practice: [
              {
                q: 'A user reports "checkout is slow sometimes." You have metrics, logs, and traces. What\'s your debugging process?',
                h: 'Start broad, drill down. Use each observability pillar for what it\'s best at.',
                a: 'Step 1 — Metrics (Prometheus/Grafana): Look at checkout service P95/P99 latency over time. Check error rate. Correlate with timestamps of user complaints. Identify if it\'s constant or intermittent. Step 2 — Traces (Jaeger): Filter for slow traces (P99). Trace shows span breakdown: gateway 5ms, checkout 890ms, payment 2ms. Checkout span is the bottleneck. Drill into checkout: DB query spans show one query taking 870ms. Step 3 — Logs: Filter logs with the slow trace_id. Find the SQL query. Check slow query log in DB. Result: Missing index on cart_items.user_id. Fix: add index. This is why all three pillars are needed — metrics find it, traces locate it, logs explain it.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    phase: 3, phaseTitle: 'Real-World Systems', phaseColor: C.orange, phaseEmoji: '🏛️',
    weeks: [
      {
        week: 5, weekTitle: 'Classic Systems',
        topics: [
          {
            id: 'urlshortener', title: 'Design URL Shortener (Bitly)', emoji: '🔗', difficulty: 'Intermediate', tag: 'System',
            diagramId: 'urlshortener',
            keyPoints: [
              'Read:write ratio = 1000:1 — heavy read optimization with aggressive caching',
              'Base62 encoding (a-z, A-Z, 0-9): 7 chars = 62^7 = 3.5 trillion unique URLs',
              'Use Redis atomic counter for ID generation — no collision, no coordination needed',
              '301 (permanent) redirect: browser caches it = fewer requests. 302: browser always checks = accurate analytics',
              'Scale estimate: 500M new URLs/month = ~200 writes/sec, 20K reads/sec',
            ],
            practice: [
              {
                q: 'Walk through the complete flow of shortening a URL using the Hello Interview framework.',
                h: 'Requirements → Estimation → API → DB → Architecture → Deep Dive → Tradeoffs',
                a: 'Requirements: Shorten URL, redirect on access, analytics (optional). Non-functional: 100M DAU, <10ms redirect latency, 99.99% availability. | Estimation: 100M DAU × 1 shortening/day = 1,160/sec writes. 1,000:1 read ratio = 1.16M reads/sec. Storage: 500 bytes × 1,160/sec × 10 years = 180GB. | API: POST /shorten {url} → {shortCode}. GET /{code} → 301 redirect. | DB: KV store (DynamoDB) — shortCode → longURL, createdAt, userId. | Architecture: Client → LB → Read Service (Redis → DynamoDB) → 301. Write Service → Redis INCR → Base62 → DynamoDB + warm cache. | Deep Dive: Base62 counter in Redis (atomic INCR). Collision-free. | Tradeoffs: 301 (cacheable, fewer requests) vs 302 (analytics, server sees every click).',
              },
              {
                q: 'How do you handle custom aliases (e.g., bit.ly/my-brand)? What are the failure modes?',
                h: 'Think about uniqueness guarantees and race conditions.',
                a: 'Implementation: (1) Check if custom alias exists in DB. (2) If not, store with custom alias as the key. (3) Return custom URL. Race condition: two users try to register same alias simultaneously. Fix: use DB unique constraint on shortCode + catch constraint violation → return 409 Conflict. Or Redis SETNX (set if not exists) — atomic. Failure modes: alias already taken by another user (return error), alias taken by old expired URL (add TTL, delete expired entries), profanity/trademark squatting (add blocklist filter), alias guessing attacks (rate limit custom alias creation).',
              },
            ],
          },
          {
            id: 'twitter', title: 'Design Twitter/X Feed', emoji: '🐦', difficulty: 'Advanced', tag: 'System',
            diagramId: 'twitter',
            keyPoints: [
              'Fan-out on write: push tweet to all followers\' Redis timelines immediately — fast reads, slow writes',
              'Fan-out on read: merge timelines at query time — slow reads, instant writes',
              'Hybrid: fan-out on write for users < 1M followers, on-read for celebrities',
              'Tweet storage: Cassandra (write-heavy, wide rows by user_id + timestamp)',
              'Home timeline: sorted list of tweet IDs in Redis — fetched in batches',
            ],
            practice: [
              {
                q: 'Katy Perry has 150M followers. She posts a tweet. What happens in your system?',
                h: 'Apply the hybrid fan-out strategy.',
                a: 'Celebrity threshold: > 1M followers → NO fan-out on write. (1) Tweet is written to Cassandra tweets table with Perry\'s user_id. (2) Kafka event published: tweet_id, author_id, timestamp. (3) NO fan-out workers for Perry. When any of her 150M followers loads their timeline: (4) Read Service checks if they follow any celebrity accounts. (5) For each celebrity, fetch latest N tweets from Cassandra. (6) Merge celebrity tweets with pre-built timeline from Redis. (7) Sort merged result by timestamp, return top 20.',
              },
            ],
          },
          {
            id: 'youtube', title: 'Design YouTube', emoji: '▶️', difficulty: 'Advanced', tag: 'System',
            keyPoints: [
              'Upload pipeline: raw video → queue → transcoder workers → multiple bitrates (360p/720p/1080p/4K)',
              'Adaptive bitrate (ABR): HLS/DASH serves different quality segments based on bandwidth',
              'Video stored in S3, metadata in MySQL, recommendations in Bigtable/Cassandra',
              'View count: Redis INCR for real-time, batch flush to DB every 60 seconds',
              'CDN (Open Connect): YouTube\'s proprietary CDN, serves 80%+ of traffic from ISP peering points',
            ],
            practice: [
              {
                q: 'Walk through the complete video upload and processing pipeline for a 1GB video.',
                h: 'Think about the pipeline from user\'s browser to final viewable video.',
                a: '(1) Browser → API Server: initiate multipart upload, get pre-signed S3 URLs for chunks. (2) Browser → S3 directly: upload 5MB chunks in parallel, get ETags. (3) Complete multipart: assemble in S3, raw video stored. (4) S3 event → Lambda/SNS → transcode job added to Kafka. (5) Transcoder workers (GPU instances) consume from Kafka: run FFmpeg to produce 360p, 720p, 1080p, 4K variants. Store all to S3. (6) On completion: update video metadata in MySQL (status=READY, urls), invalidate any CDN cache, send notification to uploader. (7) Thumbnail extraction: separate worker extracts N frames, stores to S3. Total pipeline: 10-30 minutes for 1 hour video at 4K.',
              },
            ],
          },
          {
            id: 'whatsapp', title: 'Design WhatsApp', emoji: '💬', difficulty: 'Advanced', tag: 'System',
            keyPoints: [
              'WebSockets for real-time bidirectional messaging — persistent connection per client',
              'Message delivery states: sent ✓, delivered ✓✓, read ✓✓ (blue) — three distinct DB writes',
              'Cassandra for message storage: partition by chat_id, cluster by message_id (Snowflake)',
              'End-to-end encryption: messages encrypted client-side, server stores only ciphertext',
              'Presence indicators: Redis TTL-based, set TTL on heartbeat, expire = offline',
            ],
            practice: [
              {
                q: 'How does WhatsApp ensure a message is delivered even when the recipient is offline?',
                h: 'Think about message queue vs push notification.',
                a: '(1) Sender → WebSocket → Message Service → write to Cassandra (persistent store). (2) Message Service checks recipient presence in Redis. (3) If OFFLINE: send push notification (APNs/FCM) to wake the device. Store message in Cassandra with status=PENDING. (4) When recipient device comes online: opens WebSocket, fetches pending messages from Cassandra. Sends delivery ACK. (5) Message Service updates status → DELIVERED, notifies sender (single tick → double tick). (6) Recipient reads: sends read receipt. Status → READ.',
              },
            ],
          },
        ],
      },
      {
        week: 6, weekTitle: 'Advanced Real Systems',
        topics: [
          {
            id: 'uber', title: 'Design Uber Ride Matching', emoji: '🚗', difficulty: 'Advanced', tag: 'System',
            diagramId: 'uber',
            keyPoints: [
              'Geohash encodes lat/lng into a string prefix — nearby locations share prefix',
              'Redis GEOADD/GEORADIUS: O(N+log M) queries for nearby drivers within radius',
              'Driver location updates: 10M drivers × 1 update/4s = 2.5M writes/sec — Redis cluster',
              'Matching algorithm: find N nearest available drivers, rank by ETA (Google Maps API)',
              'Surge pricing: real-time demand/supply ratio per geohash cell — computed every 60s',
            ],
            practice: [
              {
                q: 'Design the driver location tracking system to handle 10M concurrent drivers updating every 4 seconds.',
                h: 'That\'s 2.5M writes/sec. Think about your data structure choice.',
                a: 'Redis Cluster with GEOADD: Each driver update: GEOADD drivers {longitude} {latitude} {driver_id}. Sorted set backed by 52-bit geohash. 10M drivers × 100 bytes = 1GB per Redis node — manageable. 2.5M writes/sec: shard drivers by city/region across Redis cluster (50 nodes = 50K writes/sec each). Stale data: if driver doesn\'t update for 30s, mark offline (heartbeat TTL). Separate clusters per region (US, EU, Asia). Driver update flow: Driver app → WebSocket connection → Location Service → Redis GEOADD (batch by 4s). Kafka publishes location events for analytics and surge price computation.',
              },
            ],
          },
          {
            id: 'ticketmaster', title: 'Design Ticketmaster', emoji: '🎫', difficulty: 'Advanced', tag: 'System',
            keyPoints: [
              'Flash sale problem: millions try to buy same seats simultaneously — race condition at DB',
              'Distributed lock: Redis SETNX with TTL — hold seat for 10 minutes, expire if unpaid',
              'Virtual queue: place users in queue, process in order — prevents thundering herd on DB',
              'Inventory service: stores seat status (available, held, sold), needs strong consistency',
              'Idempotency: payment retry must not double-charge — unique payment_id per attempt',
            ],
            practice: [
              {
                q: 'Taylor Swift tour goes on sale. 5M users click \'Buy\' at the exact same moment. Design the seat reservation system.',
                h: 'This is the core concurrency problem. How do you prevent overselling?',
                a: 'Virtual queue: (1) When sale opens, all 5M users enter a virtual queue (Redis ZADD with timestamp). (2) Process N users per second (e.g., 10K/sec). Each user gets their turn. (3) User\'s turn: Lock seats using Redis SETNX {seat_id} {user_id} EX 600 (10-min TTL). (4) If lock acquired: show seat to user, start 10-min payment timer. (5) On payment complete: write SOLD to DB, delete Redis lock, emit event. (6) If TTL expires: release lock, seat goes back to available pool.',
              },
            ],
          },
          {
            id: 'googlemaps', title: 'Design Google Maps', emoji: '🗺️', difficulty: 'Advanced', tag: 'System',
            keyPoints: [
              'Map tiles: world split into zoom-level tiles (z/x/y), stored in object storage, served via CDN',
              'Routing: A* or Dijkstra on road graph stored in specialized graph DB',
              'ETA: ML model using historical traffic patterns + real-time Waze-like crowdsourcing',
              'Geocoding: address → lat/lng using spatial index (PostGIS, Elasticsearch geo queries)',
              'Real-time traffic: GPS data from millions of devices → speed data aggregated per road segment',
            ],
            practice: [
              {
                q: 'How does Google Maps handle real-time traffic data from millions of users?',
                h: 'Think about the data pipeline from phone GPS to map color.',
                a: '(1) Android/iOS phones with Maps open: GPS + speed data sent every 2-5 seconds. (2) Kafka ingests billions of GPS events/day. (3) Stream processor (Apache Flink): group events by road segment ID, compute average speed in 1-minute windows. (4) Compare to historical baseline: speed < 50% of baseline = slow traffic (red). (5) Write road segment speeds to Redis (low latency, TTL 5min). (6) Routing service reads from Redis for real-time ETA. (7) Map tiles: server-side render tiles with traffic overlay, cache at CDN.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    phase: 4, phaseTitle: 'Advanced Patterns', phaseColor: C.purple, phaseEmoji: '🚀',
    weeks: [
      {
        week: 7, weekTitle: 'Enterprise & Advanced Scale',
        topics: [
          {
            id: 'cqrs', title: 'CQRS & Event Sourcing', emoji: '⚡', difficulty: 'Advanced', tag: 'Advanced',
            keyPoints: [
              'CQRS: separate read model (Query) from write model (Command) — each can scale independently',
              'Event sourcing: store all state changes as events, not current state — full audit log, time travel',
              'Event replay: rebuild any read model by replaying events from the beginning',
              'Projections: materialized views built from event stream — optimized for specific read patterns',
              'Eventual consistency: write side commits event, read side updated asynchronously',
            ],
            practice: [
              {
                q: 'Design an order management system using CQRS. What are the write and read models?',
                h: 'Think about what information each side needs.',
                a: 'Write model (Command side): handles OrderPlaced, OrderCancelled, PaymentProcessed commands. Validates business rules (sufficient inventory, valid payment). Emits domain events. Stores in event store or minimal state DB. Read models (Query side, multiple projections): OrderSummaryView (order_id, status, total) for order list page. OrderDetailView (full order with line items, history) for order detail page. CustomerOrderHistory (customer_id → order list) for account page. Each projection listens to events and maintains denormalized, query-optimized tables.',
              },
            ],
          },
          {
            id: 'saga', title: 'Distributed Transactions & Saga', emoji: '🔄', difficulty: 'Advanced', tag: 'Advanced',
            keyPoints: [
              'Two-phase commit (2PC): coordinator asks all participants to prepare, then commit — blocking, fragile',
              'Saga pattern: sequence of local transactions, each publishing event to trigger the next',
              'Choreography: each service listens for events and reacts — decentralized, hard to debug',
              'Orchestration: central saga orchestrator drives the flow — easier to visualize, single point of failure',
              'Compensating transactions: undo actions when a saga step fails — must be idempotent',
            ],
            practice: [
              {
                q: 'Design a saga for an e-commerce checkout: Reserve inventory → Process payment → Send confirmation email.',
                h: 'What happens if payment fails after inventory is reserved?',
                a: 'Orchestrated Saga: Saga Orchestrator maintains state machine. Step 1: Command OrderService.ReserveInventory → Success → proceed. Failure → saga FAILED. Step 2: Command PaymentService.ChargeCard → Success → proceed. Failure → send OrderService.ReleaseInventory (compensating transaction) → saga FAILED. Step 3: Command EmailService.SendConfirmation → Success → saga COMPLETE. Failure: email failure shouldn\'t cancel order — retry with exponential backoff, dead letter queue.',
              },
            ],
          },
          {
            id: 'multiregion', title: 'Multi-Region Architecture', emoji: '🌐', difficulty: 'Advanced', tag: 'Advanced',
            keyPoints: [
              'Active-active: multiple regions serve traffic simultaneously — lowest latency, complex consistency',
              'Active-passive: one region active, others on standby — simpler but higher failover latency (minutes)',
              'Cross-region replication lag: data written in US-East takes 80-150ms to appear in EU-West',
              'Conflict resolution: if same record updated in two regions simultaneously — last-write-wins or vector clocks',
              'Geo-routing: Route53/Cloudflare routes users to nearest healthy region automatically',
            ],
            practice: [
              {
                q: 'Design a globally distributed system for a B2B SaaS serving 50 countries. How do you handle GDPR?',
                h: 'GDPR requires EU data to stay in EU. How does this affect your multi-region design?',
                a: 'Region partitioning by data residency: EU customers → EU-West-1 (Ireland) only. US customers → US-East-1. APAC → AP-Southeast-1. Data sovereignty: each region has its own DB cluster. EU customer data never leaves EU region. Routing: at signup, customer is assigned to a region. JWT contains region_id. API gateway routes to correct regional cluster. Cross-region challenges: global user directory (which region for each user?) → small lookup table replicated globally (read-heavy, low write rate).',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    phase: 5, phaseTitle: 'Mock & Polish', phaseColor: C.gold, phaseEmoji: '🎯',
    weeks: [
      {
        week: 8, weekTitle: 'Interview Readiness',
        topics: [
          {
            id: 'netflix', title: 'Design Netflix', emoji: '🎬', difficulty: 'Advanced', tag: 'System',
            keyPoints: [
              'Open Connect: Netflix\'s proprietary CDN — ISP-colocated servers serving 80%+ of traffic',
              'Microservices: 700+ services, each independently deployed — used Spring Boot, now gRPC',
              'Recommendation engine: collaborative filtering on watch history, stored in Cassandra/Bigtable',
              'Chaos Engineering: Netflix Chaos Monkey randomly kills production services — validates resilience',
              'A/B testing: every UI change tested on user cohorts — thumbnail A/B tests improve CTR 20-35%',
            ],
            practice: [
              {
                q: 'Design the Netflix video delivery system to handle 200M concurrent streams globally.',
                h: 'Think about the CDN strategy and adaptive bitrate.',
                a: 'Upload pipeline: Studio → raw video → AWS S3 → transcoding cluster (AWS EC2 GPU) → 20+ quality variants (360p to 4K HDR, multiple codecs: H.264, H.265/HEVC, AV1). Each variant → Open Connect CDN. Open Connect CDN: Netflix installs servers in 1000+ ISP data centers globally. ISPs get free hardware → 95% of traffic served from within ISP → Netflix pays less bandwidth, ISP gets better network performance. For 200M concurrent streams: avg bitrate 5Mbps → 1 Petabit/sec total.',
              },
            ],
          },
          {
            id: 'framework', title: 'Interview Framework & Communication', emoji: '🎤', difficulty: 'Beginner', tag: 'Interview',
            keyPoints: [
              'Always clarify requirements before designing — 5 minutes upfront saves 30 minutes of wrong direction',
              'Back-of-envelope estimation shows you think at scale — always estimate DAU, QPS, storage',
              'Explicitly state your tradeoffs — interviewers want to hear your reasoning, not just the answer',
              'Drive the interview — propose, get buy-in, go deep — don\'t wait to be led',
              'Think aloud continuously — interviewers need to follow your reasoning',
            ],
            practice: [
              {
                q: 'The interviewer says "Design a system like Instagram." What do you do in the first 5 minutes?',
                h: 'Resist the urge to start drawing boxes immediately.',
                a: 'First 5 minutes: Clarify scope. Ask: "Should I focus on the photo feed, or also Stories, Reels, DMs?" Get answer. "What scale are we targeting — millions or billions of users?" Functional requirements: users upload photos, follow other users, see home feed of followed users\' photos, like/comment. Non-functional: 1B DAU, photo upload < 5s, feed load < 200ms, 99.99% availability. Estimation: 100M photos/day uploaded = 1,160/sec. Avg photo 3MB → 350GB/day of new photo data. Feed: 500M feed loads/day = 5,800/sec. Now start designing.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    phase: 6, phaseTitle: 'Hello Interview Specials', phaseColor: C.cyan, phaseEmoji: '🎓',
    weeks: [
      {
        week: 9, weekTitle: 'Classic HI Problems I',
        topics: [
          {
            id: 'webcrawler', title: 'Design a Web Crawler', emoji: '🕷️', difficulty: 'Intermediate', tag: 'System',
            diagramId: 'webcrawler',
            keyPoints: [
              'URL Frontier: priority queue of URLs to crawl, sorted by page rank / freshness',
              'Bloom Filter: probabilistic data structure — O(1) "have we seen this URL?" — 1% false positive rate for 1B URLs at 1.25GB',
              'Politeness: one request/second per domain — robots.txt respect — avoid overloading hosts',
              'Content deduplication: SHA-256 hash of page body — store once, re-index links',
              'DNS caching: dedicated DNS resolver cache — saves 50-200ms per domain lookup',
              'Scale: Google crawls ~20B pages/day = 230K pages/sec across distributed fetcher fleet',
            ],
            practice: [
              {
                q: 'How do you prevent crawling the same URL twice at the scale of 1 billion URLs?',
                h: 'A database lookup for every URL would be too slow. Think probabilistic.',
                a: 'Use a Bloom Filter: a bitset of ~10 billion bits (1.25GB) initialized to zero. When we see a new URL: hash it with K hash functions, set those bit positions. To check: hash URL, check if ALL those bit positions are set. If yes → probably seen (1% false positive). If any bit is 0 → definitely NOT seen. For 1B URLs at 0.1% FPR: ~15 bits/element = 1.8GB RAM — fits in memory. False positives mean we skip ~1% of unseen URLs — acceptable. After Bloom filter passes, do exact DB lookup for 100% accuracy.',
              },
            ],
          },
          {
            id: 'notification', title: 'Design Notification System', emoji: '🔔', difficulty: 'Intermediate', tag: 'System',
            diagramId: 'notification',
            keyPoints: [
              'Multi-channel: push (APNs/FCM), email (SendGrid), SMS (Twilio) — each needs separate worker',
              'Kafka topics per channel: push-topic, email-topic, sms-topic — independent scaling',
              'User preferences: opt-in/out per channel, do-not-disturb hours — checked before send',
              'Idempotency: notification_id prevents duplicate sends on retry — store in Redis with TTL',
              'Rate limiting: max N notifications per user per day — Redis counter per user',
            ],
            practice: [
              {
                q: 'How do you handle notification failures and retries?',
                h: 'Think about dead letter queues and exponential backoff.',
                a: 'Retry strategy: (1) APNs returns error code 429 (too many requests) → wait exponential backoff (1s, 2s, 4s, 8s). (2) APNs returns 410 (device token invalid) → remove token from DB permanently. (3) Max retries (e.g., 3 attempts): if all fail → move to dead letter queue (DLQ) for manual inspection. (4) DLQ worker: alert ops team, log for analysis. (5) Idempotency: include notification_id in APNs request metadata. If APNs receives same ID twice, it deduplicates. Rate limiting: Redis INCR notifications_sent:{user_id}:{date} — cap at 100/day.',
              },
            ],
          },
          {
            id: 'keyvalue', title: 'Design Key-Value Store', emoji: '🔑', difficulty: 'Advanced', tag: 'System',
            diagramId: 'keyvalue',
            keyPoints: [
              'Consistent hashing ring for key distribution across nodes — minimal remapping on scale changes',
              'Replication factor N=3: write to N nodes, read quorum R=2, write quorum W=2 (R+W>N = strong consistency)',
              'Gossip protocol: nodes share state with random peers — eventual cluster membership consistency',
              'Vector clocks for conflict resolution — track causality across concurrent writes',
              'Compaction: merge SSTables in background — reduce read amplification and space',
            ],
            practice: [
              {
                q: 'Design the GET and PUT operations with quorum reads/writes.',
                h: 'Think about what happens when one of the 3 replica nodes is down.',
                a: 'PUT(key, value): Coordinator hashes key → finds 3 nodes on ring. Sends write to all 3. Waits for W=2 acknowledgments. Returns success. Third node gets write eventually. GET(key): Coordinator sends read to 3 nodes. Waits for R=2 responses. If values differ → return latest (vector clock), trigger read repair. Node down scenario: if 1 of 3 nodes is down during PUT: (1) Write to 2 healthy nodes → quorum met (W=2) → success returned to client. (2) When downed node recovers: hinted handoff delivers the write. Availability: system works with 1 of 3 nodes down. Strong consistency guaranteed when R+W > N (2+2 > 3).',
              },
            ],
          },
        ],
      },
      {
        week: 10, weekTitle: 'Classic HI Problems II',
        topics: [
          {
            id: 'googledrive', title: 'Design Google Drive', emoji: '📁', difficulty: 'Advanced', tag: 'System',
            diagramId: 'googledrive',
            keyPoints: [
              'Block-level sync: split files into 4MB blocks, only sync changed blocks — delta sync',
              'Content-addressable storage: SHA-256(block) = block ID — dedup at block level (same PDF never stored twice)',
              'Metadata service: file tree, version history, block-to-file mapping — MySQL + Redis',
              'Conflict resolution: last-write-wins or create conflict copy (like Dropbox)',
              'Long polling for sync notifications — push delta to all connected devices',
            ],
            practice: [
              {
                q: '1M users all upload the same popular PDF (Harry Potter). How much storage does it use?',
                h: 'Think about content deduplication.',
                a: 'With content-addressable deduplication: SHA-256(Harry Potter PDF) = same hash for all 1M users. Block storage checks: does this hash exist? Yes → store reference, don\'t store duplicate. Storage used: 1 copy of the PDF (e.g., 10MB) + 1M rows in metadata table (file_id, user_id, hash → 100 bytes each = 100MB metadata). Total: ~110MB instead of 10MB × 1M = 10TB. This is why Dropbox/Drive dedup is so powerful. Each user sees their own file in their drive, but it points to the same S3 object.',
              },
            ],
          },
          {
            id: 'rateLimiter', title: 'Design Rate Limiter', emoji: '🚦', difficulty: 'Intermediate', tag: 'Component',
            keyPoints: [
              'Token bucket: bucket of N tokens, refilled at rate R — allows bursts up to N',
              'Sliding window log: log every request timestamp, count in last 60s — precise but memory heavy',
              'Sliding window counter: hybrid — approximate but memory efficient',
              'Fixed window: reset counter every minute — vulnerable to boundary spike (2x rate at window edge)',
              'Distributed rate limiting: Redis INCR with EXPIRE — atomic, shared across all servers',
            ],
            practice: [
              {
                q: 'Implement a rate limiter for an API: max 100 requests per user per minute.',
                h: 'Think about distributed state and edge cases at the minute boundary.',
                a: 'Sliding window counter in Redis: key = rate_limit:{user_id}:{minute_bucket}. On each request: MULTI / INCR rate_limit:{user_id}:{current_minute} / EXPIRE rate_limit:{user_id}:{current_minute} 120 / EXEC. Get count. If count > 100: return 429 Too Many Requests with Retry-After header. Two-bucket approach for sliding window: weight = (60 - seconds_elapsed_in_current_minute) / 60 × prev_minute_count + current_minute_count. This approximates a true sliding window. Redis atomic INCR + EXPIRE: ensures no race conditions across distributed servers.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    phase: 7, phaseTitle: 'Capstone & Leadership', phaseColor: C.gold, phaseEmoji: '👑',
    weeks: [
      {
        week: 12, weekTitle: 'Staff-Level Thinking',
        topics: [
          {
            id: 'datamodeling', title: 'Data Modeling at Scale', emoji: '🧬', difficulty: 'Advanced', tag: 'Advanced',
            keyPoints: [
              'Denormalization: trade storage for read performance — copy data into multiple tables to avoid joins',
              'Entity-Attribute-Value (EAV): flexible schema, but terrible query performance at scale — avoid',
              'Time-series data: partition by time, compress old data, TTL old buckets — InfluxDB/TimescaleDB',
              'Soft deletes: deleted_at timestamp instead of DELETE — audit trail, undo functionality, GDPR challenge',
              'Polyglot persistence: use the right DB for each access pattern — not one DB for everything',
            ],
            practice: [
              {
                q: 'You\'re designing the data model for a multi-tenant SaaS (like Salesforce). How do you handle tenant data isolation at scale?',
                h: 'Think about the three approaches: separate DB, separate schema, shared table.',
                a: 'Three strategies: (1) Separate DB per tenant: highest isolation, easy backups per tenant, but expensive ($50+/month per DB × 10K tenants = $500K/month). Use for enterprise customers who pay for it. (2) Separate schema per tenant: one DB, each tenant has own schema/table set. Good isolation, moderate cost, schema migration affects all tenants separately — slow. (3) Shared tables with tenant_id: all tenants in same tables, tenant_id on every row, row-level security in DB. Cheapest, hardest isolation. Risk: row-level security bug = data leak. PostgreSQL RLS can enforce this. Hybrid (Salesforce approach): small tenants → shared tables. Enterprise tenants → dedicated pods.',
              },
            ],
          },
          {
            id: 'systemdesignreview', title: 'Full System Design Walkthrough', emoji: '🏆', difficulty: 'Advanced', tag: 'Interview',
            keyPoints: [
              'Requirements: functional (what it does) + non-functional (scale, latency, availability)',
              'Estimation: QPS = DAU × actions/day ÷ 86400 — storage = rows × bytes/row × retention',
              'High-level design: 3-5 boxes: client, load balancer, service, DB, cache — get buy-in first',
              'Deep dive: pick the hardest component and go deep — don\'t spread thin across all components',
              'Tradeoffs: always present 2 options, state your recommendation, explain why',
            ],
            practice: [
              {
                q: 'Design Instagram in 45 minutes. Go through the complete Hello Interview framework.',
                h: 'Requirements (5min) → Estimation (5min) → API (5min) → DB (5min) → Architecture (15min) → Deep Dive (10min)',
                a: 'REQUIREMENTS (5min): Functional: upload photos, follow users, see home feed, like/comment, explore page. Non-functional: 1B DAU, photo upload <5s, feed load <200ms, 99.99% availability, eventual consistency OK for feed. | ESTIMATION: 100M photos/day = 1,160/sec writes. Avg photo: 3MB → 350GB/day. Feed: 500M feed views/day = 5,800/sec reads. Read:Write = 5:1. | API: POST /photos (multipart upload). GET /feed/{user_id}?page=1. POST /likes/{photo_id}. | DB: Users (MySQL), Photos metadata (MySQL: id, user_id, s3_url, created_at), Feed (Redis timeline per user), Likes (Cassandra: photo_id → set of user_ids), Media (S3). | ARCHITECTURE: Client → CDN for static. Client → LB → Upload Service → S3 + MySQL. Fan-out Service (Kafka consumer) → Redis timelines. Feed Service → Redis first, fallback MySQL.',
              },
            ],
          },
        ],
      },
    ],
  },
];

export function getAllTopics() {
  const topics: Array<Phase['weeks'][0]['topics'][0] & {
    phaseTitle: string;
    phaseColor: string;
    weekTitle: string;
  }> = [];
  CURRICULUM.forEach(p =>
    p.weeks.forEach(w =>
      w.topics.forEach(t =>
        topics.push({ ...t, phaseTitle: p.phaseTitle, phaseColor: p.phaseColor, weekTitle: w.weekTitle })
      )
    )
  );
  return topics;
}

export function getTopicById(id: string) {
  return getAllTopics().find(t => t.id === id);
}
