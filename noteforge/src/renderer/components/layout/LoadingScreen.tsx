export default function LoadingScreen() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--m-bg)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {/* Pulsing marble mark */}
        <div
          className="marble-mark"
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            margin: '0 auto',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <p
          style={{
            marginTop: 16,
            fontSize: 12.5,
            color: 'var(--m-fg-3)',
            fontFamily: 'var(--f-mono)',
          }}
        >
          Loading vault...
        </p>
      </div>
    </div>
  )
}
