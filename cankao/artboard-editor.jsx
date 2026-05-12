// artboard-editor.jsx — Direction A: The Editor
// Full app shell. Block editor with one block flipped to HTML source view.
// Demonstrates: tabs, sidebar, backlinks, embedded components, the
// "every block is HTML" toggle.

const { useState: useStateA, useEffect: useEffectA } = React;

// ── Vault data ─────────────────────────────────────────────────────────────
const VAULT_A = [
  { type: "folder", depth: 0, name: "acme-engineering",  open: true },
  { type: "folder", depth: 1, name: "00 · inbox",         open: false, badge: "4" },
  { type: "folder", depth: 1, name: "10 · specs",         open: true },
  { type: "file",   depth: 2, name: "auth-service-v2",    ext: ".html", active: true, id: "auth" },
  { type: "file",   depth: 2, name: "billing-rewrite",    ext: ".html", id: "billing" },
  { type: "file",   depth: 2, name: "feature-flags",      ext: ".html", id: "flags" },
  { type: "file",   depth: 2, name: "rate-limiter-redesign", ext: ".html", id: "rl" },
  { type: "folder", depth: 1, name: "20 · runbooks",      open: true },
  { type: "file",   depth: 2, name: "oncall-pager",       ext: ".html", id: "pager" },
  { type: "file",   depth: 2, name: "postgres-failover",  ext: ".html", id: "pg" },
  { type: "file",   depth: 2, name: "kafka-lag-spike",    ext: ".html", id: "kafka" },
  { type: "folder", depth: 1, name: "30 · people",        open: false, badge: "12" },
  { type: "folder", depth: 1, name: "components/",        open: true, special: true },
  { type: "file",   depth: 2, name: "api-status",         ext: ".html", id: "c-api",   color: "var(--c-cyan)" },
  { type: "file",   depth: 2, name: "metric",             ext: ".html", id: "c-metric", color: "var(--c-cyan)" },
  { type: "file",   depth: 2, name: "decision",           ext: ".html", id: "c-dec",    color: "var(--c-cyan)" },
  { type: "file",   depth: 2, name: "diagram-flow",       ext: ".html", id: "c-diag",   color: "var(--c-cyan)" },
  { type: "folder", depth: 1, name: "_attachments",       open: false, badge: "47" },
  { type: "folder", depth: 1, name: "_archive",           open: false, dim: true },
];

const TABS_A = [
  { id: "auth",    title: "auth-service-v2.html",    folder: "10 · specs", dirty: true },
  { id: "pager",   title: "oncall-pager.html",       folder: "20 · runbooks" },
  { id: "c-api",   title: "api-status.html",         folder: "components/", pinned: true },
];

// ── Inline syntax-tinted HTML renderer for the "source view" block ────────
function SyntaxHTML({ src }) {
  // tokenize a very small subset; visual only
  const lines = src.split("\n");
  return (
    <pre style={{
      margin: 0, padding: "12px 16px",
      fontFamily: "var(--f-mono)", fontSize: 12, lineHeight: 1.55,
      color: "var(--m-fg-1)",
      background: "var(--m-bg-inset)",
      borderRadius: 6,
      overflow: "auto",
      counterReset: "ln",
    }}>{lines.map((ln, i) => (
      <div key={i} style={{ display: "flex", gap: 14 }}>
        <span style={{ width: 18, color: "var(--m-fg-3)", textAlign: "right", flex: "0 0 18px", userSelect: "none" }}>{i + 1}</span>
        <span style={{ flex: 1, whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: htmlTokenize(ln) }} />
      </div>
    ))}</pre>
  );
}
function esc(s) { return s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
// Marker-based: collect non-overlapping ranges on the RAW line, then emit
// HTML in one pass. No risk of regexes re-matching injected span markup.
function htmlTokenize(line) {
  const C = { tag: "var(--c-magenta)", attr: "var(--c-cyan)", string: "var(--c-green)" };
  const ranges = [];
  const add = (re, color, group = 0) => {
    re.lastIndex = 0; let m;
    while ((m = re.exec(line))) {
      const grpStart = group ? m.index + m[0].indexOf(m[group]) : m.index;
      const grpEnd = grpStart + m[group].length;
      if (!ranges.some(r => grpStart < r.e && grpEnd > r.s)) ranges.push({ s: grpStart, e: grpEnd, color });
      if (m[0].length === 0) re.lastIndex++;
    }
  };
  add(/"[^"]*"/g, C.string);
  add(/<\/?[a-z][\w-]*/gi, C.tag);
  add(/\s([a-z-]+)=/gi, C.attr, 1);
  ranges.sort((a, b) => a.s - b.s);
  let out = "", cursor = 0;
  for (const r of ranges) {
    if (r.s < cursor) continue;
    out += esc(line.slice(cursor, r.s));
    out += `<span style="color:${r.color}">${esc(line.slice(r.s, r.e))}</span>`;
    cursor = r.e;
  }
  out += esc(line.slice(cursor));
  return out;
}

// ── Embedded callout block ────────────────────────────────────────────────
function CalloutBlock({ kind = "warn", title, children }) {
  const colors = {
    warn:   { fg: "var(--c-red)",    bg: "oklch(0.32 0.05 25 / 0.18)",  ico: "!" },
    info:   { fg: "var(--c-blue)",   bg: "oklch(0.32 0.04 240 / 0.18)", ico: "i" },
    decide: { fg: "var(--c-violet)", bg: "oklch(0.32 0.04 290 / 0.18)", ico: "◆" },
  }[kind];
  return (
    <div style={{
      display: "flex", gap: 12,
      padding: "12px 14px",
      borderRadius: 8, border: "1px solid var(--m-line)",
      borderLeft: `3px solid ${colors.fg}`,
      background: colors.bg,
    }}>
      <div style={{
        width: 18, height: 18, flex: "0 0 18px",
        borderRadius: "50%", background: colors.fg,
        color: "var(--m-bg)", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: 11, marginTop: 1,
      }}>{colors.ico}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: colors.fg, fontSize: 12.5, letterSpacing: "0.02em", textTransform: "uppercase" }}>{title}</div>
        <div style={{ marginTop: 4, color: "var(--m-fg-1)" }}>{children}</div>
      </div>
    </div>
  );
}

// ── Embedded mini latency chart (web-component–style) ─────────────────────
function LatencyChart() {
  const data = [42, 48, 39, 55, 61, 58, 47, 52, 49, 64, 71, 88, 102, 95, 82, 73, 68, 75, 81, 69];
  const max = 110;
  const w = 100 / data.length;
  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: 8, border: "1px solid var(--m-line)",
      background: "var(--m-bg-1)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--m-fg-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>p99 latency · /auth/token</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginTop: 2, fontFamily: "var(--f-mono)" }}>
            87<span style={{ color: "var(--m-fg-3)", fontSize: 12, marginLeft: 4 }}>ms</span>
            <span style={{ marginLeft: 12, fontSize: 12, color: "var(--c-red)", fontWeight: 500 }}>↑ 38% wow</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <span className="m-chip mono">live</span>
          <span className="m-chip mono" style={{ color: "var(--c-cyan)" }}>&lt;metric&gt;</span>
        </div>
      </div>
      <svg viewBox="0 0 100 32" preserveAspectRatio="none" style={{ width: "100%", height: 56, marginTop: 10 }}>
        <defs>
          <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--m-vein)" stopOpacity="0.35"/>
            <stop offset="1" stopColor="var(--m-vein)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={`M0,32 ${data.map((d, i) => `L${i * w + w / 2},${32 - (d / max) * 30}`).join(" ")} L100,32 Z`}
          fill="url(#lg)" />
        <path d={`M0,${32 - (data[0] / max) * 30} ${data.map((d, i) => `L${i * w + w / 2},${32 - (d / max) * 30}`).join(" ")}`}
          fill="none" stroke="var(--m-vein)" strokeWidth="0.7" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {/* threshold line */}
        <line x1="0" y1={32 - (80 / max) * 30} x2="100" y2={32 - (80 / max) * 30}
          stroke="var(--c-red)" strokeWidth="0.4" strokeDasharray="1 1" vectorEffect="non-scaling-stroke"/>
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10.5, color: "var(--m-fg-3)", fontFamily: "var(--f-mono)" }}>
        <span>-20h</span><span>SLO 80 ms</span><span>now</span>
      </div>
    </div>
  );
}

// ── Decision block ──────────────────────────────────────────────────────
function DecisionBlock() {
  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: 8, border: "1px solid var(--m-line)",
      background: "linear-gradient(180deg, oklch(0.22 0.02 78 / 0.25), transparent 70%), var(--m-bg-1)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="m-chip mono" style={{ color: "var(--m-vein)", borderColor: "var(--m-vein-dim)" }}>◆ decision</span>
        <span style={{ fontSize: 11, color: "var(--m-fg-3)", fontFamily: "var(--f-mono)" }}>2026-04-22 · ADR-014</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 15, fontWeight: 500, lineHeight: 1.4 }}>
        Adopt opaque session tokens (Paseto v4.local) and retire JWT for first-party clients by Q3.
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 16, fontSize: 12, color: "var(--m-fg-2)" }}>
        <span><span style={{ color: "var(--m-fg-3)" }}>by</span> @lin.chen</span>
        <span><span style={{ color: "var(--m-fg-3)" }}>signed off</span> @yusuf, @prabha, @diana</span>
        <span style={{ color: "var(--c-green)" }}>● accepted</span>
      </div>
    </div>
  );
}

// ── A single block in the editor: hover handle + toggle to source view ────
function Block({ children, sourceMode, onToggle, src, label = "p" }) {
  const [hover, setHover] = useStateA(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: "relative", margin: "10px 0" }}>
      <div style={{
        position: "absolute", left: -64, top: 2,
        display: "flex", gap: 4, alignItems: "center",
        opacity: hover || sourceMode ? 1 : 0,
        transition: "opacity .12s",
      }}>
        <button title="Drag" style={blockBtn()}>
          <Icon d={<><circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/></>} stroke="0"/>
        </button>
        <button title={sourceMode ? "Render" : "Edit as HTML"} onClick={onToggle}
          style={{ ...blockBtn(), color: sourceMode ? "var(--m-vein)" : "var(--m-fg-3)",
                   background: sourceMode ? "var(--m-bg-2)" : "transparent" }}>
          {sourceMode ? I.eye : I.code}
        </button>
        <span style={{
          fontSize: 9.5, fontFamily: "var(--f-mono)",
          color: "var(--m-fg-3)", textTransform: "lowercase",
        }}>&lt;{label}&gt;</span>
      </div>
      {sourceMode ? (
        <div style={{ position: "relative" }}>
          <SyntaxHTML src={src} />
          <div style={{
            position: "absolute", right: 8, top: 8,
            display: "flex", gap: 6,
          }}>
            <span className="m-chip mono" style={{ color: "var(--m-vein)", borderColor: "var(--m-vein-dim)" }}>HTML source</span>
            <button onClick={onToggle} style={{
              padding: "0 8px", height: 18, borderRadius: 9,
              background: "var(--m-bg-2)", color: "var(--m-fg-1)",
              fontSize: 11, border: "1px solid var(--m-line)",
            }}>render →</button>
          </div>
        </div>
      ) : children}
    </div>
  );
}
function blockBtn() {
  return {
    width: 20, height: 20, borderRadius: 4,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--m-fg-3)",
  };
}

// ── Tab in tab bar ────────────────────────────────────────────────────────
function Tab({ tab, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "0 10px", height: 30,
      minWidth: 0, maxWidth: 220,
      background: active ? "var(--m-bg-1)" : "transparent",
      color: active ? "var(--m-fg)" : "var(--m-fg-2)",
      borderRight: "1px solid var(--m-line-soft)",
      borderTop: active ? "1px solid var(--m-vein-dim)" : "1px solid transparent",
      cursor: "pointer", fontSize: 12, position: "relative",
    }}>
      <span style={{ color: tab.pinned ? "var(--c-cyan)" : "var(--m-fg-3)", display: "flex" }}>
        {tab.pinned ? <Icon d={<path d="M12 2v7l4 4-2 2h-4l-2-2 4-4V2zM12 15v7"/>} size={12}/> : I.html}
      </span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: tab.title.endsWith(".html") ? "var(--f-mono)" : "inherit", fontSize: 11.5 }}>
        {tab.title}
      </span>
      {tab.dirty && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--m-vein)", flex: "0 0 6px" }}/>}
      <button style={{ marginLeft: 2, color: "var(--m-fg-3)", display: "flex" }} onClick={e => e.stopPropagation()}>{I.close && React.cloneElement(I.close, { size: 12 })}</button>
    </div>
  );
}

// ── The artboard ──────────────────────────────────────────────────────────
function ArtboardEditor() {
  const [ribbon, setRibbon] = useStateA("files");
  const [activeFile, setActiveFile] = useStateA("auth");
  const [activeTab, setActiveTab] = useStateA("auth");
  const [sourceBlock, setSourceBlock] = useStateA(null); // id of block flipped to HTML
  const [showPalette, setShowPalette] = useStateA(false);

  // HTML source for the callout block (this is the "block-level HTML" demo)
  const calloutSrc =
`<m-callout kind="warn" title="rotation is non-trivial">
  Existing JWTs are stateless. We need a
  <m-link to="rate-limiter-redesign.html#kill-switch">kill-switch</m-link>
  and a 24h grace window before flipping the issuer.
</m-callout>`;

  const chartSrc =
`<metric
  key="auth.token.p99"
  source="datadog://acme/auth-service"
  threshold="80ms"
  window="20h" />`;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <MarbleFrame
        title="acme-engineering / auth-service-v2.html"
        subtitle="vault: /Users/lin/Notes/Marble"
        right={<>
          <button className="frame-btn" title="Command palette · ⌘K" onClick={() => setShowPalette(true)}>
            {I.bolt}
          </button>
          <button className="frame-btn" title="AI">{I.ai}</button>
          <span style={{ width: 1, height: 14, background: "var(--m-line)", margin: "0 2px" }} />
          <button className="frame-btn">{I.code}</button>
          <button className="frame-btn">{I.link}</button>
        </>}>
        <Ribbon active={ribbon} onChange={setRibbon}/>

        {/* Sidebar */}
        <div style={{
          width: 244, flex: "0 0 244px",
          background: "var(--m-bg-1)",
          borderRight: "1px solid var(--m-line-soft)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          <SideHead action={<span style={{ display: "flex", gap: 4 }}>{I.plus}</span>}>vault</SideHead>
          <div style={{ flex: 1, overflow: "auto", padding: "2px 6px 12px" }}>
            {VAULT_A.map((row, i) => {
              if (row.type === "folder") return (
                <TreeRow key={i} depth={row.depth}
                  icon={row.open ? I.chevD : I.chev}
                  name={row.name}
                  badge={row.badge}
                  dim={row.dim}
                  color={row.special ? "var(--c-cyan)" : undefined}
                />
              );
              if (!isUnderOpen(VAULT_A, i)) return null;
              return (
                <TreeRow key={i} depth={row.depth}
                  icon={<span style={{ color: row.color || "var(--m-fg-3)", fontFamily: "var(--f-mono)", fontSize: 9, fontWeight: 600 }}>&lt;/&gt;</span>}
                  name={row.name} ext={row.ext}
                  active={activeFile === row.id}
                  onClick={() => { setActiveFile(row.id); setActiveTab(row.id); }}
                />
              );
            })}
          </div>
          {/* Sidebar footer: vault info */}
          <div style={{ padding: "8px 10px", borderTop: "1px solid var(--m-line-soft)", fontSize: 11, color: "var(--m-fg-3)", fontFamily: "var(--f-mono)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>312 notes</span><span>14 components</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}><span>1,847 links</span><span style={{ color: "var(--c-green)" }}>● synced</span></div>
          </div>
        </div>

        {/* Main column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Tab bar */}
          <div style={{
            display: "flex", alignItems: "stretch",
            height: 30, background: "var(--m-bg)",
            borderBottom: "1px solid var(--m-line-soft)",
            paddingRight: 8,
          }}>
            {TABS_A.map(t => <Tab key={t.id} tab={t} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />)}
            <button style={{ width: 28, color: "var(--m-fg-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>{I.plus && React.cloneElement(I.plus, { size: 14 })}</button>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--m-fg-3)", fontSize: 11, fontFamily: "var(--f-mono)" }}>
              <span>read</span><span>·</span><span>live</span><span>·</span><span style={{ color: "var(--m-fg-1)" }}>source</span>
            </div>
          </div>

          {/* Editor + right panel */}
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            {/* Editor scroll */}
            <div style={{ flex: 1, overflow: "auto", padding: "32px 80px 60px 80px", position: "relative" }}>
              {/* Breadcrumb */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--m-fg-3)", fontSize: 11.5, fontFamily: "var(--f-mono)" }}>
                <span>10 · specs</span>
                <span>/</span>
                <span style={{ color: "var(--m-fg-1)" }}>auth-service-v2.html</span>
              </div>

              {/* Title */}
              <h1 style={{ fontSize: 30, fontWeight: 600, margin: "8px 0 6px", letterSpacing: "-0.018em", lineHeight: 1.15 }}>
                Auth Service v2 — RFC
              </h1>

              {/* Frontmatter chip strip */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22, alignItems: "center" }}>
                <span className="m-chip" style={{ color: "var(--c-violet)", borderColor: "oklch(0.32 0.06 290)" }}>
                  <span className="m-chip-dot" style={{ background: "var(--c-violet)" }}/>status: in-review
                </span>
                <span className="m-chip mono">#auth</span>
                <span className="m-chip mono">#rfc</span>
                <span className="m-chip mono">#q3-2026</span>
                <span className="m-chip"><span className="m-chip-dot" style={{ background: "var(--c-green)" }}/>owner @lin.chen</span>
                <span className="m-chip mono">3 reviewers</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: "var(--m-fg-3)", fontFamily: "var(--f-mono)" }}>updated 12 min ago</span>
              </div>

              {/* Heading */}
              <h2 style={hStyle()}><span style={{ color: "var(--m-fg-3)", marginRight: 8 }}>#</span>Problem</h2>

              <Block label="p">
                <p style={pStyle()}>
                  Today every first-party client validates a <em>{`stateless`}</em> JWT signed by{" "}
                  <span style={inlineCodeStyle()}>auth-svc</span>. Rotation requires a fleet-wide kid roll;
                  revocation requires a blocklist nobody trusts. p99 on
                  {" "}<a style={linkStyle()}>/auth/token</a> has climbed{" "}
                  <strong style={{ color: "var(--c-red)" }}>38% wow</strong>, and three out of four pages
                  in the last sprint trace back to{" "}
                  <a style={linkStyle()}>oncall-pager.html</a>.
                </p>
              </Block>

              {/* Live latency chart — embedded component */}
              <Block label="metric" sourceMode={sourceBlock === "metric"}
                onToggle={() => setSourceBlock(sourceBlock === "metric" ? null : "metric")}
                src={chartSrc}>
                <LatencyChart />
              </Block>

              {/* Heading */}
              <h2 style={hStyle()}><span style={{ color: "var(--m-fg-3)", marginRight: 8 }}>#</span>Proposal</h2>

              <Block label="p">
                <p style={pStyle()}>
                  Swap to <strong>opaque session tokens</strong> issued by{" "}
                  <span style={inlineCodeStyle()}>auth-svc</span>, backed by a 5s-TTL cache in
                  {" "}<span style={inlineCodeStyle()}>session-store</span> (RedisCluster · us-east-1).
                  Tokens are random 128-bit, validated by a tiny gRPC call. Rotation becomes a TTL bump.
                </p>
              </Block>

              {/* Decision block (web component) */}
              <Block label="decision">
                <DecisionBlock />
              </Block>

              {/* THE KEY BLOCK: a callout flipped to HTML source */}
              <Block label="m-callout" sourceMode={sourceBlock !== "callout-rendered"}
                onToggle={() => setSourceBlock(sourceBlock === "callout-rendered" ? "callout" : "callout-rendered")}
                src={calloutSrc}>
                <CalloutBlock kind="warn" title="rotation is non-trivial">
                  Existing JWTs are stateless. We need a <a style={linkStyle()}>kill-switch</a> and a 24h
                  grace window before flipping the issuer.
                </CalloutBlock>
              </Block>

              <h2 style={hStyle()}><span style={{ color: "var(--m-fg-3)", marginRight: 8 }}>#</span>Risk &amp; rollout</h2>

              <Block label="ul">
                <ul style={{ ...pStyle(), paddingLeft: 22, margin: "8px 0" }}>
                  <li style={{ margin: "4px 0" }}>Week 1: dual-issue, clients accept both. Telemetry on each path.</li>
                  <li style={{ margin: "4px 0" }}>Week 3: flip default. <span style={inlineCodeStyle()}>jwt-fallback</span> flag still on. <a style={linkStyle()}>feature-flags.html</a></li>
                  <li style={{ margin: "4px 0" }}>Week 6: drop JWT path. Archive <span style={inlineCodeStyle()}>kid-rotation.md</span>.</li>
                </ul>
              </Block>

              {/* Bottom: meta */}
              <div style={{ marginTop: 36, paddingTop: 16, borderTop: "1px solid var(--m-line-soft)",
                            display: "flex", gap: 24, fontSize: 11.5, color: "var(--m-fg-3)", fontFamily: "var(--f-mono)" }}>
                <span>1,247 words</span>
                <span>14 blocks</span>
                <span>4 inbound · 7 outbound</span>
                <span>schema: rfc.html</span>
              </div>
            </div>

            {/* Right panel: outline + backlinks */}
            <div style={{
              width: 252, flex: "0 0 252px",
              background: "var(--m-bg-1)",
              borderLeft: "1px solid var(--m-line-soft)",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}>
              <SideHead>outline</SideHead>
              <div style={{ padding: "0 10px 8px", fontSize: 12, lineHeight: 1.6 }}>
                <div style={{ color: "var(--m-fg-1)", paddingLeft: 0 }}># Problem</div>
                <div style={{ color: "var(--m-fg-1)", paddingLeft: 0 }}># Proposal</div>
                <div style={{ color: "var(--m-fg-2)", paddingLeft: 12, fontSize: 11.5 }}>↳ rotation is non-trivial</div>
                <div style={{ color: "var(--m-fg-1)", paddingLeft: 0, position: "relative" }}>
                  <span style={{ position: "absolute", left: -10, top: 4, bottom: 4, width: 2, background: "var(--m-vein)", borderRadius: 2 }}/>
                  # Risk &amp; rollout
                </div>
              </div>

              <SideHead action={<span className="m-kbd">4</span>}>backlinks</SideHead>
              <div style={{ padding: "0 10px", display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                {[
                  { name: "oncall-pager.html", folder: "20 · runbooks", ctx: "see <a>auth-service-v2.html#problem</a> — token issuance is the proximate cause for…" },
                  { name: "rate-limiter-redesign.html", folder: "10 · specs", ctx: "we'll need a kill-switch coordinated with the <a>auth-service-v2.html</a> rollout in week 3…" },
                  { name: "q3-roadmap.html", folder: "00 · inbox", ctx: "depends on <a>auth-service-v2.html</a> shipping by end of July. risk: HIGH." },
                  { name: "@lin.chen.html", folder: "30 · people", ctx: "currently owns: <a>auth-service-v2.html</a>, <a>token-rotation.html</a>…" },
                ].map((bl, i) => (
                  <div key={i} style={{
                    padding: "8px 10px",
                    background: "var(--m-bg-2)", borderRadius: 6,
                    border: "1px solid var(--m-line-soft)",
                  }}>
                    <div style={{ fontFamily: "var(--f-mono)", fontSize: 11.5, color: "var(--m-fg)", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "var(--c-cyan)", fontFamily: "var(--f-mono)", fontSize: 9, fontWeight: 600 }}>&lt;/&gt;</span>
                      {bl.name}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--m-fg-3)", marginTop: 1 }}>{bl.folder}</div>
                    <div style={{ fontSize: 11.5, color: "var(--m-fg-2)", marginTop: 6, lineHeight: 1.45 }}
                      dangerouslySetInnerHTML={{ __html: bl.ctx.replace(/<a>(.*?)<\/a>/g, '<span style="color:var(--m-vein);text-decoration:underline;text-decoration-color:var(--m-vein-dim);">$1</span>') }} />
                  </div>
                ))}
              </div>

              <SideHead action={<span className="m-kbd">3</span>}>also references</SideHead>
              <div style={{ padding: "0 10px 14px", display: "flex", flexWrap: "wrap", gap: 4 }}>
                {["session-store.html", "redis-cluster.html", "paseto-v4.html"].map(s => (
                  <span key={s} className="m-chip mono" style={{ color: "var(--m-fg-1)" }}>{s}</span>
                ))}
              </div>

              <div style={{ flex: 1 }}/>

              {/* Property inspector for current block */}
              <div style={{ borderTop: "1px solid var(--m-line-soft)", padding: "10px 12px", background: "var(--m-bg)" }}>
                <div style={{ fontSize: 10.5, color: "var(--m-fg-3)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                  block · <span style={{ color: "var(--m-vein)" }}>&lt;m-callout&gt;</span>
                </div>
                <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "auto 1fr", gap: "5px 10px", fontSize: 11.5, fontFamily: "var(--f-mono)" }}>
                  <span style={{ color: "var(--m-fg-3)" }}>kind</span>
                  <span style={{ color: "var(--c-green)" }}>"warn"</span>
                  <span style={{ color: "var(--m-fg-3)" }}>title</span>
                  <span style={{ color: "var(--c-green)" }}>"rotation is non-trivial"</span>
                  <span style={{ color: "var(--m-fg-3)" }}>defined</span>
                  <span style={{ color: "var(--m-vein)" }}>components/callout.html</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status bar */}
          <StatusBarA />
        </div>
      </MarbleFrame>

      {showPalette && <CommandPalette onClose={() => setShowPalette(false)} />}
    </div>
  );
}

function isUnderOpen(rows, i) {
  // walk up to find parent folder; respect open=false
  const d = rows[i].depth;
  for (let j = i - 1; j >= 0; j--) {
    if (rows[j].depth < d && rows[j].type === "folder") {
      return rows[j].open && (rows[j].depth === 0 ? true : isUnderOpen(rows, j));
    }
  }
  return true;
}

function StatusBarA() {
  return (
    <div style={{
      height: 22, flex: "0 0 22px",
      background: "var(--m-bg-inset)", borderTop: "1px solid var(--m-line-soft)",
      display: "flex", alignItems: "center", padding: "0 10px",
      fontSize: 10.5, fontFamily: "var(--f-mono)", color: "var(--m-fg-3)", gap: 16,
    }}>
      <span style={{ color: "var(--c-green)" }}>● html valid</span>
      <span>line 47, col 12</span>
      <span>html · utf-8 · lf</span>
      <span style={{ flex: 1 }} />
      <span>schema: rfc.html</span>
      <span>scope: note-local</span>
      <span style={{ color: "var(--m-vein)" }}>marble 0.8.4</span>
    </div>
  );
}

function pStyle() {
  return {
    fontSize: 14.5, lineHeight: 1.65,
    fontFamily: "var(--f-text)",
    color: "var(--m-fg)",
    margin: "8px 0",
    textWrap: "pretty",
  };
}
function hStyle() {
  return {
    fontSize: 18, fontWeight: 600,
    marginTop: 24, marginBottom: 4,
    letterSpacing: "-0.01em",
  };
}
function inlineCodeStyle() {
  return {
    fontFamily: "var(--f-mono)", fontSize: "0.88em",
    background: "var(--m-bg-2)",
    color: "var(--c-cyan)",
    padding: "1px 6px", borderRadius: 4,
    border: "1px solid var(--m-line-soft)",
  };
}
function linkStyle() {
  return {
    color: "var(--m-vein)",
    textDecoration: "underline",
    textDecorationColor: "var(--m-vein-dim)",
    textUnderlineOffset: "3px",
    cursor: "pointer",
  };
}

// Command palette overlay
function CommandPalette({ onClose }) {
  const items = [
    { i: I.plus,   t: "New note from schema…",          k: "⌘N" },
    { i: I.code,   t: "Toggle block source view",       k: "⌘E", hot: true },
    { i: I.comp,   t: "Insert component › <metric>",    k: "/" },
    { i: I.comp,   t: "Insert component › <m-callout>", k: "/" },
    { i: I.link,   t: "Insert link to…",                k: "⌘L" },
    { i: I.ai,     t: "Ask Marble AI about this block", k: "⌘J" },
    { i: I.graph,  t: "Open graph view",                k: "⌘G" },
    { i: I.settings,t: "Vault settings",                k: "⌘," },
  ];
  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.45)",
      display: "flex", justifyContent: "center", alignItems: "flex-start",
      paddingTop: 120,
    }}>
      <div onClick={e => e.stopPropagation()} className="marble" style={{
        width: 520, background: "var(--m-bg-1)",
        border: "1px solid var(--m-line)",
        borderRadius: 10, overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--m-line-soft)" }}>
          <span style={{ color: "var(--m-fg-3)" }}>{I.search}</span>
          <input autoFocus defaultValue="edit as html"
            style={{ flex: 1, background: "none", border: 0, outline: 0, color: "var(--m-fg)", fontSize: 14, fontFamily: "var(--f-ui)" }} />
          <span className="m-kbd">esc</span>
        </div>
        {items.map((it, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 14px", fontSize: 13,
            background: it.hot ? "var(--m-bg-2)" : "transparent",
            color: it.hot ? "var(--m-fg)" : "var(--m-fg-1)",
            borderLeft: it.hot ? "2px solid var(--m-vein)" : "2px solid transparent",
            cursor: "pointer",
          }}>
            <span style={{ color: it.hot ? "var(--m-vein)" : "var(--m-fg-3)" }}>{it.i}</span>
            <span style={{ flex: 1 }}>{it.t}</span>
            <span className="m-kbd">{it.k}</span>
          </div>
        ))}
        <div style={{ padding: "8px 14px", borderTop: "1px solid var(--m-line-soft)", fontSize: 11, color: "var(--m-fg-3)", fontFamily: "var(--f-mono)", display: "flex", justifyContent: "space-between" }}>
          <span>↑↓ navigate · ↵ run</span>
          <span>312 commands · 14 components</span>
        </div>
      </div>
    </div>
  );
}

window.ArtboardEditor = ArtboardEditor;
