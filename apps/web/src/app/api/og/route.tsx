import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '800px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #06B6D4 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '24px',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
            border: '2px solid rgba(255,255,255,0.3)',
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-2px',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          Base NFT Airdrop
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            maxWidth: '700px',
          }}
        >
          Create & distribute NFTs to your community on Base
        </div>

        {/* Badge */}
        <div
          style={{
            marginTop: '48px',
            padding: '10px 28px',
            borderRadius: '100px',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.4)',
            color: 'white',
            fontSize: '20px',
            fontWeight: 600,
          }}
        >
          ⚡ Powered by Base
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800,
    },
  );
}
