/**
 * @file Dynamic OpenGraph image generation.
 * Next.js automatically serves this at /opengraph-image and links it in metadata.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Netrokona University Programming Club (NEUPC)';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        background:
          'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          opacity: 0.15,
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-80px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
          opacity: 0.12,
          display: 'flex',
        }}
      />

      {/* Top bar accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)',
          display: 'flex',
        }}
      />

      {/* Code brackets icon */}
      <div
        style={{
          fontSize: 72,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <span style={{ color: '#6366f1', fontWeight: 700 }}>&lt;/&gt;</span>
      </div>

      {/* Club name */}
      <div
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-2px',
          textAlign: 'center',
          display: 'flex',
          lineHeight: 1.1,
        }}
      >
        NEUPC
      </div>

      {/* Full name */}
      <div
        style={{
          fontSize: 26,
          fontWeight: 400,
          color: '#94a3b8',
          marginTop: 12,
          textAlign: 'center',
          display: 'flex',
        }}
      >
        Netrokona University Programming Club
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 18,
          color: '#64748b',
          marginTop: 24,
          textAlign: 'center',
          maxWidth: '700px',
          lineHeight: 1.5,
          display: 'flex',
        }}
      >
        Competitive Programming • Workshops • Mentorship • ICPC Preparation
      </div>

      {/* Bottom domain */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          fontSize: 16,
          color: '#475569',
          letterSpacing: '1px',
          display: 'flex',
        }}
      >
        neupc.vercel.app
      </div>
    </div>,
    { ...size }
  );
}
