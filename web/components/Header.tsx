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
      </nav>
    </header>
  )
}
