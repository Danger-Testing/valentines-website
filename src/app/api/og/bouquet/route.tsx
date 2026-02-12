import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';

  // Fetch the dynamicog.png image
  const imageUrl = new URL('/dynamicog.png', request.url).toString();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* From / To with image */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '40px',
          }}
        >
          <span
            style={{
              fontSize: '64px',
              fontWeight: 400,
              color: '#000000',
            }}
          >
            {from || 'Someone'}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            width={200}
            height={200}
            style={{
              objectFit: 'contain',
            }}
          />
          <span
            style={{
              fontSize: '64px',
              fontWeight: 400,
              color: '#000000',
            }}
          >
            {to || 'You'}
          </span>
        </div>
        {/* Logo at bottom */}
        <span
          style={{
            fontSize: '32px',
            fontWeight: 500,
            color: '#C2021B',
            marginTop: '60px',
            fontFamily: 'Helvetica, Arial, sans-serif',
          }}
        >
          link bouquet
        </span>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
