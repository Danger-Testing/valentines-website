import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';

  // Fetch the flowerhand.png image
  const imageUrl = new URL('/flowerhand.png', request.url).toString();

  // Load Neue Haas Grotesk Display font
  const fontUrl = new URL('/NeueHaasDisplayRoman.ttf', request.url).toString();
  const fontData = await fetch(fontUrl).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          fontFamily: 'Neue Haas Grotesk Display',
          position: 'relative',
        }}
      >
        {/* Left half - From name */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '45%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: '72px',
              fontWeight: 400,
              color: '#EA1F16',
              textTransform: 'lowercase',
            }}
          >
            {from || 'someone'}
          </span>
        </div>
        {/* Center - Flowerhand image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          width={420}
          height={420}
          style={{
            objectFit: 'contain',
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Right half - To name */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '45%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: '72px',
              fontWeight: 400,
              color: '#EA1F16',
              textTransform: 'lowercase',
            }}
          >
            {to || 'you'}
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Neue Haas Grotesk Display',
          data: fontData,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );
}
