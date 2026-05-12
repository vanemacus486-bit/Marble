// marble-chrome.jsx — shared chrome atoms used by all three artboards
// Title bar, left ribbon, sidebar header. Keeps each artboard short.

const Icon = ({ d, size = 14, stroke = 1.6, fill = "none", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    style={style}>{d}</svg>
);

// Curated icons (Lucide-derived geometry, simplified)
const I = {
  files:   <Icon d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>} />,
  search:  <Icon d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>} />,
  graph:   <Icon d={<><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8 17 16 7"/><path d="M18 8.4v7.2"/></>} />,
  comp:    <Icon d={<><path d="M12 3 4 7v10l8 4 8-4V7z"/><path d="M4 7l8 4 8-4"/><path d="M12 11v10"/></>} />,
  data:    <Icon d={<><ellipse cx="12" cy="5" rx="8" ry="2.5"/><path d="M4 5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5"/><path d="M4 11v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6"/></>} />,
  tag:     <Icon d={<><path d="M20 12 12 20l-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/></>} />,
  settings:<Icon d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>} />,
  chev:    <Icon d={<path d="m9 18 6-6-6-6"/>} />,
  chevD:   <Icon d={<path d="m6 9 6 6 6-6"/>} />,
  folder:  <Icon d={<path d="M3 7v12a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-9l-2-2H4a1 1 0 0 0-1 1z"/>} />,
  file:    <Icon d={<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></>} />,
  html:    <Icon d={<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 15v-3M16 15v-3M10 13.5h4M7 18h10" strokeWidth="1.2"/></>} />,
  plus:    <Icon d={<><path d="M12 5v14"/><path d="M5 12h14"/></>} />,
  close:   <Icon d={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>} />,
  code:    <Icon d={<><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></>} />,
  eye:     <Icon d={<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>} />,
  link:    <Icon d={<><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 1 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 1 0 7 7l1-1"/></>} />,
  bolt:    <Icon d={<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>} />,
  ai:      <Icon d={<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/><circle cx="12" cy="12" r="3"/></>} />,
  hash:    <Icon d={<><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></>} />,
  pin:     <Icon d={<><path d="M12 2v7l4 4-2 2h-4l-2-2 4-4V2z"/><path d="M12 15v7"/></>} />,
};

// Window frame: macOS-ish traffic lights + center title + right toolbar
function MarbleFrame({ title, subtitle, right, children }) {
  return (
    <div className="marble" style={{
      position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      borderRadius: 10, overflow: "hidden",
      boxShadow: "inset 0 0 0 1px var(--m-line)",
    }}>
      <div style={{
        display: "flex", alignItems: "center",
        height: 36, padding: "0 12px",
        background: "var(--m-bg)",
        borderBottom: "1px solid var(--m-line-soft)",
        gap: 12, flex: "0 0 auto",
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={dotStyle("#ef5f56")} />
          <span style={dotStyle("#f4be4f")} />
          <span style={dotStyle("#5dca54")} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8, color: "var(--m-fg-2)" }}>
          <button className="frame-btn" aria-label="back">{I.chev && React.cloneElement(I.chev, { style: { transform: "rotate(180deg)" } })}</button>
          <button className="frame-btn" aria-label="forward">{I.chev}</button>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, color: "var(--m-fg-1)" }}>
          <div className="marble-mark"></div>
          <div style={{ fontSize: 12.5, fontWeight: 500 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: "var(--m-fg-3)" }}>— {subtitle}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--m-fg-2)" }}>
          {right}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", minHeight: 0, background: "var(--m-bg)" }}>
        {children}
      </div>
      <style>{`
        .frame-btn { width: 22px; height: 22px; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: var(--m-fg-3); }
        .frame-btn:hover { background: var(--m-bg-2); color: var(--m-fg-1); }
      `}</style>
    </div>
  );
}
function dotStyle(c) { return { width: 11, height: 11, borderRadius: "50%", background: c, display: "inline-block" }; }

// Left ribbon — vertical icon strip. Sets the "selected pane" mode.
function Ribbon({ active, onChange }) {
  const items = [
    ["files",    I.files,    "Files"],
    ["search",   I.search,   "Search"],
    ["graph",    I.graph,    "Graph"],
    ["comp",     I.comp,     "Components"],
    ["data",     I.data,     "Data"],
    ["tag",      I.tag,      "Tags"],
  ];
  return (
    <div style={{
      width: 44, flex: "0 0 44px",
      background: "var(--m-bg-inset)",
      borderRight: "1px solid var(--m-line-soft)",
      display: "flex", flexDirection: "column",
      alignItems: "center", paddingTop: 8, gap: 2,
    }}>
      {items.map(([k, icon, label]) => (
        <button key={k}
          onClick={() => onChange && onChange(k)}
          title={label}
          style={{
            width: 30, height: 30, borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: active === k ? "var(--m-vein)" : "var(--m-fg-3)",
            background: active === k ? "var(--m-bg-2)" : "transparent",
            position: "relative",
          }}
          onMouseOver={e => { if (active !== k) e.currentTarget.style.color = "var(--m-fg-1)"; }}
          onMouseOut={e => { if (active !== k) e.currentTarget.style.color = "var(--m-fg-3)"; }}
        >
          {icon}
          {active === k && (
            <span style={{
              position: "absolute", left: -1, top: 6, bottom: 6, width: 2,
              background: "var(--m-vein)", borderRadius: 2,
            }}/>
          )}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <button title="Settings" style={{
        width: 30, height: 30, borderRadius: 6,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--m-fg-3)", marginBottom: 8,
      }}>{I.settings}</button>
    </div>
  );
}

// File tree row
function TreeRow({ depth = 0, icon, name, ext, active, badge, dim, color, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "2px 8px 2px 0",
      paddingLeft: 8 + depth * 12,
      height: 22, borderRadius: 4, cursor: "pointer",
      background: active ? "var(--m-bg-2)" : "transparent",
      color: active ? "var(--m-fg)" : (dim ? "var(--m-fg-3)" : "var(--m-fg-1)"),
      fontSize: 12.5,
      position: "relative",
    }}
    onMouseOver={e => { if (!active) e.currentTarget.style.background = "oklch(0.20 0.006 260)"; }}
    onMouseOut={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {active && <span style={{ position: "absolute", left: 0, top: 3, bottom: 3, width: 2, background: "var(--m-vein)", borderRadius: 2 }}/>}
      <span style={{ color: color || "var(--m-fg-3)", flex: "0 0 auto", display: "flex" }}>{icon}</span>
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}{ext && <span style={{ color: "var(--m-fg-3)" }}>{ext}</span>}</span>
      {badge && <span style={{ fontSize: 10, color: "var(--m-fg-3)", fontFamily: "var(--f-mono)" }}>{badge}</span>}
    </div>
  );
}

// Section header inside sidebar
function SideHead({ children, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 10px 4px", fontSize: 10.5,
      textTransform: "uppercase", letterSpacing: "0.08em",
      color: "var(--m-fg-3)", fontWeight: 600,
    }}>
      <span>{children}</span>
      {action && <span style={{ color: "var(--m-fg-3)" }}>{action}</span>}
    </div>
  );
}

Object.assign(window, { Icon, I, MarbleFrame, Ribbon, TreeRow, SideHead });
