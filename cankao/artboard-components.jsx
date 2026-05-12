// artboard-components.jsx — Direction B: Components as first-class
// "Drop a .html file in components/, every note can use it." The pitch:
// vendor a Web Component once, the whole vault picks it up. No plugin
// market, no manifest, no rebuild.

const { useState: useStateB } = React;

const COMPONENT_FILE_SRC =
`<template id="api-status">
  <style>
    :host { display: inline-flex; align-items: center; gap: 8px;
            font: 500 12px/1 "JetBrains Mono", monospace;
            padding: 4px 10px 4px 8px; border-radius: 999px;
            border: 1px solid var(--line, #2a2a2a); }
    .dot { width: 8px; height: 8px; border-radius: 50%;
           background: var(--c, #888); box-shadow: 0 0 8px var(--c, #888); }
    :host([health="up"])       { --c: oklch(0.76 0.11 150) }
    :host([health="degraded"]) { --c: oklch(0.80 0.10 78)  }
    :host([health="down"])     { --c: oklch(0.72 0.13 25)  }
    .ms { color: rgba(200,200,200,0.55); }
  </style>
  <span class="dot"></span>
  <span class="name"><slot></slot></span>
  <span class="ms">·</span>
  <span class="ms"><slot name="latency"></slot></span>
</template>

<script type="module">
  class ApiStatus extends HTMLElement {
    static observedAttributes = ["health", "latency"];
    connectedCallback() {
      const t = document.getElementById("api-status");
      this.attachShadow({ mode: "open" }).appendChild(t.content.cloneNode(true));
      this.poll();
    }
    async poll() {
      // marble.query() is the vault's read-only data hook
      const v = await marble.query(this.dataset.source);
      this.toggleAttribute("health", v.up ? "up" : "down");
    }
  }
  customElements.define("api-status", ApiStatus);
</script>`;

const USAGES = [
  { note: "10 · specs / auth-service-v2.html",     line: 47,  attrs: { health: "degraded", latency: "87 ms" }, label: "auth-svc"        },
  { note: "20 · runbooks / oncall-pager.html",     line: 12,  attrs: { health: "up",       latency: "23 ms" }, label: "session-store"   },
  { note: "20 · runbooks / postgres-failover.html", line: 31, attrs: { health: "up",       latency: "8 ms"  }, label: "pg-primary"      },
  { note: "10 · specs / billing-rewrite.html",     line: 88,  attrs: { health: "down",     latency: "n/a"   }, label: "stripe-webhook"  },
  { note: "00 · inbox / status-page.html",         line: 4,   attrs: { health: "up",       latency: "41 ms" }, label: "cdn-edge"        },
  { note: "30 · people / @lin.chen.html",          line: 22,  attrs: { health: "up",       latency: "12 ms" }, label: "search-api"      },
  { note: "10 · specs / rate-limiter-redesign.html", line: 19, attrs: { health: "degraded", latency: "62 ms" }, label: "token-bucket" },
];

function ApiStatusPreview({ attrs, label, big }) {
  const color = attrs.health === "up" ? "var(--c-green)"
               : attrs.health === "degraded" ? "var(--m-vein)" : "var(--c-red)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: big ? "8px 16px 8px 12px" : "4px 10px 4px 8px",
      borderRadius: 999,
      border: "1px solid var(--m-line)",
      background: big ? "var(--m-bg-2)" : "var(--m-bg-1)",
      fontFamily: "var(--f-mono)",
      fontSize: big ? 13 : 11.5, fontWeight: 500,
      color: "var(--m-fg-1)",
    }}>
      <span style={{ width: big ? 10 : 8, height: big ? 10 : 8, borderRadius: "50%", background: color, boxShadow: `0 0 ${big ? 12 : 8}px ${color}` }}/>
      <span>{label}</span>
      <span style={{ color: "var(--m-fg-3)" }}>·</span>
      <span style={{ color: "var(--m-fg-3)" }}>{attrs.latency}</span>
    </span>
  );
}

// Component files in components/
const COMP_FILES = [
  { name: "api-status.html",      label: "<api-status>",      uses: 7,  active: true },
  { name: "metric.html",          label: "<metric>",          uses: 14 },
  { name: "decision.html",        label: "<decision>",        uses: 31 },
  { name: "callout.html",         label: "<m-callout>",       uses: 84 },
  { name: "diagram-flow.html",    label: "<diagram-flow>",    uses: 9  },
  { name: "flashcard.html",       label: "<flashcard>",       uses: 162, dim: true },
  { name: "table.html",           label: "<m-table>",         uses: 23 },
  { name: "kpi.html",             label: "<kpi>",             uses: 18 },
  { name: "person.html",          label: "<person>",          uses: 47 },
  { name: "code-embed.html",      label: "<code-embed>",      uses: 12 },
  { name: "graph-snapshot.html",  label: "<graph-snapshot>",  uses: 5  },
  { name: "todo.html",            label: "<todo>",            uses: 211 },
  { name: "spec-status.html",     label: "<spec-status>",     uses: 8  },
  { name: "ts-timeline.html",     label: "<ts-timeline>",     uses: 3, dim: true },
];

// Drop zone for new components
function DropZone() {
  const [hot, setHot] = useStateB(false);
  return (
    <div onMouseEnter={() => setHot(true)} onMouseLeave={() => setHot(false)}
      style={{
        margin: "10px 10px",
        padding: "14px 12px",
        border: `1px dashed ${hot ? "var(--m-vein)" : "var(--m-line)"}`,
        borderRadius: 8,
        background: hot ? "oklch(0.22 0.04 78 / 0.18)" : "transparent",
        textAlign: "center",
        fontSize: 11.5, fontFamily: "var(--f-mono)",
        color: hot ? "var(--m-vein)" : "var(--m-fg-3)",
        transition: "all .15s",
        cursor: "pointer",
    }}>
      <div style={{ fontSize: 14, marginBottom: 4 }}>↓</div>
      drop .html into components/<br/>
      <span style={{ color: "var(--m-fg-3)", fontSize: 10.5 }}>or paste from URL · ⌘V</span>
    </div>
  );
}

function ArtboardComponents() {
  const [view, setView] = useStateB("split"); // split | template | usages
  const [selected, setSelected] = useStateB("api-status.html");
  const [hoverUsage, setHoverUsage] = useStateB(null);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <MarbleFrame
        title="acme-engineering / components / api-status.html"
        subtitle="14 components · 634 instantiations across vault"
        right={<>
          <span className="m-chip mono" style={{ color: "var(--c-cyan)" }}>web component</span>
          <button className="frame-btn">{I.bolt}</button>
          <button className="frame-btn">{I.ai}</button>
        </>}>
        <Ribbon active="comp"/>

        {/* Sidebar: components folder + drop zone */}
        <div style={{
          width: 240, flex: "0 0 240px",
          background: "var(--m-bg-1)",
          borderRight: "1px solid var(--m-line-soft)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "12px 12px 10px",
            display: "flex", alignItems: "center", gap: 8,
            borderBottom: "1px solid var(--m-line-soft)",
          }}>
            <span style={{ color: "var(--c-cyan)", display: "flex" }}>{I.comp}</span>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>components/</div>
              <div style={{ fontSize: 10.5, color: "var(--m-fg-3)", fontFamily: "var(--f-mono)" }}>vault-local · auto-loaded</div>
            </div>
          </div>

          <SideHead action={<span className="m-kbd">/</span>}>installed · 14</SideHead>
          <div style={{ flex: 1, overflow: "auto", padding: "0 6px" }}>
            {COMP_FILES.map((c, i) => {
              const active = c.name === selected;
              return (
                <div key={i} onClick={() => setSelected(c.name)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 8px", borderRadius: 4, cursor: "pointer",
                  background: active ? "var(--m-bg-2)" : "transparent",
                  color: c.dim ? "var(--m-fg-3)" : "var(--m-fg-1)",
                  position: "relative", marginBottom: 1,
                }}
                onMouseOver={e => { if (!active) e.currentTarget.style.background = "oklch(0.20 0.006 260)"; }}
                onMouseOut={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                  {active && <span style={{ position: "absolute", left: -6, top: 4, bottom: 4, width: 2, background: "var(--m-vein)", borderRadius: 2 }}/>}
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 11.5, color: active ? "var(--c-cyan)" : (c.dim ? "var(--m-fg-3)" : "var(--c-cyan)"), flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.label}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--m-fg-3)", fontFamily: "var(--f-mono)" }}>×{c.uses}</span>
                </div>
              );
            })}
          </div>

          <DropZone/>

          <div style={{ padding: "10px 12px", borderTop: "1px solid var(--m-line-soft)", fontFamily: "var(--f-mono)", fontSize: 10.5, color: "var(--m-fg-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>scope</span><span style={{ color: "var(--m-fg-1)" }}>vault-local</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}><span>sandbox</span><span style={{ color: "var(--c-green)" }}>shadow-dom · csp</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}><span>hot-reload</span><span style={{ color: "var(--c-green)" }}>● on</span></div>
          </div>
        </div>

        {/* Main: split view */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Sub-header */}
          <div style={{
            display: "flex", alignItems: "center",
            padding: "0 16px", height: 36,
            background: "var(--m-bg)",
            borderBottom: "1px solid var(--m-line-soft)", gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--f-mono)", color: "var(--c-cyan)", fontSize: 13 }}>&lt;api-status&gt;</span>
              <span style={{ fontSize: 11, color: "var(--m-fg-3)" }}>service health pill · polls vault data source</span>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: "1px solid var(--m-line)", background: "var(--m-bg-1)" }}>
              {[["template", "template"], ["split", "split"], ["usages", "usages"]].map(([k, l]) => (
                <button key={k} onClick={() => setView(k)} style={{
                  padding: "0 12px", height: 24, fontSize: 11,
                  fontFamily: "var(--f-mono)",
                  background: view === k ? "var(--m-bg-2)" : "transparent",
                  color: view === k ? "var(--m-vein)" : "var(--m-fg-2)",
                }}>{l}</button>
              ))}
            </div>
            <span className="m-chip mono">⌥⌘P preview</span>
          </div>

          {/* Split body */}
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            {/* Left: component source */}
            <div style={{ flex: 1.1, display: view === "usages" ? "none" : "flex", flexDirection: "column", borderRight: "1px solid var(--m-line-soft)", minWidth: 0 }}>
              <div style={{
                padding: "8px 14px", display: "flex", alignItems: "center", gap: 8,
                background: "var(--m-bg-inset)", borderBottom: "1px solid var(--m-line-soft)",
                fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--m-fg-3)",
              }}>
                <span style={{ color: "var(--m-vein)" }}>●</span>
                <span>components/api-status.html</span>
                <span style={{ flex: 1 }}/>
                <span>42 lines · 1.1 kB</span>
              </div>
              <div style={{ flex: 1, overflow: "auto", background: "var(--m-bg-inset)" }}>
                <pre style={{
                  margin: 0, padding: "16px 20px",
                  fontFamily: "var(--f-mono)", fontSize: 12, lineHeight: 1.6,
                  color: "var(--m-fg-1)",
                }}>{COMPONENT_FILE_SRC.split("\n").map((ln, i) => (
                  <div key={i} style={{ display: "flex", gap: 16 }}>
                    <span style={{ width: 22, color: "var(--m-fg-3)", textAlign: "right", flex: "0 0 22px" }}>{i + 1}</span>
                    <span style={{ flex: 1, whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: tokenizeCode(ln) }} />
                  </div>
                ))}</pre>
              </div>
              {/* Live preview footer */}
              <div style={{
                padding: "14px 20px", borderTop: "1px solid var(--m-line-soft)",
                background: "var(--m-bg-1)",
              }}>
                <div style={{ fontSize: 10.5, color: "var(--m-fg-3)", fontFamily: "var(--f-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  live preview · attributes
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <ApiStatusPreview attrs={{ health: "up", latency: "23 ms" }} label="session-store" big/>
                  <ApiStatusPreview attrs={{ health: "degraded", latency: "87 ms" }} label="auth-svc" big/>
                  <ApiStatusPreview attrs={{ health: "down", latency: "n/a" }} label="stripe-webhook" big/>
                </div>
              </div>
            </div>

            {/* Right: usages */}
            <div style={{ flex: 1, display: view === "template" ? "none" : "flex", flexDirection: "column", minWidth: 0 }}>
              <div style={{
                padding: "8px 14px", display: "flex", alignItems: "center", gap: 8,
                background: "var(--m-bg)", borderBottom: "1px solid var(--m-line-soft)",
                fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--m-fg-3)",
              }}>
                <span>used in <span style={{ color: "var(--m-fg-1)" }}>7 notes</span></span>
                <span style={{ flex: 1 }} />
                <span>tap a row to jump</span>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: "10px 12px" }}>
                {USAGES.map((u, i) => (
                  <div key={i}
                    onMouseEnter={() => setHoverUsage(i)}
                    onMouseLeave={() => setHoverUsage(null)}
                    style={{
                      display: "flex", flexDirection: "column", gap: 6,
                      padding: "10px 12px", marginBottom: 6,
                      borderRadius: 6,
                      border: "1px solid var(--m-line-soft)",
                      background: hoverUsage === i ? "var(--m-bg-2)" : "var(--m-bg-1)",
                      cursor: "pointer",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--m-fg)" }}>{u.note}</span>
                      <span style={{ fontFamily: "var(--f-mono)", fontSize: 10.5, color: "var(--m-fg-3)" }}>:{u.line}</span>
                      <span style={{ flex: 1 }}/>
                      <ApiStatusPreview attrs={u.attrs} label={u.label}/>
                    </div>
                    <div style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--m-fg-2)", paddingLeft: 4 }}>
                      <span style={{ color: "var(--m-fg-3)" }}>{"<"}</span>
                      <span style={{ color: "var(--c-magenta)" }}>api-status</span>{" "}
                      <span style={{ color: "var(--c-cyan)" }}>health</span>
                      <span style={{ color: "var(--m-fg-3)" }}>=</span>
                      <span style={{ color: "var(--c-green)" }}>"{u.attrs.health}"</span>{" "}
                      <span style={{ color: "var(--c-cyan)" }}>data-source</span>
                      <span style={{ color: "var(--m-fg-3)" }}>=</span>
                      <span style={{ color: "var(--c-green)" }}>"datadog://acme/{u.label}"</span>
                      <span style={{ color: "var(--m-fg-3)" }}>{">"}</span>
                      {u.label}
                      <span style={{ color: "var(--m-fg-3)" }}>{"</"}</span>
                      <span style={{ color: "var(--c-magenta)" }}>api-status</span>
                      <span style={{ color: "var(--m-fg-3)" }}>{">"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div style={{
            height: 22, flex: "0 0 22px",
            background: "var(--m-bg-inset)", borderTop: "1px solid var(--m-line-soft)",
            display: "flex", alignItems: "center", padding: "0 10px",
            fontSize: 10.5, fontFamily: "var(--f-mono)", color: "var(--m-fg-3)", gap: 16,
          }}>
            <span style={{ color: "var(--c-green)" }}>● customElements registered</span>
            <span>Shadow DOM open · CSP: default-src 'self'</span>
            <span style={{ flex: 1 }} />
            <span>hot-reloaded 3 min ago</span>
            <span style={{ color: "var(--m-vein)" }}>marble 0.8.4</span>
          </div>
        </div>

        {/* Right: props/inspector */}
        <div style={{
          width: 260, flex: "0 0 260px",
          background: "var(--m-bg-1)",
          borderLeft: "1px solid var(--m-line-soft)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          <SideHead>contract</SideHead>
          <div style={{ padding: "0 12px 8px" }}>
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 11.5, color: "var(--m-fg-3)" }}>attributes</div>
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                ["health", "up | degraded | down", "required"],
                ["data-source", "URL", "optional"],
                ["latency", "string", "slot"],
              ].map(([a, t, r], i) => (
                <div key={i} style={{
                  padding: "6px 8px", borderRadius: 4,
                  border: "1px solid var(--m-line-soft)",
                  background: "var(--m-bg-2)",
                  display: "flex", flexDirection: "column", gap: 2,
                }}>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 11.5, color: "var(--c-cyan)" }}>{a}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--m-fg-3)", fontFamily: "var(--f-mono)" }}>
                    <span>{t}</span><span style={{ color: r === "required" ? "var(--c-red)" : "var(--m-fg-3)" }}>{r}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SideHead>renders to</SideHead>
          <div style={{ padding: "0 12px 8px", display: "flex", alignItems: "center", gap: 8 }}>
            <ApiStatusPreview attrs={{ health: "up", latency: "23 ms" }} label="example"/>
            <span style={{ fontSize: 11, color: "var(--m-fg-3)" }}>at any zoom</span>
          </div>

          <SideHead>install</SideHead>
          <div style={{ padding: "0 12px 14px" }}>
            <div style={{
              padding: "10px 12px", borderRadius: 6,
              background: "var(--m-bg-inset)",
              border: "1px solid var(--m-line-soft)",
              fontFamily: "var(--f-mono)", fontSize: 11.5, lineHeight: 1.6,
            }}>
              <div style={{ color: "var(--m-fg-3)" }}># nothing to install.</div>
              <div style={{ color: "var(--m-fg-2)" }}>cp api-status.html \</div>
              <div style={{ color: "var(--m-fg-2)" }}>   vault/components/</div>
              <div style={{ color: "var(--m-vein)", marginTop: 6 }}># every note picks it up.</div>
            </div>
          </div>

          <div style={{ flex: 1 }}/>

          <div style={{
            margin: 12, padding: "12px 14px",
            border: "1px solid var(--m-line)",
            borderLeft: "3px solid var(--m-vein)",
            borderRadius: 6,
            background: "oklch(0.20 0.025 78 / 0.4)",
            fontSize: 11.5, lineHeight: 1.5, color: "var(--m-fg-1)",
          }}>
            <div style={{ fontSize: 10.5, color: "var(--m-vein)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 4 }}>
              the pitch
            </div>
            Components are <em>files</em>, not <em>plugins</em>. No manifest, no
            store, no build. One .html in <code style={{ color: "var(--c-cyan)", fontFamily: "var(--f-mono)" }}>components/</code>{" "}
            and every note in the vault can call it.
          </div>
        </div>
      </MarbleFrame>
    </div>
  );
}

// Marker-based tokenizer. Works on the RAW line, collects (start, end, color)
// ranges in one pass, then emits HTML in a single final pass. Spans never
// overlap because we drop later matches that intersect earlier ones.
function tokenizeCode(line) {
  const C = {
    comment: "var(--m-fg-3)", string: "var(--c-green)",
    kw: "var(--c-violet)", tag: "var(--c-magenta)",
    attr: "var(--c-cyan)", num: "var(--c-blue)",
    dim: "var(--m-fg-3)",
  };
  // Whole-line comment short-circuit
  if (/^\s*(\/\/|\/\*|#)/.test(line)) {
    return `<span style="color:${C.comment}">${escHtml(line)}</span>`;
  }
  const ranges = []; // { s, e, color }
  const add = (re, color, group = 0) => {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line))) {
      const start = m.index + (group ? m[0].indexOf(m[group]) : 0);
      const end = start + m[group].length;
      if (!ranges.some(r => start < r.e && end > r.s)) ranges.push({ s: start, e: end, color });
      if (m[0].length === 0) re.lastIndex++;
    }
  };
  // Order matters: strings first (so we don't tokenize inside them)
  add(/"[^"]*"/g, C.string);
  add(/<\/?[a-z][\w-]*/gi, C.tag); // whole <tag or </tag
  add(/\s([a-z-]+)=/gi, C.attr, 1);
  add(/\b(class|extends|static|async|await|const|let|return|new|this|if|else)\b/g, C.kw, 1);
  add(/\b\d+(?:\.\d+)?(?:px|ms|%)?\b/g, C.num);
  add(/^(\s+)([a-z-]+):/g, C.attr, 2); // CSS prop names at line start
  ranges.sort((a, b) => a.s - b.s);

  let out = "", cursor = 0;
  for (const r of ranges) {
    if (r.s < cursor) continue; // safety
    out += escHtml(line.slice(cursor, r.s));
    out += `<span style="color:${r.color}">${escHtml(line.slice(r.s, r.e))}</span>`;
    cursor = r.e;
  }
  out += escHtml(line.slice(cursor));
  // dim the < and > themselves after the fact (they're either at edges of
  // tag-ranges already-escaped to &lt;/&gt; — no DOM hazard)
  return out;
}
function escHtml(s) { return s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }

window.ArtboardComponents = ArtboardComponents;
