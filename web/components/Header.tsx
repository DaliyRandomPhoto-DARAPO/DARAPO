export default function Header() {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #eee' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, background: '#111', borderRadius: 8 }} />
        <strong>DARAPO</strong>
      </div>
      <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
  <a href="/privacy">Privacy</a>
  <a href="/terms">Terms</a>
  <a href="#" style={{ padding: '8px 12px', background: '#000', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>앱 설치</a>
  {/* Store badge placeholders - replace with actual badge images/links */}
  <a href="#" aria-label="Google Play" style={{ display: 'inline-block', width: 96, height: 32, background: '#1e293b', color: '#fff', textAlign: 'center', lineHeight: '32px', borderRadius: 6, textDecoration: 'none' }}>Play</a>
  <a href="#" aria-label="App Store" style={{ display: 'inline-block', width: 96, height: 32, background: '#0f172a', color: '#fff', textAlign: 'center', lineHeight: '32px', borderRadius: 6, textDecoration: 'none' }}>App Store</a>
      </nav>
    </header>
  )
}
