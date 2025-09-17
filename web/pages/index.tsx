import Head from 'next/head'
import Header from '../components/Header'
import Hero from '../components/Hero'
import Features from '../components/Features'

export default function Home() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.darapo.site'

  return (
    <div>
      <Head>
        <title>DARAPO — 매일 하나, 랜덤 사진 미션</title>
        <meta name="description" content="오늘의 미션으로 사진 한 장, 가볍게 기록하고 원할 때만 공유하세요. 카카오 로그인 지원." />
        <meta name="keywords" content="DARAPO, 사진 앱, 미션, 랜덤, 카카오, 일기, 기록" />
        <meta property="og:title" content="DARAPO — 매일 하나, 랜덤 사진 미션" />
        <meta property="og:description" content="오늘의 미션으로 사진 한 장, 가볍게 기록하고 원할 때만 공유하세요" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://darapo.app" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://darapo.app" />
      </Head>

      <Header />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
  <Hero apiBase={apiBase} />
  <Features />

        <section style={{ marginTop: 40 }}>
          <h2>How it works</h2>
          <ol>
            <li>오늘의 미션 확인</li>
            <li>사진 촬영 / 업로드</li>
            <li>공개 여부 선택 및 피드 공유</li>
          </ol>
        </section>

        <section style={{ marginTop: 40 }}>
          <h2>Privacy / Terms</h2>
          <p>
            개인정보처리방침 및 이용약관은 아래 링크에서 확인하세요.
          </p>
          <p>
            <a href="/privacy">개인정보처리방침</a> · <a href="/terms">이용약관</a>
          </p>
        </section>
      </main>
    </div>
  )
}
