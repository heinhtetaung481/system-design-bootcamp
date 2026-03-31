'use client';

const C = {
  bg: '#050A14', panel: '#0B1628', card: '#0F1E35', border: '#1A2D4A',
  borderH: '#2D4E80', text: '#E8F0FF', muted: '#8A9EC0', dim: '#4A6080',
  blue: '#4F9DFF', blueD: '#1E3F7A', green: '#00D68F', orange: '#FF8C42',
  purple: '#9B7FFF', red: '#FF5470', cyan: '#00D4FF', gold: '#FFB830',
  white: '#FFFFFF',
};

const Box = ({ x, y, w = 120, h = 36, fill = C.card, stroke = C.border, children, rx = 8 }: {
  x: number; y: number; w?: number; h?: number; fill?: string; stroke?: string; children?: React.ReactNode; rx?: number;
}) => (
  <g><rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={1.5} rx={rx} />{children}</g>
);

const Label = ({ x, y, children, size = 11, color = C.text, bold = false }: {
  x: number; y: number; children: React.ReactNode; size?: number; color?: string; bold?: boolean;
}) => (
  <text x={x} y={y} fill={color} fontSize={size} fontWeight={bold ? '700' : '400'}
    fontFamily="'Manrope',sans-serif" textAnchor="middle" dominantBaseline="middle">
    {children}
  </text>
);

const Arrow = ({ x1, y1, x2, y2, color = C.dim, dashed = false }: {
  x1: number; y1: number; x2: number; y2: number; color?: string; dashed?: boolean;
}) => {
  const id = `a${x1}${y1}${x2}${y2}`;
  return (
    <g>
      <defs><marker id={id} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill={color} />
      </marker></defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.5}
        strokeDasharray={dashed ? '5,4' : 'none'} markerEnd={`url(#${id})`} />
    </g>
  );
};

const MiniLabel = ({ x, y, children, color = C.muted }: {
  x: number; y: number; children: React.ReactNode; color?: string;
}) => (
  <text x={x} y={y} fill={color} fontSize={9} fontFamily="'DM Mono',monospace" textAnchor="middle">{children}</text>
);

export const NetworkingDiagram = () => (
  <svg viewBox="0 0 700 300" style={{ width: '100%', background: C.bg, borderRadius: 12, padding: 16 }}>
    <text x="350" y="24" fill={C.blue} fontSize={13} fontWeight="700" textAnchor="middle" fontFamily="Manrope">HTTP Request Lifecycle</text>
    <Box x={20} y={100} w={80} h={40} fill="#0F1E35" stroke={C.blue}>
      <Label x={60} y={120} color={C.blue} bold>Client</Label>
    </Box>
    <Box x={140} y={60} w={80} h={40} fill="#0F1E35" stroke={C.gold}>
      <Label x={180} y={80} color={C.gold} bold>DNS</Label>
    </Box>
    <MiniLabel x={110} y={72} color={C.gold}>resolve</MiniLabel>
    <Box x={140} y={140} w={80} h={40} fill="#0F1E35" stroke={C.cyan}>
      <Label x={180} y={160} color={C.cyan} bold>CDN</Label>
    </Box>
    <MiniLabel x={108} y={158} color={C.cyan}>static</MiniLabel>
    <Box x={280} y={100} w={100} h={40} fill="#0F1E35" stroke={C.purple}>
      <Label x={330} y={120} color={C.purple} bold size={10}>Load Balancer</Label>
    </Box>
    {[60, 100, 140].map((y, i) => (
      <g key={i}>
        <Box x={440} y={y} w={90} h={32} fill="#0F1E35" stroke={C.green}>
          <Label x={485} y={y + 16} color={C.green} size={10} bold>Server {i + 1}</Label>
        </Box>
        <Arrow x1={380} y1={120} x2={440} y2={y + 16} color={C.purple} />
      </g>
    ))}
    <Box x={590} y={94} w={90} h={40} fill="#0F1E35" stroke={C.orange}>
      <Label x={635} y={114} color={C.orange} bold size={10}>Database</Label>
    </Box>
    <Box x={590} y={150} w={90} h={36} fill="#0F1E35" stroke={C.red}>
      <Label x={635} y={168} color={C.red} bold size={10}>Cache (Redis)</Label>
    </Box>
    <Arrow x1={100} y1={115} x2={140} y2={80} color={C.gold} />
    <Arrow x1={100} y1={125} x2={140} y2={155} color={C.cyan} />
    <Arrow x1={220} y1={160} x2={280} y2={120} color={C.cyan} dashed />
    <Arrow x1={220} y1={80} x2={280} y2={110} color={C.gold} dashed />
    <Arrow x1={530} y1={96} x2={590} y2={110} color={C.green} />
    <Arrow x1={530} y1={130} x2={590} y2={162} color={C.green} />
    <rect x={270} y={58} width={120} height={26} fill="#0B1628" stroke={C.border} rx={4} />
    <text x={330} y={71} fill={C.muted} fontSize={9} textAnchor="middle" fontFamily="DM Mono">HTTP/HTTPS · TCP · WebSocket</text>
  </svg>
);

export const ScalingDiagram = () => (
  <svg viewBox="0 0 700 320" style={{ width: '100%', background: C.bg, borderRadius: 12, padding: 16 }}>
    <text x="350" y="24" fill={C.blue} fontSize={13} fontWeight="700" textAnchor="middle" fontFamily="Manrope">Horizontal vs Vertical Scaling</text>
    <text x="175" y="52" fill={C.gold} fontSize={11} fontWeight="600" textAnchor="middle" fontFamily="Manrope">VERTICAL SCALING</text>
    <text x="175" y="66" fill={C.muted} fontSize={9} textAnchor="middle" fontFamily="DM Mono">Scale Up (bigger machine)</text>
    {[{ h: 60, c: C.dim, l: '4 CPU · 8GB' }, { h: 90, c: C.orange, l: '16 CPU · 64GB' }].map(({ h, c, l }, i) => (
      <g key={i}>
        <rect x={105 + i * 15} y={78 + i * 10} width={140 - i * 30} height={h} fill={C.card} stroke={c} strokeWidth={1.5} rx={8} />
        <Label x={175} y={78 + i * 10 + h / 2} color={c} size={10} bold>{i === 0 ? 'Before' : ' After'}</Label>
        <Label x={175} y={78 + i * 10 + h / 2 + 14} color={C.muted} size={9}>{l}</Label>
      </g>
    ))}
    <Arrow x1={175} y1={148} x2={175} y2={165} color={C.orange} />
    <text x={175} y={230} fill={C.red} fontSize={9} textAnchor="middle" fontFamily="DM Mono">⚠ Single point of failure</text>
    <line x1="350" y1="45" x2="350" y2="280" stroke={C.border} strokeDasharray="4,4" />
    <text x="525" y="52" fill={C.green} fontSize={11} fontWeight="600" textAnchor="middle" fontFamily="Manrope">HORIZONTAL SCALING</text>
    <text x="525" y="66" fill={C.muted} fontSize={9} textAnchor="middle" fontFamily="DM Mono">Scale Out (more machines)</text>
    <Box x={465} y={76} w={120} h={36} fill={C.card} stroke={C.purple}>
      <Label x={525} y={94} color={C.purple} bold size={10}>Load Balancer</Label>
    </Box>
    {[[380, 140], [465, 140], [550, 140], [465, 195]].map(([x, y], i) => (
      <g key={i}>
        <Box x={x} y={y} w={80} h={32} fill={C.card} stroke={C.green}>
          <Label x={x + 40} y={y + 16} color={C.green} size={9} bold>Server {i + 1}</Label>
        </Box>
        <Arrow x1={525} y1={112} x2={x + 40} y2={y} color={C.purple} />
      </g>
    ))}
    <text x={525} y={248} fill={C.green} fontSize={9} textAnchor="middle" fontFamily="DM Mono">✓ High availability + fault tolerance</text>
  </svg>
);

export const DatabaseDiagram = () => (
  <svg viewBox="0 0 700 320" style={{ width: '100%', background: C.bg, borderRadius: 12, padding: 16 }}>
    <text x="350" y="24" fill={C.blue} fontSize={13} fontWeight="700" textAnchor="middle" fontFamily="Manrope">Database Replication & Sharding</text>
    <text x="175" y="50" fill={C.gold} fontSize={11} fontWeight="600" textAnchor="middle" fontFamily="Manrope">REPLICATION</text>
    <Box x={115} y={62} w={120} h={40} fill={C.card} stroke={C.blue}>
      <Label x={175} y={78} color={C.blue} bold size={10}>Primary (Write)</Label>
      <Label x={175} y={92} color={C.muted} size={9}>all writes here</Label>
    </Box>
    {[[85, 130], [165, 130], [85, 185], [165, 185]].map(([x, y], i) => (
      <g key={i}>
        <Box x={x} y={y} w={100} h={36} fill={C.card} stroke={C.green}>
          <Label x={x + 50} y={y + 14} color={C.green} size={9} bold>Replica {i + 1}</Label>
          <Label x={x + 50} y={y + 26} color={C.muted} size={8}>read-only</Label>
        </Box>
        <Arrow x1={175} y1={102} x2={x + 50} y2={y} color={C.green} dashed />
      </g>
    ))}
    <line x1="350" y1="45" x2="350" y2="290" stroke={C.border} strokeDasharray="4,4" />
    <text x="525" y="50" fill={C.orange} fontSize={11} fontWeight="600" textAnchor="middle" fontFamily="Manrope">SHARDING (Horizontal Partition)</text>
    <Box x={465} y={60} w={120} h={36} fill={C.card} stroke={C.purple}>
      <Label x={525} y={78} color={C.purple} bold size={10}>Shard Router</Label>
    </Box>
    {[[380, 120], [465, 120], [550, 120]].map(([x, y], i) => (
      <g key={i}>
        <Box x={x} y={y} w={80} h={50} fill={C.card} stroke={C.orange}>
          <Label x={x + 40} y={y + 16} color={C.orange} size={9} bold>Shard {i + 1}</Label>
          <Label x={x + 40} y={y + 30} color={C.muted} size={8}>{['user_id 0-33', 'user_id 34-66', 'user_id 67-99'][i]}</Label>
        </Box>
        <Arrow x1={525} y1={96} x2={x + 40} y2={y} color={C.purple} />
      </g>
    ))}
    <text x={525} y={255} fill={C.red} fontSize={9} textAnchor="middle" fontFamily="DM Mono">⚠ Cross-shard queries are expensive</text>
    <text x={525} y={267} fill={C.green} fontSize={9} textAnchor="middle" fontFamily="DM Mono">✓ Write throughput scales linearly</text>
  </svg>
);

export const CachingDiagram = () => (
  <svg viewBox="0 0 700 300" style={{ width: '100%', background: C.bg, borderRadius: 12, padding: 16 }}>
    <text x="350" y="24" fill={C.blue} fontSize={13} fontWeight="700" textAnchor="middle" fontFamily="Manrope">Cache-Aside Pattern (Lazy Loading)</text>
    <Box x={20} y={120} w={90} h={40} fill={C.card} stroke={C.blue}>
      <Label x={65} y={140} color={C.blue} bold>App</Label>
    </Box>
    <Box x={190} y={70} w={110} h={40} fill={C.card} stroke={C.green}>
      <Label x={245} y={84} color={C.green} bold>Redis Cache</Label>
      <Label x={245} y={98} color={C.muted} size={9}>TTL-based</Label>
    </Box>
    <Box x={190} y={180} w={110} h={40} fill={C.card} stroke={C.orange}>
      <Label x={245} y={194} color={C.orange} bold>Database</Label>
      <Label x={245} y={208} color={C.muted} size={9}>source of truth</Label>
    </Box>
    <Box x={370} y={100} w={110} h={28} fill="#0B1628" stroke={C.green}>
      <Label x={425} y={114} color={C.green} size={9}>2. Check cache</Label>
    </Box>
    <Box x={370} y={140} w={110} h={28} fill="#0B1628" stroke={C.orange}>
      <Label x={425} y={154} color={C.orange} size={9}>3. MISS → Query DB</Label>
    </Box>
    <Box x={370} y={180} w={130} h={28} fill="#0B1628" stroke={C.gold}>
      <Label x={435} y={194} color={C.gold} size={9}>4. Write result to cache</Label>
    </Box>
    <Arrow x1={425} y1={128} x2={425} y2={140} color={C.orange} />
    <Arrow x1={425} y1={168} x2={425} y2={180} color={C.gold} />
    <Arrow x1={110} y1={132} x2={190} y2={90} color={C.green} />
    <Arrow x1={110} y1={148} x2={190} y2={195} color={C.orange} dashed />
  </svg>
);

export const CAPDiagram = () => (
  <svg viewBox="0 0 700 320" style={{ width: '100%', background: C.bg, borderRadius: 12, padding: 16 }}>
    <text x="350" y="24" fill={C.blue} fontSize={13} fontWeight="700" textAnchor="middle" fontFamily="Manrope">CAP Theorem — Pick Any Two</text>
    <polygon points="350,55 160,245 540,245" fill="none" stroke={C.border} strokeWidth={2} />
    <circle cx={350} cy={55} r={28} fill={C.blueD} stroke={C.blue} strokeWidth={2} />
    <Label x={350} y={55} color={C.white} bold size={13}>C</Label>
    <text x={350} y={22} fill={C.blue} fontSize={10} fontWeight="600" textAnchor="middle" fontFamily="Manrope">CONSISTENCY</text>
    <circle cx={160} cy={245} r={28} fill="#1A3A1A" stroke={C.green} strokeWidth={2} />
    <Label x={160} y={245} color={C.white} bold size={13}>A</Label>
    <text x={115} y={282} fill={C.green} fontSize={10} fontWeight="600" textAnchor="middle" fontFamily="Manrope">AVAILABILITY</text>
    <circle cx={540} cy={245} r={28} fill="#3A1A0A" stroke={C.orange} strokeWidth={2} />
    <Label x={540} y={245} color={C.white} bold size={13}>P</Label>
    <text x={590} y={282} fill={C.orange} fontSize={10} fontWeight="600" textAnchor="middle" fontFamily="Manrope">PARTITION TOLERANCE</text>
    <rect x={205} y={130} width={80} height={40} fill={C.card} stroke={C.border} rx={6} />
    <text x={245} y={147} fill={C.purple} fontSize={9} fontWeight="700" textAnchor="middle" fontFamily="Manrope">CA (not P)</text>
    <text x={245} y={161} fill={C.muted} fontSize={8} textAnchor="middle" fontFamily="DM Mono">MySQL (single node)</text>
    <rect x={405} y={130} width={90} height={40} fill={C.card} stroke={C.border} rx={6} />
    <text x={450} y={147} fill={C.blue} fontSize={9} fontWeight="700" textAnchor="middle" fontFamily="Manrope">CP (not A)</text>
    <text x={450} y={161} fill={C.muted} fontSize={8} textAnchor="middle" fontFamily="DM Mono">ZooKeeper · HBase</text>
    <rect x={295} y={252} width={110} height={40} fill={C.card} stroke={C.border} rx={6} />
    <text x={350} y={269} fill={C.green} fontSize={9} fontWeight="700" textAnchor="middle" fontFamily="Manrope">AP (not C)</text>
    <text x={350} y={283} fill={C.muted} fontSize={8} textAnchor="middle" fontFamily="DM Mono">Cassandra · DynamoDB</text>
    <rect x={20} y={60} width={110} height={55} fill={C.panel} stroke={C.border} rx={6} />
    <text x={75} y={78} fill={C.gold} fontSize={9} fontWeight="700" textAnchor="middle" fontFamily="Manrope">Key Insight</text>
    <text x={75} y={93} fill={C.muted} fontSize={8} textAnchor="middle" fontFamily="DM Mono">In distributed</text>
    <text x={75} y={105} fill={C.muted} fontSize={8} textAnchor="middle" fontFamily="DM Mono">systems, P is</text>
    <text x={75} y={117} fill={C.cyan} fontSize={8} fontWeight="600" textAnchor="middle" fontFamily="DM Mono">always required!</text>
  </svg>
);

export const ConsistentHashingDiagram = () => {
  const cx = 240, cy = 160, r = 110;
  const servers = [{ a: 0, name: 'S1', col: C.blue }, { a: 90, name: 'S2', col: C.green }, { a: 180, name: 'S3', col: C.orange }, { a: 270, name: 'S4', col: C.purple }];
  const keys = [{ a: 30, name: 'K1' }, { a: 60, name: 'K2' }, { a: 120, name: 'K3' }, { a: 200, name: 'K4' }, { a: 310, name: 'K5' }];
  const toXY = (a: number, rad: number) => { const rad2 = ((a - 90) * Math.PI) / 180; return { x: cx + rad * Math.cos(rad2), y: cy + rad * Math.sin(rad2) }; };
  return (
    <svg viewBox="0 0 700 320" style={{ width: '100%', background: C.bg, borderRadius: 12, padding: 16 }}>
      <text x="350" y="24" fill={C.blue} fontSize={13} fontWeight="700" textAnchor="middle" fontFamily="Manrope">Consistent Hashing Ring</text>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={2} strokeDasharray="4,4" />
      <circle cx={cx} cy={cy} r={4} fill={C.dim} />
      {servers.map(({ a, name, col }) => {
        const { x, y } = toXY(a, r);
        return (<g key={name}><circle cx={x} cy={y} r={16} fill={C.card} stroke={col} strokeWidth={2} />
          <text x={x} y={y} fill={col} fontSize={10} fontWeight="700" textAnchor="middle" dominantBaseline="middle" fontFamily="Manrope">{name}</text>
        </g>);
      })}
      {keys.map(({ a, name }) => {
        const { x, y } = toXY(a, r);
        return (<g key={name}><circle cx={x} cy={y} r={8} fill={C.gold} stroke={C.bg} strokeWidth={1} />
          <text x={x} y={y} fill={C.bg} fontSize={7} fontWeight="700" textAnchor="middle" dominantBaseline="middle" fontFamily="Manrope">{name}</text>
        </g>);
      })}
      <rect x={420} y={40} width={260} height={240} fill={C.panel} stroke={C.border} rx={10} />
      <text x={550} y={60} fill={C.gold} fontSize={11} fontWeight="700" textAnchor="middle" fontFamily="Manrope">How It Works</text>
      {[
        { col: C.blue, title: '1. Hash servers + keys' },
        { col: C.green, title: '2. Place on ring 0–360°' },
        { col: C.orange, title: '3. Key → walk clockwise' },
        { col: C.purple, title: '4. First server = owner' },
      ].map(({ col, title }, i) => (
        <g key={i}>
          <circle cx={440} cy={82 + i * 28} r={6} fill={col} />
          <text x={453} y={86 + i * 28} fill={C.text} fontSize={10} fontFamily="Manrope">{title}</text>
        </g>
      ))}
      <line x1={430} y1={198} x2={670} y2={198} stroke={C.border} />
      <text x={550} y={215} fill={C.cyan} fontSize={10} fontWeight="600" textAnchor="middle" fontFamily="Manrope">Virtual Nodes (Vnodes)</text>
      <text x={550} y={230} fill={C.muted} fontSize={9} textAnchor="middle" fontFamily="DM Mono">Each server has 100–150 vnodes</text>
      <text x={550} y={244} fill={C.green} fontSize={9} fontWeight="600" textAnchor="middle" fontFamily="DM Mono">Used by: Cassandra, DynamoDB, Riak</text>
    </svg>
  );
};

export const URLShortenerDiagram = () => (
  <svg viewBox="0 0 700 340" style={{ width: '100%', background: C.bg, borderRadius: 12, padding: 16 }}>
    <text x="350" y="24" fill={C.blue} fontSize={13} fontWeight="700" textAnchor="middle" fontFamily="Manrope">URL Shortener Architecture (Bitly)</text>
    <Box x={20} y={140} w={80} h={38} fill={C.card} stroke={C.blue}><Label x={60} y={159} color={C.blue} bold>Client</Label></Box>
    <Box x={140} y={140} w={90} h={38} fill={C.card} stroke={C.purple}><Label x={185} y={155} color={C.purple} bold size={10}>Load Balancer</Label></Box>
    <Arrow x1={100} y1={159} x2={140} y2={159} color={C.blue} />
    <Box x={280} y={90} w={110} h={38} fill={C.card} stroke={C.green}>
      <Label x={335} y={104} color={C.green} bold size={10}>Write Service</Label>
      <Label x={335} y={118} color={C.muted} size={8}>POST /shorten</Label>
    </Box>
    <Box x={280} y={188} w={110} h={38} fill={C.card} stroke={C.cyan}>
      <Label x={335} y={202} color={C.cyan} bold size={10}>Read Service</Label>
      <Label x={335} y={216} color={C.muted} size={8}>GET /{'{code}'} → 301</Label>
    </Box>
    <Arrow x1={230} y1={150} x2={280} y2={109} color={C.purple} />
    <Arrow x1={230} y1={168} x2={280} y2={200} color={C.purple} />
    <Box x={440} y={68} w={110} h={38} fill={C.card} stroke={C.gold}>
      <Label x={495} y={82} color={C.gold} bold size={10}>ID Generator</Label>
      <Label x={495} y={96} color={C.muted} size={8}>Base62 encode</Label>
    </Box>
    <Arrow x1={390} y1={100} x2={440} y2={87} color={C.green} />
    <Box x={440} y={170} w={110} h={38} fill={C.card} stroke={C.red}>
      <Label x={495} y={184} color={C.red} bold size={10}>Redis Cache</Label>
      <Label x={495} y={198} color={C.muted} size={8}>shortCode → longURL</Label>
    </Box>
    <Arrow x1={390} y1={207} x2={440} y2={189} color={C.cyan} />
    <Box x={590} y={120} w={90} h={38} fill={C.card} stroke={C.orange}>
      <Label x={635} y={134} color={C.orange} bold size={10}>NoSQL DB</Label>
      <Label x={635} y={148} color={C.muted} size={8}>DynamoDB</Label>
    </Box>
    <Arrow x1={550} y1={87} x2={590} y2={130} color={C.gold} />
    <Arrow x1={550} y1={189} x2={590} y2={145} color={C.red} dashed />
  </svg>
);

export const TwitterFanoutDiagram = () => (
  <svg viewBox="0 0 700 340" style={{ width: '100%', background: C.bg, borderRadius: 12, padding: 16 }}>
    <text x="350" y="24" fill={C.blue} fontSize={13} fontWeight="700" textAnchor="middle" fontFamily="Manrope">Twitter Feed — Fan-out Architecture</text>
    <Box x={20} y={130} w={80} h={38} fill={C.card} stroke={C.blue}><Label x={60} y={149} color={C.blue} bold size={10}>User posts tweet</Label></Box>
    <Box x={140} y={130} w={100} h={38} fill={C.card} stroke={C.green}><Label x={190} y={149} color={C.green} bold size={10}>Tweet Service</Label></Box>
    <Arrow x1={100} y1={149} x2={140} y2={149} color={C.blue} />
    <Box x={285} y={130} w={90} h={38} fill={C.card} stroke={C.purple}>
      <Label x={330} y={144} color={C.purple} bold size={10}>Kafka</Label>
      <Label x={330} y={158} color={C.muted} size={8}>tweet-events topic</Label>
    </Box>
    <Arrow x1={240} y1={149} x2={285} y2={149} color={C.green} />
    <Box x={425} y={80} w={110} h={38} fill={C.card} stroke={C.gold}>
      <Label x={480} y={94} color={C.gold} bold size={10}>Fan-out Worker</Label>
      <Label x={480} y={108} color={C.muted} size={8}>for normal users</Label>
    </Box>
    <Box x={425} y={180} w={110} h={38} fill={C.card} stroke={C.red}>
      <Label x={480} y={194} color={C.red} bold size={9}>Celebrity Handler</Label>
      <Label x={480} y={208} color={C.muted} size={8}>10M+ followers</Label>
    </Box>
    <Arrow x1={375} y1={140} x2={425} y2={99} color={C.purple} />
    <Arrow x1={375} y1={158} x2={425} y2={192} color={C.purple} />
    <Box x={590} y={62} w={95} h={36} fill={C.card} stroke={C.cyan}>
      <Label x={637} y={76} color={C.cyan} bold size={9}>Redis Timeline</Label>
      <Label x={637} y={90} color={C.muted} size={8}>follower_A feed</Label>
    </Box>
    <Box x={590} y={106} w={95} h={36} fill={C.card} stroke={C.cyan}>
      <Label x={637} y={120} color={C.cyan} bold size={9}>Redis Timeline</Label>
      <Label x={637} y={134} color={C.muted} size={8}>follower_B feed</Label>
    </Box>
    <Arrow x1={535} y1={99} x2={590} y2={80} color={C.gold} />
    <Arrow x1={535} y1={99} x2={590} y2={124} color={C.gold} />
    <Box x={590} y={178} w={95} h={36} fill={C.card} stroke={C.red}>
      <Label x={637} y={192} color={C.red} bold size={9}>DB: celebrity</Label>
      <Label x={637} y={206} color={C.muted} size={8}>tweets table</Label>
    </Box>
    <Arrow x1={535} y1={198} x2={590} y2={196} color={C.red} dashed />
  </svg>
);

export const KafkaDiagram = () => (
  <svg viewBox="0 0 700 300" style={{ width: '100%', background: C.bg, borderRadius: 12, padding: 16 }}>
    <text x="350" y="24" fill={C.blue} fontSize={13} fontWeight="700" textAnchor="middle" fontFamily="Manrope">Apache Kafka — Event Streaming Architecture</text>
    <text x={65} y={50} fill={C.green} fontSize={10} fontWeight="700" textAnchor="middle" fontFamily="Manrope">PRODUCERS</text>
    {['Order Svc', 'User Svc', 'Payment Svc'].map((n, i) => (
      <g key={n}>
        <Box x={15} y={60 + i * 56} w={100} h={36} fill={C.card} stroke={C.green}>
          <Label x={65} y={78 + i * 56} color={C.green} size={9} bold>{n}</Label>
        </Box>
        <Arrow x1={115} y1={78 + i * 56} x2={160} y2={78 + i * 56} color={C.green} />
      </g>
    ))}
    <rect x={155} y={50} width={290} height={200} fill="#050F1E" stroke={C.purple} strokeWidth={2} rx={10} />
    <text x={300} y={70} fill={C.purple} fontSize={10} fontWeight="700" textAnchor="middle" fontFamily="Manrope">KAFKA BROKER</text>
    {[{ name: 'orders-topic', y: 80, col: C.gold }, { name: 'events-topic', y: 155, col: C.orange }].map(({ name, y, col }) => (
      <g key={name}>
        <text x={300} y={y} fill={col} fontSize={9} fontWeight="600" textAnchor="middle" fontFamily="Manrope">{name}</text>
        {[0, 1, 2].map(p => (
          <g key={p}>
            <rect x={170 + p * 84} y={y + 6} width={76} height={44} fill={C.card} stroke={col} strokeWidth={1} rx={4} />
            <text x={208 + p * 84} y={y + 22} fill={col} fontSize={8} textAnchor="middle" fontFamily="DM Mono">Partition {p}</text>
            <text x={208 + p * 84} y={y + 36} fill={C.dim} fontSize={7} textAnchor="middle" fontFamily="DM Mono">offset 0→N</text>
          </g>
        ))}
      </g>
    ))}
    <text x={570} y={50} fill={C.cyan} fontSize={10} fontWeight="700" textAnchor="middle" fontFamily="Manrope">CONSUMERS</text>
    {['Analytics Svc', 'Notification Svc', 'Audit Svc'].map((n, i) => (
      <g key={n}>
        <Box x={520} y={72 + i * 56} w={110} h={36} fill={C.card} stroke={C.cyan}>
          <Label x={575} y={90 + i * 56} color={C.cyan} size={9} bold>{n}</Label>
        </Box>
        <Arrow x1={445} y1={100 + i * 30} x2={520} y2={90 + i * 56} color={C.cyan} />
      </g>
    ))}
  </svg>
);

export const UberGeoDiagram = () => (
  <svg viewBox="0 0 700 320" style={{ width: '100%', background: C.bg, borderRadius: 12, padding: 16 }}>
    <text x="350" y="24" fill={C.blue} fontSize={13} fontWeight="700" textAnchor="middle" fontFamily="Manrope">Uber — Real-Time Geo & Matching System</text>
    <Box x={15} y={80} w={90} h={38} fill={C.card} stroke={C.green}><Label x={60} y={99} color={C.green} bold>Driver App</Label></Box>
    <Box x={15} y={180} w={90} h={38} fill={C.card} stroke={C.blue}><Label x={60} y={199} color={C.blue} bold>Rider App</Label></Box>
    <Box x={145} y={75} w={110} h={48} fill={C.card} stroke={C.orange}>
      <Label x={200} y={89} color={C.orange} bold size={10}>Location Service</Label>
      <Label x={200} y={104} color={C.muted} size={8}>WebSocket server</Label>
      <Label x={200} y={116} color={C.muted} size={8}>10M concurrent drivers</Label>
    </Box>
    <Arrow x1={105} y1={99} x2={145} y2={95} color={C.green} />
    <Box x={305} y={65} w={110} h={58} fill={C.card} stroke={C.red}>
      <Label x={360} y={80} color={C.red} bold size={10}>Redis GEOADD</Label>
      <Label x={360} y={95} color={C.muted} size={8}>Sorted Set by geohash</Label>
      <Label x={360} y={108} color={C.cyan} size={8}>lat/lng → hash string</Label>
    </Box>
    <Arrow x1={255} y1={95} x2={305} y2={88} color={C.orange} />
    <Box x={145} y={175} w={110} h={48} fill={C.card} stroke={C.purple}>
      <Label x={200} y={189} color={C.purple} bold size={10}>Matching Service</Label>
      <Label x={200} y={204} color={C.muted} size={8}>GEORADIUS query</Label>
      <Label x={200} y={216} color={C.muted} size={8}>within 5km radius</Label>
    </Box>
    <Arrow x1={105} y1={199} x2={145} y2={195} color={C.blue} />
    <Arrow x1={360} y1={123} x2={250} y2={186} color={C.red} dashed />
    <Box x={305} y={178} w={110} h={38} fill={C.card} stroke={C.gold}>
      <Label x={360} y={192} color={C.gold} bold size={10}>Trip DB (Cassandra)</Label>
      <Label x={360} y={206} color={C.muted} size={8}>trip_id, driver, rider</Label>
    </Box>
    <Arrow x1={255} y1={199} x2={305} y2={197} color={C.purple} />
    <Box x={465} y={150} w={110} h={38} fill={C.card} stroke={C.cyan}>
      <Label x={520} y={164} color={C.cyan} bold size={10}>Push Notification</Label>
      <Label x={520} y={178} color={C.muted} size={8}>APNS / FCM</Label>
    </Box>
    <Arrow x1={415} y1={197} x2={465} y2={169} color={C.gold} />
  </svg>
);

export const WebCrawlerDiagram = () => (
  <svg viewBox="0 0 700 320" style={{ width: '100%', background: C.bg, borderRadius: 12, padding: 16 }}>
    <text x="350" y="24" fill={C.blue} fontSize={13} fontWeight="700" textAnchor="middle" fontFamily="Manrope">Web Crawler Architecture</text>
    <Box x={15} y={100} w={90} h={38} fill={C.card} stroke={C.gold}><Label x={60} y={119} color={C.gold} bold size={10}>Seed URLs</Label></Box>
    <Box x={145} y={90} w={110} h={58} fill={C.card} stroke={C.blue}>
      <Label x={200} y={108} color={C.blue} bold size={10}>URL Frontier</Label>
      <Label x={200} y={122} color={C.muted} size={8}>Priority Queue</Label>
      <Label x={200} y={136} color={C.muted} size={8}>politeness delay</Label>
    </Box>
    <Arrow x1={105} y1={119} x2={145} y2={119} color={C.gold} />
    <Box x={305} y={60} w={100} h={36} fill={C.card} stroke={C.cyan}>
      <Label x={355} y={78} color={C.cyan} bold size={10}>DNS Resolver</Label>
    </Box>
    <Box x={305} y={110} w={100} h={38} fill={C.card} stroke={C.green}>
      <Label x={355} y={124} color={C.green} bold size={10}>HTML Fetcher</Label>
      <Label x={355} y={138} color={C.muted} size={8}>HTTP worker pool</Label>
    </Box>
    <Arrow x1={255} y1={110} x2={305} y2={76} color={C.blue} />
    <Arrow x1={255} y1={125} x2={305} y2={125} color={C.blue} />
    <Arrow x1={355} y1={96} x2={355} y2={110} color={C.cyan} />
    <Box x={455} y={90} w={110} h={58} fill={C.card} stroke={C.purple}>
      <Label x={510} y={108} color={C.purple} bold size={10}>Content Parser</Label>
      <Label x={510} y={122} color={C.muted} size={8}>extract links</Label>
      <Label x={510} y={136} color={C.muted} size={8}>extract text</Label>
    </Box>
    <Arrow x1={405} y1={125} x2={455} y2={115} color={C.green} />
    <Box x={305} y={190} w={110} h={40} fill={C.card} stroke={C.red}>
      <Label x={355} y={204} color={C.red} bold size={10}>URL Seen? Filter</Label>
      <Label x={355} y={218} color={C.muted} size={8}>Bloom Filter</Label>
    </Box>
    <Arrow x1={510} y1={148} x2={355} y2={190} color={C.purple} />
    <Box x={455} y={190} w={110} h={40} fill={C.card} stroke={C.orange}>
      <Label x={510} y={204} color={C.orange} bold size={10}>Content Store</Label>
      <Label x={510} y={218} color={C.muted} size={8}>S3 + Elasticsearch</Label>
    </Box>
    <Arrow x1={510} y1={148} x2={510} y2={190} color={C.purple} />
  </svg>
);

export const NotificationDiagram = () => (
  <svg viewBox="0 0 700 320" style={{ width: '100%', background: C.bg, borderRadius: 12, padding: 16 }}>
    <text x="350" y="24" fill={C.blue} fontSize={13} fontWeight="700" textAnchor="middle" fontFamily="Manrope">Notification System Architecture</text>
    <text x={65} y={50} fill={C.gold} fontSize={10} fontWeight="700" textAnchor="middle" fontFamily="Manrope">PRODUCERS</text>
    {['Order Svc', 'Social Svc', 'Marketing'].map((n, i) => (
      <g key={n}>
        <Box x={15} y={58 + i * 54} w={100} h={36} fill={C.card} stroke={C.gold}><Label x={65} y={76 + i * 54} color={C.gold} size={9} bold>{n}</Label></Box>
        <Arrow x1={115} y1={76 + i * 54} x2={155} y2={120} color={C.gold} />
      </g>
    ))}
    <Box x={150} y={100} w={120} h={56} fill={C.card} stroke={C.blue}>
      <Label x={210} y={118} color={C.blue} bold size={10}>Notification Service</Label>
      <Label x={210} y={132} color={C.muted} size={8}>route + template</Label>
      <Label x={210} y={144} color={C.muted} size={8}>user preferences</Label>
    </Box>
    <Box x={320} y={100} w={90} h={56} fill={C.card} stroke={C.purple}>
      <Label x={365} y={118} color={C.purple} bold>Kafka</Label>
      <Label x={365} y={132} color={C.muted} size={8}>push-topic</Label>
      <Label x={365} y={144} color={C.muted} size={8}>email-topic</Label>
      <Label x={365} y={156} color={C.muted} size={8}>sms-topic</Label>
    </Box>
    <Arrow x1={270} y1={128} x2={320} y2={128} color={C.blue} />
    {[
      { name: 'iOS Worker', channel: 'APNs', color: C.cyan, y: 60 },
      { name: 'Android Worker', channel: 'FCM', color: C.green, y: 118 },
      { name: 'Email Worker', channel: 'SendGrid', color: C.gold, y: 176 },
      { name: 'SMS Worker', channel: 'Twilio', color: C.orange, y: 234 },
    ].map(({ name, channel, color, y }) => (
      <g key={name}>
        <Box x={465} y={y} w={100} h={36} fill={C.card} stroke={color}><Label x={515} y={y + 18} color={color} size={9} bold>{name}</Label></Box>
        <Box x={600} y={y} w={85} h={36} fill={C.card} stroke={C.dim}><Label x={642} y={y + 18} color={C.muted} size={9}>{channel}</Label></Box>
        <Arrow x1={410} y1={128} x2={465} y2={y + 18} color={color} />
        <Arrow x1={565} y1={y + 18} x2={600} y2={y + 18} color={color} />
      </g>
    ))}
  </svg>
);

export const KeyValueDiagram = () => (
  <svg viewBox="0 0 700 320" style={{ width: '100%', background: C.bg, borderRadius: 12, padding: 16 }}>
    <text x="350" y="24" fill={C.blue} fontSize={13} fontWeight="700" textAnchor="middle" fontFamily="Manrope">Distributed Key-Value Store</text>
    <Box x={15} y={130} w={80} h={38} fill={C.card} stroke={C.blue}><Label x={55} y={149} color={C.blue} bold>Client</Label></Box>
    <Box x={135} y={120} w={110} h={58} fill={C.card} stroke={C.purple}>
      <Label x={190} y={138} color={C.purple} bold size={10}>Coordinator Node</Label>
      <Label x={190} y={152} color={C.muted} size={8}>consistent hashing</Label>
      <Label x={190} y={164} color={C.muted} size={8}>replication factor N=3</Label>
    </Box>
    <Arrow x1={95} y1={149} x2={135} y2={149} color={C.blue} />
    {[[295, 60], [295, 130], [295, 200], [430, 60], [430, 130], [430, 200]].map(([x, y], i) => (
      <g key={i}>
        <Box x={x} y={y} w={95} h={48} fill={C.card} stroke={i < 3 ? C.green : C.orange}>
          <Label x={x + 47} y={y + 18} color={i < 3 ? C.green : C.orange} size={9} bold>Node {i + 1}</Label>
          <Label x={x + 47} y={y + 32} color={C.muted} size={8}>{i < 3 ? 'primary' : 'replica'}</Label>
        </Box>
        <Arrow x1={245} y1={149} x2={x} y2={y + 24} color={i < 3 ? C.purple : C.dim} dashed={i >= 3} />
      </g>
    ))}
    <Arrow x1={390} y1={84} x2={430} y2={84} color={C.dim} dashed />
    <Arrow x1={390} y1={154} x2={430} y2={154} color={C.dim} dashed />
    <text x={412} y={295} fill={C.dim} fontSize={8} textAnchor="middle" fontFamily="DM Mono">← gossip →</text>
  </svg>
);

export const GoogleDriveDiagram = () => (
  <svg viewBox="0 0 700 310" style={{ width: '100%', background: C.bg, borderRadius: 12, padding: 16 }}>
    <text x="350" y="24" fill={C.blue} fontSize={13} fontWeight="700" textAnchor="middle" fontFamily="Manrope">Google Drive — File Storage & Sync Architecture</text>
    <Box x={15} y={120} w={85} h={50} fill={C.card} stroke={C.blue}>
      <Label x={57} y={138} color={C.blue} bold size={10}>Client</Label>
      <Label x={57} y={152} color={C.muted} size={8}>block-level</Label>
      <Label x={57} y={162} color={C.muted} size={7}>delta sync</Label>
    </Box>
    <Box x={140} y={125} w={100} h={40} fill={C.card} stroke={C.purple}><Label x={190} y={145} color={C.purple} bold size={10}>API Gateway</Label></Box>
    <Arrow x1={100} y1={145} x2={140} y2={145} color={C.blue} />
    <Box x={290} y={65} w={110} h={46} fill={C.card} stroke={C.green}>
      <Label x={345} y={82} color={C.green} bold size={10}>Block Service</Label>
      <Label x={345} y={96} color={C.muted} size={8}>split file → 4MB blocks</Label>
      <Label x={345} y={108} color={C.muted} size={8}>SHA-256 fingerprint</Label>
    </Box>
    <Arrow x1={240} y1={140} x2={290} y2={88} color={C.purple} />
    <Box x={290} y={160} w={110} h={46} fill={C.card} stroke={C.cyan}>
      <Label x={345} y={177} color={C.cyan} bold size={10}>Metadata Service</Label>
      <Label x={345} y={191} color={C.muted} size={8}>file tree, versions</Label>
      <Label x={345} y={203} color={C.muted} size={8}>MySQL + Redis</Label>
    </Box>
    <Arrow x1={240} y1={155} x2={290} y2={178} color={C.purple} />
    <Box x={455} y={55} w={100} h={38} fill={C.card} stroke={C.orange}>
      <Label x={505} y={69} color={C.orange} bold size={10}>S3 Block Store</Label>
      <Label x={505} y={83} color={C.muted} size={8}>dedup by hash</Label>
    </Box>
    <Arrow x1={400} y1={85} x2={455} y2={74} color={C.green} />
    <Box x={455} y={162} w={100} h={36} fill={C.card} stroke={C.red}>
      <Label x={505} y={176} color={C.red} bold size={10}>MySQL Metadata</Label>
      <Label x={505} y={190} color={C.muted} size={8}>files, blocks, users</Label>
    </Box>
    <Arrow x1={400} y1={183} x2={455} y2={180} color={C.cyan} />
    <text x={350} y={300} fill={C.muted} fontSize={8} textAnchor="middle" fontFamily="DM Mono">Dedup: same 4MB block (same SHA-256) never stored twice</text>
  </svg>
);

export const DIAGRAMS: Record<string, React.ComponentType> = {
  networking: NetworkingDiagram,
  scaling: ScalingDiagram,
  databases: DatabaseDiagram,
  caching: CachingDiagram,
  cap: CAPDiagram,
  hashing: ConsistentHashingDiagram,
  urlshortener: URLShortenerDiagram,
  twitter: TwitterFanoutDiagram,
  kafka: KafkaDiagram,
  uber: UberGeoDiagram,
  webcrawler: WebCrawlerDiagram,
  notification: NotificationDiagram,
  keyvalue: KeyValueDiagram,
  googledrive: GoogleDriveDiagram,
};
