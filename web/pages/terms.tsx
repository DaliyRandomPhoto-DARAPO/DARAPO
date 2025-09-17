import Head from 'next/head'
import Link from 'next/link'

export default function Terms() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Head>
        <title>서비스 이용약관 | DARAPO</title>
        <meta name="description" content="DARAPO 서비스 이용약관 - 매일 하나, 랜덤 사진 미션 앱의 서비스 이용 규정" />
        <meta name="keywords" content="DARAPO, 이용약관, 서비스약관, 사진 앱" />
        <meta property="og:title" content="서비스 이용약관 | DARAPO" />
        <meta property="og:description" content="DARAPO의 서비스 이용약관을 확인하세요" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
      </Head>

      {/* 네비게이션 헤더 */}
      <header style={{ 
        borderBottom: '1px solid #eee', 
        padding: '16px 24px',
        backgroundColor: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <nav style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/" style={{ 
            fontSize: 20, 
            fontWeight: 'bold', 
            textDecoration: 'none', 
            color: '#333' 
          }}>
            DARAPO
          </Link>
          <div style={{ display: 'flex', gap: 16, marginLeft: 'auto' }}>
            <Link href="/privacy" style={{ textDecoration: 'none', color: '#666' }}>
              개인정보처리방침
            </Link>
            <Link href="/terms" style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>
              이용약관
            </Link>
          </div>
        </nav>
      </header>

      <main style={{ 
        maxWidth: 860, 
        margin: '0 auto', 
        padding: 24,
        lineHeight: 1.6,
        color: '#333'
      }}>
        <h1 style={{ 
          fontSize: 32, 
          marginBottom: 8, 
          color: '#222' 
        }}>서비스 이용약관</h1>
        <p style={{ 
          color: '#666', 
          marginBottom: 32,
          fontSize: 14
        }}>최종 업데이트: 2025-08-13</p>

        <section style={{ 
          marginBottom: 32,
          padding: 24,
          backgroundColor: '#f8f9fa',
          borderRadius: 8,
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{ 
            fontSize: 20, 
            marginBottom: 16, 
            color: '#2c3e50',
            borderBottom: '2px solid #3498db',
            paddingBottom: 8
          }}>제1조 (목적)</h2>
          <p>이 약관은 DARAPO(이하 "서비스")가 제공하는 모바일 애플리케이션 및 관련 웹서비스의 이용에 관한 제반 사항과 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        </section>

        <section style={{ 
          marginBottom: 32,
          padding: 24,
          backgroundColor: '#f8f9fa',
          borderRadius: 8,
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{ 
            fontSize: 20, 
            marginBottom: 16, 
            color: '#2c3e50',
            borderBottom: '2px solid #3498db',
            paddingBottom: 8
          }}>제2조 (정의)</h2>
          <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
          <ul style={{ marginTop: 12, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}><strong>이용자</strong>: 본 서비스를 이용하는 자를 말합니다.</li>
            <li style={{ marginBottom: 8 }}><strong>콘텐츠</strong>: 이용자가 업로드한 사진 및 메모 등을 포함합니다.</li>
          </ul>
        </section>

        <section style={{ 
          marginBottom: 32,
          padding: 24,
          backgroundColor: '#f8f9fa',
          borderRadius: 8,
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{ 
            fontSize: 20, 
            marginBottom: 16, 
            color: '#2c3e50',
            borderBottom: '2px solid #3498db',
            paddingBottom: 8
          }}>제3조 (서비스 이용)</h2>
          <p>이용자는 카카오 계정 등으로 로그인하여 미션을 수행하고 사진을 업로드할 수 있습니다.</p>
          <p style={{ marginTop: 12 }}>이용자는 본인이 업로드한 콘텐츠에 대한 저작권을 보유합니다. 다만, 서비스 내 노출·공유를 위해 필요한 범위에서 서비스가 이를 활용할 수 있습니다.</p>
        </section>

                <section style={{ 
          marginBottom: 32,
          padding: 24,
          backgroundColor: '#f8f9fa',
          borderRadius: 8,
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{ 
            fontSize: 20, 
            marginBottom: 16, 
            color: '#2c3e50',
            borderBottom: '2px solid #3498db',
            paddingBottom: 8
          }}>제4조 (금지행위)</h2>
          <p>이용자는 다음과 같은 행위를 해서는 안 됩니다:</p>
          <ul style={{ marginTop: 12, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>관계 법령에 위반되는 행위</li>
            <li style={{ marginBottom: 8 }}>타인의 권리를 침해하는 행위</li>
            <li style={{ marginBottom: 8 }}>음란물, 혐오·차별적 표현 등 부적절한 콘텐츠 업로드</li>
          </ul>
          <p style={{ 
            marginTop: 16, 
            padding: 12, 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7',
            borderRadius: 4,
            fontSize: 14
          }}>
            <strong>⚠️ 주의사항:</strong> 부적절한 콘텐츠는 신고 및 삭제 대상이 됩니다.
          </p>
        </section>

        <section style={{ 
          marginBottom: 32,
          padding: 24,
          backgroundColor: '#f8f9fa',
          borderRadius: 8,
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{ 
            fontSize: 20, 
            marginBottom: 16, 
            color: '#2c3e50',
            borderBottom: '2px solid #e74c3c',
            paddingBottom: 8
          }}>제5조 (계정 및 탈퇴)</h2>
          <p>이용자는 앱 내 <strong>'탈퇴'</strong> 기능을 통해 계정 삭제를 요청할 수 있습니다.</p>
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            backgroundColor: '#f8d7da', 
            border: '1px solid #f5c6cb',
            borderRadius: 4
          }}>
            <h3 style={{ fontSize: 16, marginBottom: 8, color: '#721c24' }}>탈퇴 시 삭제되는 정보</h3>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li>계정 정보</li>
              <li>업로드한 사진</li>
              <li>미션 기록</li>
            </ul>
            <p style={{ marginTop: 12, fontSize: 14, color: '#721c24' }}>
              <strong>주의:</strong> 백업/법령상 보관 의무가 있는 경우 예외가 있을 수 있습니다.
            </p>
          </div>
        </section>

        <section style={{ 
          marginBottom: 32,
          padding: 24,
          backgroundColor: '#f8f9fa',
          borderRadius: 8,
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{ 
            fontSize: 20, 
            marginBottom: 16, 
            color: '#2c3e50',
            borderBottom: '2px solid #3498db',
            paddingBottom: 8
          }}>제6조 (면책)</h2>
          <p>서비스는 다음과 같은 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다:</p>
          <ul style={{ marginTop: 12, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>천재지변</li>
            <li style={{ marginBottom: 8 }}>서버 장애 등 통제 불가능한 사유</li>
          </ul>
          <p style={{ marginTop: 16 }}>또한 이용자의 게시물로 인한 분쟁은 당사와 무관하게 당사자는 관련 법령에 따라 적절히 조치합니다.</p>
        </section>

        <section style={{ 
          marginBottom: 32,
          padding: 24,
          backgroundColor: '#d4edda',
          borderRadius: 8,
          border: '1px solid #c3e6cb'
        }}>
          <h2 style={{ 
            fontSize: 20, 
            marginBottom: 16, 
            color: '#155724',
            borderBottom: '2px solid #28a745',
            paddingBottom: 8
          }}>제7조 (문의)</h2>
          <p>약관·정책·서비스 이용 관련 문의는 아래로 연락주세요:</p>
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            backgroundColor: '#fff', 
            borderRadius: 4,
            border: '1px solid #dee2e6'
          }}>
            <p style={{ margin: 0, fontSize: 16 }}>
              📧 이메일: <strong>hhee200456@gmail.com</strong>
            </p>
          </div>
        </section>

        <footer style={{ 
          marginTop: 48, 
          padding: 24,
          backgroundColor: '#e9ecef',
          borderRadius: 8,
          textAlign: 'center',
          border: '1px solid #dee2e6'
        }}>
          <p style={{ margin: 0, color: '#6c757d', fontSize: 14 }}>
            본 약관은 서비스 운영정책에 따라 변경될 수 있으며, 변경 시 앱 내 공지 및 이 페이지를 통해 안내합니다.
          </p>
        </footer>
      </main>
    </div>
  )
}
