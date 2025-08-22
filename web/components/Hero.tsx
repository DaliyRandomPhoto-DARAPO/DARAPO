import React from 'react'

export default function Hero({ apiBase }: { apiBase: string }) {
  const kakaoUrl = `${apiBase}/api/auth/kakao`

  return (
    <section style={{ display: 'flex', gap: 24, alignItems: 'center', paddingTop: 40 }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>매일 하나, 랜덤 사진 미션</h1>
        <p style={{ color: '#555', marginTop: 12 }}>오늘의 주제로 한 장을 남기고, 나만의 기록을 만들어 보세요. 공개는 선택입니다.</p>

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <a href="/" style={{ padding: '12px 18px', background: '#111', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>앱 설치하기</a>
          <a href={kakaoUrl} style={{ padding: '12px 18px', background: '#fee500', color: '#3b1d00', borderRadius: 8, textDecoration: 'none' }}>카카오로 로그인 (테스트)</a>
        </div>

        <p style={{ marginTop: 12, color: '#888', fontSize: 13 }}>테스트 로그인은 백엔드에서 `/api/auth/kakao` 엔드포인트를 통해 동작합니다.</p>
      </div>

      <div style={{ width: 320, height: 640, background: '#f4f4f4', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 280, height: 560, background: '#fff', borderRadius: 16, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
          <p style={{ textAlign: 'center', paddingTop: 260, color: '#bbb' }}>앱 화면 미리보기</p>
        </div>
      </div>
    </section>
  )
}
