// artboard-reactive.jsx — Direction C: The Reactive Vault
// Edges aren't just links — they're data flow. Edit a <data key="…"/> in
// one note, every <query/> in the vault recomputes. Markdown can't.

const { useState: useStateC, useEffect: useEffectC } = React;

// Hand-placed graph layout (viewBox 1000 × 540)
const NODES = [
  // central data hub
  { id: "metrics",  x: 500, y: 270, kind: "data",    label: "services/metrics.html",         tag: "data",       hot: true },
  { id: "people",   x: 320, y: 130, kind: "data",    label: "people/team.html",              tag: "data" },
  { id: "slo",      x: 700, y: 150, kind: "data",    label: "services/slos.html",            tag: "data" },
  // specs
  { id: "auth",     x: 200, y: 290, kind: "spec",    label: "specs/auth-service-v2.html",    tag: "spec" },
  { id: "rl",       x: 240, y: 410, kind: "spec",    label: "specs/rate-limiter-redesign",   tag: "spec" },
  { id: "bill",     x: 380, y: 470, kind: "spec",    label: "specs/billing-rewrite.html",    tag: "spec" },
  // dashboards & runbooks
  { id: "dash",     x: 770, y: 310, kind: "dash",    label: "dashboards/q3-status.html",     tag: "dash" },
  { id: "pager",    x: 700, y: 430, kind: "runbook", label: "runbooks/oncall-pager.html",    tag: "runbook" },
  { id: "kafka",    x: 870, y: 230, kind: "runbook", label: "runbooks/kafka-lag-spike.html", tag: "runbook" },
  { id: "wbr",      x: 580, y: 60,  kind: "doc",     label: "wbr/2026-w19.html",             tag: "doc" },
  // components (sources of truth)
  { id: "metric",   x: 100, y: 200, kind: "comp",    label: "components/metric.html",         tag: "component" },
  { id: "kpi",      x: 120, y: 380, kind: "comp",    label: "components/kpi.html",            tag: "component" },
];

// Edges. type: link (undirected gray) or data (directed gold).
const EDGES = [
  // data flow OUT from metrics.html (this is the magic)
  { from: "metrics", to: "auth",  type: "data", key: "auth.token.p99" },
  { from: "metrics", to: "dash",  type: "data", key: "*" },
  { from: "metrics", to: "pager", type: "data", key: "auth.token.slo" },
  { from: "metrics", to: "kafka", type: "data", key: "kafka.consumer.lag" },
  { from: "metrics", to: "wbr",   type: "data", key: "*" },
  { from: "metrics", to: "bill",  type: "data", key: "billing.stripe.success_rate" },
  // data from slo
  { from: "slo",     to: "pager", type: "data", key: "thresholds" },
  { from: "slo",     to: "dash",  type: "data", key: "thresholds" },
  // people data
  { from: "people",  to: "auth",  type: "data", key: "owner" },
  { from: "people",  to: "wbr",   type: "data", key: "team" },
  // component usage
  { from: "metric",  to: "auth",  type: "use" },
  { from: "metric",  to: "dash",  type: "use" },
  { from: "metric",  to: "wbr",   type: "use" },
  { from: "kpi",     to: "dash",  type: "use" },
  { from: "kpi",     to: "wbr",   type: "use" },
  // plain links
  { from: "auth", to: "rl",    type: "link" },
  { from: "auth", to: "pager", type: "link" },
  { from: "rl",   to: "bill",  type: "link" },
  { from: "pager", to: "kafka", type: "link" },
];

const NODE_COLORS = {
  data:    "var(--m-vein)",
  spec:    "var(--c-blue)",
  dash:    "var(--c-magenta)",
  runbook: "var(--c-red)",
  doc:     "var(--c-violet)",
  comp:    "var(--c-cyan)",
};

function ArtboardReactive() {
  const [p99, setP99] = useStateC(87);
  const [selected, setSelected] = useStateC("metrics");
  const [pulse, setPulse] = useStateC(0);

  // animate pulse when p99 changes
  useEffectC(() => {
    setPulse(Date.now());
  }, [p99]);

  const sloOk = p99 <= 80;
  const budget = Math.max(0, Math.round((1 - (p99 / 80)) * 100 + 50));
  const status = p99 <= 70 ? "ok" : p99 <= 85 ? "warn" : "burn";

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <MarbleFrame
        title="acme-engineering / vault › data graph"
        subtitle="reactive · 312 nodes · 1,847 edges"
        right={<>
          <span className="m-chip mono" style={{ color: "var(--m-vein)" }}>● live · 12 ms</span>
          <button className="frame-btn">{I.bolt}</button>
          <button className="frame-btn">{I.ai}</button>
        </>}>
        <Ribbon active="data"/>

        {/* Sidebar: data layer + filters */}
        <div style={{
          width: 240, flex: "0 0 240px",
          background: "var(--m-bg-1)",
          borderRight: "1px solid var(--m-line-soft)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "12px 14px",
            borderBottom: "1px solid var(--m-line-soft)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--m-vein)", display: "flex" }}>{I.data}</span>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>data layer</div>
            </div>
            <div style={{ fontSize: 10.5, color: "var(--m-fg-3)", fontFamily: "var(--f-mono)", marginTop: 2 }}>
              every note can declare &lt;data/&gt; and read &lt;query/&gt;
            </div>
          </div>

          <SideHead action={<span className="m-kbd">⌘F</span>}>edge types</SideHead>
          <div style={{ padding: "0 10px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
            <EdgeLegend swatch={<line x1="2" y1="6" x2="18" y2="6" stroke="var(--m-vein)" strokeWidth="2" markerEnd="url(#arrowSb)"/>}
              label="data flow" count={47} color="var(--m-vein)"/>
            <EdgeLegend swatch={<line x1="2" y1="6" x2="18" y2="6" stroke="var(--c-cyan)" strokeWidth="2" strokeDasharray="3 2"/>}
              label="component use" count={213} color="var(--c-cyan)"/>
            <EdgeLegend swatch={<line x1="2" y1="6" x2="18" y2="6" stroke="var(--m-fg-3)" strokeWidth="1.4"/>}
              label="plain link" count={1587} color="var(--m-fg-3)"/>
          </div>

          <SideHead action={<span className="m-kbd">/</span>}>data sources · 14</SideHead>
          <div style={{ flex: 1, overflow: "auto", padding: "0 6px" }}>
            {[
              { id: "metrics",  name: "services/metrics.html",   keys: 32, hot: true, active: selected === "metrics" },
              { id: "slo",      name: "services/slos.html",       keys: 8,             active: selected === "slo" },
              { id: "people",   name: "people/team.html",         keys: 47,            active: selected === "people" },
              { id: "okrs",     name: "okrs/q3.html",             keys: 12 },
              { id: "incidents",name: "incidents/log.html",       keys: 124 },
              { id: "budget",   name: "finance/run-rate.html",    keys: 6 },
              { id: "depls",    name: "deploys/timeline.html",    keys: 91 },
              { id: "exp",      name: "experiments/active.html",  keys: 4 },
              { id: "sec",      name: "security/findings.html",   keys: 17 },
            ].map((d, i) => (
              <div key={i} onClick={() => d.id && setSelected(d.id)} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 8px", marginBottom: 1, borderRadius: 4, cursor: d.id ? "pointer" : "default",
                background: d.active ? "var(--m-bg-2)" : "transparent",
                position: "relative",
              }}
              onMouseOver={e => { if (!d.active && d.id) e.currentTarget.style.background = "oklch(0.20 0.006 260)"; }}
              onMouseOut={e => { if (!d.active) e.currentTarget.style.background = "transparent"; }}>
                {d.active && <span style={{ position: "absolute", left: -6, top: 4, bottom: 4, width: 2, background: "var(--m-vein)", borderRadius: 2 }}/>}
                <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: d.hot ? "var(--m-vein)" : "var(--m-fg-3)" }}>●</span>
                <span style={{ fontFamily: "var(--f-mono)", fontSize: 11.5, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: d.active ? "var(--m-fg)" : "var(--m-fg-1)" }}>{d.name}</span>
                <span style={{ fontSize: 10, color: "var(--m-fg-3)", fontFamily: "var(--f-mono)" }}>{d.keys}k</span>
              </div>
            ))}
          </div>

          <div style={{ padding: "10px 12px", borderTop: "1px solid var(--m-line-soft)", fontFamily: "var(--f-mono)", fontSize: 10.5, color: "var(--m-fg-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>watchers</span><span style={{ color: "var(--m-fg-1)" }}>active</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}><span>last recompute</span><span style={{ color: "var(--c-green)" }}>12 ms ago</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}><span>fan-out, this node</span><span style={{ color: "var(--m-vein)" }}>6 consumers</span></div>
          </div>
        </div>

        {/* Center: graph view */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* graph toolbar */}
          <div style={{
            display: "flex", alignItems: "center",
            padding: "0 16px", height: 36,
            background: "var(--m-bg)",
            borderBottom: "1px solid var(--m-line-soft)", gap: 10,
          }}>
            <span style={{ fontSize: 12, color: "var(--m-fg-1)", fontWeight: 500 }}>graph</span>
            <span style={{ fontSize: 11, color: "var(--m-fg-3)", fontFamily: "var(--f-mono)" }}>· focus: <span style={{ color: "var(--m-vein)" }}>{NODES.find(n => n.id === selected)?.label}</span></span>
            <span style={{ flex: 1 }}/>
            <span className="m-chip mono">layout · force</span>
            <span className="m-chip mono">depth · 2</span>
            <span className="m-chip mono" style={{ color: "var(--m-vein)" }}>filter · data flow</span>
          </div>

          {/* the graph */}
          <div className="marble-vein-bg" style={{ flex: 1, position: "relative", minHeight: 0 }}>
            <svg viewBox="0 0 1000 540" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", display: "block" }}>
              <defs>
                <marker id="arrowSb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 Z" fill="var(--m-vein)" />
                </marker>
                <marker id="arrowGold" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 Z" fill="var(--m-vein)" />
                </marker>
                <marker id="arrowCyan" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 Z" fill="var(--c-cyan)" />
                </marker>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* Edges */}
              {EDGES.map((e, i) => {
                const a = NODES.find(n => n.id === e.from);
                const b = NODES.find(n => n.id === e.to);
                if (!a || !b) return null;
                const hot = e.type === "data" && (e.from === selected || e.to === selected);
                const stroke = e.type === "data" ? "var(--m-vein)"
                  : e.type === "use" ? "var(--c-cyan)" : "var(--m-fg-3)";
                const opacity = (selected && e.type === "data" && (e.from === selected || e.to === selected)) ? 1
                  : e.type === "data" ? 0.5 : 0.18;
                const w = e.type === "data" ? (hot ? 2.4 : 1.6) : e.type === "use" ? 1.4 : 1.0;
                const dash = e.type === "use" ? "5 3" : null;
                const marker = e.type === "data" ? "url(#arrowGold)" : e.type === "use" ? "url(#arrowCyan)" : null;
                // pull endpoint short of node radius
                const dx = b.x - a.x, dy = b.y - a.y;
                const len = Math.hypot(dx, dy);
                const r = 22;
                const x1 = a.x + (dx / len) * r, y1 = a.y + (dy / len) * r;
                const x2 = b.x - (dx / len) * r, y2 = b.y - (dy / len) * r;
                return (
                  <g key={i}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={stroke} strokeWidth={w} strokeDasharray={dash}
                      opacity={opacity} markerEnd={marker}/>
                    {/* pulse along the edge when source is selected and edge is data */}
                    {hot && (
                      <circle r="3" fill="var(--m-vein)">
                        <animateMotion key={pulse} dur="1.2s" repeatCount="indefinite"
                          path={`M${x1},${y1} L${x2},${y2}`}/>
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
              {NODES.map(n => {
                const isSel = n.id === selected;
                const isData = n.kind === "data";
                const color = NODE_COLORS[n.kind] || "var(--m-fg-2)";
                return (
                  <g key={n.id} transform={`translate(${n.x},${n.y})`} onClick={() => setSelected(n.id)} style={{ cursor: "pointer" }}>
                    {isSel && <circle r="30" fill="none" stroke={color} strokeWidth="1.2" strokeDasharray="2 3" opacity="0.6">
                      <animate attributeName="r" from="22" to="34" dur="2s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" from="0.7" to="0" dur="2s" repeatCount="indefinite"/>
                    </circle>}
                    <circle r={isSel ? 14 : isData ? 11 : 8}
                      fill={isData ? "var(--m-bg)" : "var(--m-bg-2)"}
                      stroke={color}
                      strokeWidth={isSel ? 2.2 : 1.4}
                      filter={isSel ? "url(#glow)" : undefined}/>
                    {isData && <circle r={isSel ? 6 : 4.5} fill={color}/>}
                    <text x="0" y={isSel ? 32 : 24}
                      textAnchor="middle"
                      fontFamily="var(--f-mono)"
                      fontSize={isSel ? 11.5 : 10}
                      fontWeight={isSel ? 500 : 400}
                      fill={isSel ? "var(--m-fg)" : "var(--m-fg-2)"}>
                      {n.label.split("/").pop()}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Floating zoom controls */}
            <div style={{
              position: "absolute", right: 14, top: 14,
              display: "flex", flexDirection: "column", gap: 4,
              background: "var(--m-bg-1)", border: "1px solid var(--m-line)",
              borderRadius: 6, padding: 4,
            }}>
              {["+", "−", "⊙"].map(c => (
                <button key={c} style={{
                  width: 22, height: 22, borderRadius: 4,
                  fontFamily: "var(--f-mono)", color: "var(--m-fg-2)",
                  background: "transparent",
                }}>{c}</button>
              ))}
            </div>
          </div>

          {/* Bottom: the live data inspector for selected node */}
          <div style={{
            height: 250, flex: "0 0 250px",
            background: "var(--m-bg-1)",
            borderTop: "1px solid var(--m-line-soft)",
            display: "flex", overflow: "hidden",
          }}>
            {/* left: source <data> declarations */}
            <div style={{ width: 380, flex: "0 0 380px", borderRight: "1px solid var(--m-line-soft)", display: "flex", flexDirection: "column" }}>
              <div style={{
                padding: "8px 14px", display: "flex", alignItems: "center", gap: 8,
                background: "var(--m-bg-inset)", borderBottom: "1px solid var(--m-line-soft)",
                fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--m-fg-3)",
              }}>
                <span style={{ color: "var(--m-vein)" }}>●</span>
                <span>services/metrics.html</span>
                <span style={{ flex: 1 }}/>
                <span className="m-chip mono" style={{ color: "var(--m-vein)" }}>source of truth</span>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: "14px 18px", background: "var(--m-bg-inset)" }}>
                <pre style={{
                  margin: 0, fontFamily: "var(--f-mono)", fontSize: 12, lineHeight: 1.65,
                  color: "var(--m-fg-1)",
                }}>
                  <span style={{ color: "var(--m-fg-3)" }}>{"<"}</span>
                  <span style={{ color: "var(--c-magenta)" }}>data</span>{" "}
                  <span style={{ color: "var(--c-cyan)" }}>key</span>=<span style={{ color: "var(--c-green)" }}>"auth.token.p99"</span>{"\n      "}
                  <span style={{ color: "var(--c-cyan)" }}>value</span>=<span style={{ color: "var(--c-green)" }}>"{p99}"</span>{" "}
                  <span style={{ color: "var(--c-cyan)" }}>unit</span>=<span style={{ color: "var(--c-green)" }}>"ms"</span>{" "}
                  <span style={{ color: "var(--m-fg-3)" }}>/{">"}</span>{"\n\n"}
                  <span style={{ color: "var(--m-fg-3)" }}>{"<"}</span>
                  <span style={{ color: "var(--c-magenta)" }}>data</span>{" "}
                  <span style={{ color: "var(--c-cyan)" }}>key</span>=<span style={{ color: "var(--c-green)" }}>"auth.token.slo"</span>{" "}
                  <span style={{ color: "var(--c-cyan)" }}>value</span>=<span style={{ color: "var(--c-green)" }}>"80"</span>{" "}
                  <span style={{ color: "var(--m-fg-3)" }}>/{">"}</span>{"\n"}
                  <span style={{ color: "var(--m-fg-3)" }}>{"<"}</span>
                  <span style={{ color: "var(--c-magenta)" }}>data</span>{" "}
                  <span style={{ color: "var(--c-cyan)" }}>key</span>=<span style={{ color: "var(--c-green)" }}>"auth.token.budget"</span>{" "}
                  <span style={{ color: "var(--c-cyan)" }}>value</span>=<span style={{ color: "var(--c-green)" }}>"{(budget/100).toFixed(2)}"</span>{" "}
                  <span style={{ color: "var(--m-fg-3)" }}>/{">"}</span>{"\n\n"}
                  <span style={{ color: "var(--m-fg-3)" }}>{"<"}</span>
                  <span style={{ color: "var(--c-magenta)" }}>data</span>{" "}
                  <span style={{ color: "var(--c-cyan)" }}>key</span>=<span style={{ color: "var(--c-green)" }}>"kafka.consumer.lag"</span>{" "}
                  <span style={{ color: "var(--c-cyan)" }}>value</span>=<span style={{ color: "var(--c-green)" }}>"24"</span>{" "}
                  <span style={{ color: "var(--c-cyan)" }}>unit</span>=<span style={{ color: "var(--c-green)" }}>"s"</span>{" "}
                  <span style={{ color: "var(--m-fg-3)" }}>/{">"}</span>{"\n\n"}
                  <span style={{ color: "var(--m-fg-3)" }}>{"<"}</span>
                  <span style={{ color: "var(--c-magenta)" }}>data</span>{" "}
                  <span style={{ color: "var(--c-cyan)" }}>key</span>=<span style={{ color: "var(--c-green)" }}>"billing.stripe.success_rate"</span>{"\n      "}
                  <span style={{ color: "var(--c-cyan)" }}>value</span>=<span style={{ color: "var(--c-green)" }}>"0.987"</span>{" "}
                  <span style={{ color: "var(--m-fg-3)" }}>/{">"}</span>{"\n"}
                </pre>
              </div>
            </div>

            {/* center: the live slider — drives every consumer in the vault */}
            <div style={{ flex: 1, padding: "14px 22px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="m-chip mono" style={{ color: "var(--m-vein)" }}>● live</span>
                <span style={{ fontSize: 11.5, color: "var(--m-fg-2)" }}>drag the slider — every <code style={{ color: "var(--c-cyan)", fontFamily: "var(--f-mono)" }}>&lt;query/&gt;</code> in the vault recomputes</span>
              </div>
              <div style={{
                display: "flex", alignItems: "baseline", gap: 14,
                fontFamily: "var(--f-mono)",
              }}>
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--m-fg-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>auth.token.p99</div>
                  <div style={{ fontSize: 32, fontWeight: 500, color: status === "burn" ? "var(--c-red)" : status === "warn" ? "var(--m-vein)" : "var(--c-green)" }}>
                    {p99}<span style={{ fontSize: 14, color: "var(--m-fg-3)", marginLeft: 4 }}>ms</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <input type="range" min="40" max="160" value={p99}
                    onChange={e => setP99(+e.target.value)}
                    style={{
                      width: "100%", accentColor: "var(--m-vein)",
                    }}/>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--m-fg-3)", marginTop: 2 }}>
                    <span>40 ms</span>
                    <span>SLO 80 ms</span>
                    <span>160 ms</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--m-fg-3)", fontFamily: "var(--f-mono)", marginTop: 4 }}>
                fan-out · <span style={{ color: "var(--m-fg-1)" }}>6 consumers updated</span> ·
                <span style={{ color: "var(--c-green)", marginLeft: 8 }}>● 12 ms p99 propagation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: live consumer previews */}
        <div style={{
          width: 282, flex: "0 0 282px",
          background: "var(--m-bg-1)",
          borderLeft: "1px solid var(--m-line-soft)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          <SideHead action={<span className="m-kbd">⌘L</span>}>consumers · live</SideHead>
          <div style={{ flex: 1, overflow: "auto", padding: "4px 12px 12px", display: "flex", flexDirection: "column", gap: 10 }}>

            <ConsumerCard
              note="specs/auth-service-v2.html"
              query={`<query from="services/metrics.html" key="auth.token.p99" />`}
              value={`${p99} ms`}
              valueColor={status === "burn" ? "var(--c-red)" : status === "warn" ? "var(--m-vein)" : "var(--c-green)"}
              annotation={status === "burn" ? "↑ 38% wow · burning budget" : status === "warn" ? "above SLO · trending" : "within SLO"}
            />

            <ConsumerCard
              note="runbooks/oncall-pager.html"
              query={`<query from="services/metrics.html" key="auth.token.p99" />\n<query from="services/slos.html" key="threshold" />`}
              value={p99 > 80 ? "PAGE" : "OK"}
              valueColor={p99 > 80 ? "var(--c-red)" : "var(--c-green)"}
              annotation={p99 > 80 ? `breach by ${p99 - 80} ms · auto-pages @lin.chen` : "no breach · paging idle"}
            />

            <ConsumerCard
              note="dashboards/q3-status.html"
              query={`<query from="services/metrics.html" key="auth.token.budget" />`}
              value={`${budget}%`}
              valueColor={budget < 40 ? "var(--c-red)" : budget < 70 ? "var(--m-vein)" : "var(--c-green)"}
              annotation={budget < 40 ? "↘ error budget exhausted" : "remaining error budget"}
              bar={budget}
            />

            <ConsumerCard
              note="wbr/2026-w19.html"
              query={`<query from="services/metrics.html" key="*" /> · pull-through table`}
              value={`auth · ${status}`}
              valueColor={status === "burn" ? "var(--c-red)" : status === "warn" ? "var(--m-vein)" : "var(--c-green)"}
              annotation="referenced in Monday's WBR table cell"
            />
          </div>

          <div style={{
            margin: 12, padding: "12px 14px",
            border: "1px solid var(--m-line)",
            borderLeft: "3px solid var(--m-vein)",
            borderRadius: 6,
            background: "oklch(0.20 0.025 78 / 0.4)",
            fontSize: 11.5, lineHeight: 1.5, color: "var(--m-fg-1)",
          }}>
            <div style={{ fontSize: 10.5, color: "var(--m-vein)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 4 }}>
              why HTML
            </div>
            Markdown has no schema. <code style={{ color: "var(--c-cyan)", fontFamily: "var(--f-mono)" }}>&lt;data/&gt;</code> and{" "}
            <code style={{ color: "var(--c-cyan)", fontFamily: "var(--f-mono)" }}>&lt;query/&gt;</code> turn the vault into a lightweight reactive DB —
            same file format, no plugin.
          </div>
        </div>
      </MarbleFrame>
    </div>
  );
}

function EdgeLegend({ swatch, label, count, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", borderRadius: 4 }}>
      <svg width="20" height="12" viewBox="0 0 20 12" style={{ flex: "0 0 20px" }}>
        <defs>
          <marker id="arrowSb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 Z" fill="var(--m-vein)" />
          </marker>
        </defs>
        {swatch}
      </svg>
      <span style={{ flex: 1, fontSize: 11.5, color: "var(--m-fg-1)", fontFamily: "var(--f-mono)" }}>{label}</span>
      <span style={{ fontSize: 10.5, color: "var(--m-fg-3)", fontFamily: "var(--f-mono)" }}>{count}</span>
    </div>
  );
}

function ConsumerCard({ note, query, value, valueColor, annotation, bar }) {
  return (
    <div style={{
      padding: "10px 12px",
      borderRadius: 6,
      background: "var(--m-bg-2)",
      border: "1px solid var(--m-line-soft)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: valueColor, opacity: 0.5 }}/>
      <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--m-fg-1)", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "var(--c-cyan)", fontSize: 9, fontWeight: 600 }}>&lt;/&gt;</span>
        {note}
      </div>
      <pre style={{
        margin: "6px 0 0", fontFamily: "var(--f-mono)", fontSize: 10.5,
        color: "var(--m-fg-3)", whiteSpace: "pre-wrap",
        lineHeight: 1.4,
      }}>{query}</pre>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span style={{ fontFamily: "var(--f-mono)", fontSize: 20, fontWeight: 600, color: valueColor }}>{value}</span>
        <span style={{ fontSize: 11, color: "var(--m-fg-2)", textWrap: "pretty" }}>{annotation}</span>
      </div>
      {bar !== undefined && (
        <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: "var(--m-bg-inset)", overflow: "hidden" }}>
          <div style={{ width: `${bar}%`, height: "100%", background: valueColor, transition: "width .2s" }}/>
        </div>
      )}
    </div>
  );
}

window.ArtboardReactive = ArtboardReactive;
