// components/employee/qr-code.tsx
"use client";
import { useMemo } from "react";
import { generateQrMatrix } from "@/lib/utils/employee-qr";

export function QrCode({
  value,
  size = 160,
  className = "",
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const matrix = useMemo(() => {
    try {
      return generateQrMatrix(value);
    } catch {
      return null;
    }
  }, [value]);

  if (!matrix) {
    return (
      <div className={`flex items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400 ${className}`} style={{ width: size, height: size }}>
        QR unavailable
      </div>
    );
  }

  const cell = Math.floor((size - 16) / matrix.size);
  const dim = cell * matrix.size;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${dim} ${dim}`}
      className={`rounded-lg bg-white p-2 ${className}`}
      role="img"
      aria-label={`QR code for ${value}`}
    >
      <rect width={dim} height={dim} fill="#ffffff" />
      {matrix.modules.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#0f172a" />
          ) : null
        )
      )}
    </svg>
  );
}

export function downloadQr(value: string, filename = "qrcode.svg") {
  try {
    const m = generateQrMatrix(value);
    const size = 240;
    const cell = Math.floor(size / m.size);
    const dim = cell * m.size;
    let rects = `<rect width="${dim}" height="${dim}" fill="#ffffff"/>`;
    for (let r = 0; r < m.size; r++)
      for (let c = 0; c < m.size; c++)
        if (m.modules[r][c])
          rects += `<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}" fill="#0f172a"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}">${rects}</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
}
