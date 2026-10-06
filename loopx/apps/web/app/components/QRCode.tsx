'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from './icons/Hugeicons';

export interface QRCodeProps {
  value: string;
}

export const QRCode = ({ value }: QRCodeProps) => {
  const [svgData, setSvgData] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    import('./qrcode.chunk')
      .then(({ generateQRCodeSVG }) => {
        if (mounted) {
          try {
            setSvgData(generateQRCodeSVG(value));
          } catch {
            setError(true);
          }
        }
      })
      .catch(() => {
        if (mounted) {
          setError(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [value]);

  if (error) {
    return null;
  }

  if (!svgData) {
    return (
      <div className="w-52 h-52 mx-auto rounded-2xl bg-white border border-neutral-200/90 shadow-xs flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 text-[#6965db] animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="w-52 h-52 mx-auto p-2 bg-white rounded-2xl border border-neutral-200/90 shadow-xs flex items-center justify-center overflow-hidden transition-transform duration-200 hover:scale-[1.02]"
      role="img"
      aria-label="QR code for collaboration link"
      dangerouslySetInnerHTML={{ __html: svgData }}
    />
  );
};
