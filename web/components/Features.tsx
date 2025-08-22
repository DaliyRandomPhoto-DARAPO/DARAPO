export default function Features() {
  return (
    <section style={{ marginTop: 40 }}>
      <h2>주요 기능</h2>
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px', padding: 16, borderRadius: 8, background: '#fff', boxShadow: '0 6px 18px rgba(0,0,0,0.04)' }}>
          <h3>연속 달성</h3>
          <p>매일 미션을 수행하면서 나만의 루틴을 쌓을 수 있습니다.</p>
        </div>
        <div style={{ flex: '1 1 220px', padding: 16, borderRadius: 8, background: '#fff', boxShadow: '0 6px 18px rgba(0,0,0,0.04)' }}>
          <h3>공개/비공개</h3>
          <p>각 사진을 공개 또는 비공개로 선택할 수 있습니다.</p>
        </div>
        <div style={{ flex: '1 1 220px', padding: 16, borderRadius: 8, background: '#fff', boxShadow: '0 6px 18px rgba(0,0,0,0.04)' }}>
          <h3>감정 메모</h3>
          <p>사진과 함께 간단한 메모를 남겨 감정을 기록하세요.</p>
        </div>
      </div>
    </section>
  )
}
