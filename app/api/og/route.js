import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0A1628',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Ambient glow top-right */}
        <div
          style={{
            position: 'absolute',
            top: -150,
            right: -150,
            width: 550,
            height: 550,
            background:
              'radial-gradient(circle, rgba(79,110,247,0.18) 0%, transparent 65%)',
            display: 'flex',
          }}
        />
        {/* Ambient glow bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 400,
            height: 400,
            background:
              'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* BREAKING NEWS bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#B22234',
            padding: '0 36px',
            height: 52,
            gap: 18,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 900,
              color: '#fff',
              letterSpacing: 2.5,
              textTransform: 'uppercase',
            }}
          >
            BREAKING
          </span>
          <div
            style={{
              width: 1,
              height: 18,
              background: 'rgba(255,255,255,0.35)',
              display: 'flex',
            }}
          />
          <span
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.92)',
              letterSpacing: 0.2,
              fontWeight: 500,
            }}
          >
            Congressional stock trading is legal — and they do it constantly
          </span>
        </div>

        {/* Main body */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            padding: '36px 52px 28px 52px',
            gap: 40,
          }}
        >
          {/* LEFT: headline + stats */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'space-between',
            }}
          >
            {/* Wordmark */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: '#F5F0E8',
                  letterSpacing: -0.5,
                }}
              >
                Civic
                <span style={{ color: '#D4AF37' }}>Watch</span>
              </span>
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(212,175,55,0.12)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: 20,
                  padding: '3px 10px',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: '#D4AF37',
                    fontWeight: 800,
                    letterSpacing: 1.2,
                  }}
                >
                  FREE
                </span>
              </div>
            </div>

            {/* Big stat + headline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  fontSize: 88,
                  fontWeight: 900,
                  color: '#D4AF37',
                  lineHeight: 0.9,
                  letterSpacing: -3,
                }}
              >
                8,700
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#F5F0E8',
                  lineHeight: 1.2,
                }}
              >
                Stock trades by Congress last year
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 15,
                  color: '#8892A4',
                  lineHeight: 1.45,
                }}
              >
                Your representatives trade stocks, cast votes, and build
                wealth while serving you. See exactly what they're doing.
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 44 }}>
              {[
                ['535', 'Members'],
                ['40K+', 'Filings'],
                ['$2.8B', 'Traded'],
              ].map(([n, l]) => (
                <div
                  key={n}
                  style={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                >
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: '#D4AF37',
                    }}
                  >
                    {n}
                  </span>
                  <span style={{ fontSize: 11, color: '#8892A4' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: live trade feed */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: 368,
              gap: 10,
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                marginBottom: 2,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#4F6EF7',
                  display: 'flex',
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  color: '#4F6EF7',
                  fontWeight: 800,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                }}
              >
                LIVE DISCLOSURES
              </span>
            </div>

            {[
              {
                name: 'Nancy Pelosi',
                sub: 'House · CA-11',
                ticker: 'NVDA Call Options',
                amount: '$1M – $5M',
                dir: 'BUY',
                highlight: true,
              },
              {
                name: 'Tommy Tuberville',
                sub: 'Senate · AL',
                ticker: 'iShares MSCI ETF',
                amount: '$250K – $500K',
                dir: 'SELL',
                highlight: false,
              },
              {
                name: 'Dan Crenshaw',
                sub: 'House · TX-02',
                ticker: 'Microsoft (MSFT)',
                amount: '$50K – $100K',
                dir: 'BUY',
                highlight: false,
              },
              {
                name: 'Ro Khanna',
                sub: 'House · CA-17',
                ticker: 'Alphabet (GOOGL)',
                amount: '$15K – $50K',
                dir: 'BUY',
                highlight: false,
              },
            ].map((t, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: t.highlight
                    ? 'rgba(79,110,247,0.10)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${
                    t.highlight
                      ? 'rgba(79,110,247,0.30)'
                      : 'rgba(255,255,255,0.08)'
                  }`,
                  borderRadius: 9,
                  padding: '11px 16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#F5F0E8',
                    }}
                  >
                    {t.name}
                  </span>
                  <span style={{ fontSize: 10, color: '#8892A4' }}>
                    {t.sub} · {t.ticker}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#D4AF37',
                    }}
                  >
                    {t.amount}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      background:
                        t.dir === 'BUY'
                          ? 'rgba(39,174,96,0.18)'
                          : 'rgba(224,82,82,0.18)',
                      borderRadius: 4,
                      padding: '2px 8px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: t.dir === 'BUY' ? '#27AE60' : '#E05252',
                        letterSpacing: 0.5,
                      }}
                    >
                      {t.dir}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(79,110,247,0.12)',
            borderTop: '1px solid rgba(79,110,247,0.25)',
            padding: '15px 52px',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 15, color: '#8892A4' }}>
            See exactly what your representative is trading
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#4F6EF7',
              letterSpacing: 0.3,
            }}
          >
            civicwatch.app
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
