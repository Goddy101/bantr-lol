import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Grab the dynamic data from the URL
    const winner = searchParams.get('winner') || 'Someone';
    const loser = searchParams.get('loser') || 'A Victim';
    const amount = searchParams.get('amount') || '10,000';
    const match = searchParams.get('match') || 'a match';
    const date = new Intl.DateTimeFormat('en-NG').format(new Date());

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#0a0a0a', // neutral-950
            color: 'white',
            fontFamily: 'sans-serif',
            padding: '60px',
            position: 'relative',
          }}
        >
          {/* Background Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(0,0,0,0) 70%)',
              borderRadius: '50%',
            }}
          />

          {/* Inner Border Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              border: '2px solid #262626', // neutral-800
              borderRadius: '32px',
              padding: '60px',
              backgroundColor: 'rgba(23, 23, 23, 0.8)', // neutral-900
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px 16px', background: 'rgba(220, 38, 38, 0.1)', color: '#ef4444', borderRadius: '100px', fontSize: '24px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  CERTIFIED COOKED
                </div>
              </div>
              <div style={{ fontSize: '24px', color: '#737373', fontWeight: 'bold' }}>{date}</div>
            </div>

            {/* Main Banter Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              <div style={{ fontSize: '72px', fontWeight: '900', lineHeight: 1.1 }}>
                <span style={{ color: '#4ade80' }}>@{winner}</span> just
              </div>
              <div style={{ fontSize: '72px', fontWeight: '900', lineHeight: 1.1 }}>
                robbed <span style={{ color: '#ef4444' }}>@{loser}</span>
              </div>
            </div>

            {/* Match Context */}
            <div style={{ display: 'flex', marginTop: '40px', fontSize: '32px', color: '#a3a3a3', fontWeight: 'bold' }}>
              during the {match} match.
            </div>

            <div style={{ flex: 1 }} />

            {/* Bottom Section: Amount & Watermark */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '24px', color: '#737373', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900', marginBottom: '8px' }}>
                  Amount Secured
                </div>
                <div style={{ fontSize: '84px', fontWeight: '900', color: '#eab308' }}>
                  ₦{amount}
                </div>
              </div>

              {/* Watermark / Brand */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#ffffff' }}>
                  bantr.lol
                </div>
                <div style={{ fontSize: '20px', color: '#4ade80', fontWeight: 'bold', marginTop: '8px' }}>
                  Put your money where your mouth is.
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
      }
    );
  } catch (e: any) {
    console.error(e);
    return new Response('Failed to generate receipt', { status: 500 });
  }
}