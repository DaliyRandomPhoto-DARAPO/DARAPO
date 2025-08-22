import Head from 'next/head'

export default function Terms() {
  return (
    <div>
      <Head>
        <title>DARAPO — 서비스 이용약관</title>
        <meta name="description" content="DARAPO 서비스 이용약관" />
      </Head>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <h1>서비스 이용약관</h1>
        <p style={{ color: '#666' }}>최종 업데이트: 2025-08-13</p>

        <section style={{ marginTop: 20 }}>
          <h2>제1조 (목적)</h2>
          <p>이 약관은 DARAPO(이하 "서비스")가 제공하는 모바일 애플리케이션 및 관련 웹서비스의 이용에 관한 제반 사항과 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        </section>

        <section style={{ marginTop: 16 }}>
          <h2>제2조 (정의)</h2>
          <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다: ① "이용자"는 본 서비스를 이용하는 자를 말합니다. ② "콘텐츠"는 이용자가 업로드한 사진 및 메모 등을 포함합니다.</p>
        </section>

        <section style={{ marginTop: 16 }}>
          <h2>제3조 (서비스 이용)</h2>
          <p>이용자는 카카오 계정 등으로 로그인하여 미션을 수행하고 사진을 업로드할 수 있습니다. 이용자는 본인이 업로드한 콘텐츠에 대한 저작권을 보유합니다. 다만, 서비스 내 노출·공유를 위해 필요한 범위에서 서비스가 이를 활용할 수 있습니다.</p>
        </section>

        <section style={{ marginTop: 16 }}>
          <h2>제4조 (금지행위)</h2>
          <p>이용자는 관계 법령에 위반되거나 타인의 권리를 침해하는 행위를 해서는 안 됩니다. 음란물, 혐오·차별적 표현 등 부적절한 콘텐츠는 신고 및 삭제 대상이 됩니다.</p>
        </section>

        <section style={{ marginTop: 16 }}>
          <h2>제5조 (계정 및 탈퇴)</h2>
          <p>이용자는 앱 내 ‘탈퇴’ 기능을 통해 계정 삭제를 요청할 수 있으며, 탈퇴 시 계정정보 및 사용자가 업로드한 사진은 서버에서 삭제됩니다(단, 백업/법령상 보관 의무가 있는 경우 예외가 있을 수 있습니다).</p>
        </section>

        <section style={{ marginTop: 16 }}>
          <h2>제6조 (면책)</h2>
          <p>서비스는 천재지변, 서버 장애 등 통제 불가능한 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다. 또한 이용자의 게시물로 인한 분쟁은 당사와 무관하게 당사자는 관련 법령에 따라 적절히 조치합니다.</p>
        </section>

        <section style={{ marginTop: 16 }}>
          <h2>제7조 (문의)</h2>
          <p>약관·정책·서비스 이용 관련 문의: hhee200456@gmail.com</p>
        </section>

        <footer style={{ marginTop: 40, color: '#777' }}>
          <p>본 약관은 서비스 운영정책에 따라 변경될 수 있으며, 변경 시 앱 내 공지 및 이 페이지를 통해 안내합니다.</p>
        </footer>
      </main>
    </div>
  )
}
