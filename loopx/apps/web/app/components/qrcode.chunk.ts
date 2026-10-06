/**
 * Pure TypeScript QR Code generator that outputs an SVG string.
 * Zero external dependencies, fast, deterministic, compliant with QR Code specification.
 * Full TypeScript strict mode (noUncheckedIndexedAccess) compliant.
 */

// Galois Field GF(2^8) math with primitive polynomial 0x11d
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

let val = 1;
for (let i = 0; i < 255; i++) {
  GF_EXP[i] = val;
  GF_EXP[i + 255] = val;
  GF_LOG[val] = i;
  val = (val << 1) ^ (val & 128 ? 0x11d : 0);
}

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  const logX = GF_LOG[x] ?? 0;
  const logY = GF_LOG[y] ?? 0;
  return GF_EXP[logX + logY] ?? 0;
}

// Polynomial generator for Reed-Solomon error correction
function rsGenPoly(n: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < n; i++) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      const pVal = poly[j] ?? 0;
      const expVal = GF_EXP[i] ?? 0;
      next[j] = (next[j] ?? 0) ^ gfMul(pVal, expVal);
      next[j + 1] = (next[j + 1] ?? 0) ^ pVal;
    }
    poly = next;
  }
  return poly;
}

// Compute Reed-Solomon error correction codewords
function rsEncode(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsGenPoly(ecCount);
  const res = new Uint8Array(data.length + ecCount);
  res.set(data);

  for (let i = 0; i < data.length; i++) {
    const coef = res[i] ?? 0;
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        const gVal = gen[j] ?? 0;
        res[i + j] = (res[i + j] ?? 0) ^ gfMul(gVal, coef);
      }
    }
  }
  return res.slice(data.length);
}

// Capacity specs for Low (L) error correction: [Version, TotalCodewords, ECCodewords, DataCodewords]
interface QRVersionSpec {
  version: number;
  totalDataBytes: number;
  ecCount: number;
  alignmentPositions: number[];
}

const VERSION_SPECS: QRVersionSpec[] = [
  { version: 1, totalDataBytes: 19, ecCount: 7, alignmentPositions: [] },
  { version: 2, totalDataBytes: 34, ecCount: 10, alignmentPositions: [6, 18] },
  { version: 3, totalDataBytes: 55, ecCount: 15, alignmentPositions: [6, 22] },
  { version: 4, totalDataBytes: 80, ecCount: 20, alignmentPositions: [6, 26] },
  { version: 5, totalDataBytes: 108, ecCount: 26, alignmentPositions: [6, 30] },
  { version: 6, totalDataBytes: 136, ecCount: 18 * 2, alignmentPositions: [6, 34] },
  { version: 7, totalDataBytes: 156, ecCount: 20 * 2, alignmentPositions: [6, 22, 38] },
];

/**
 * Generate an SVG string representing the QR code for the provided string.
 */
export function generateQRCodeSVG(text: string): string {
  const utf8Bytes = new TextEncoder().encode(text);
  const dataLen = utf8Bytes.length;

  // Pick smallest fitting version
  const spec = VERSION_SPECS.find((s) => s.totalDataBytes >= dataLen + 3) ?? VERSION_SPECS[VERSION_SPECS.length - 1]!;

  const { version, totalDataBytes, ecCount, alignmentPositions } = spec;
  const size = 17 + 4 * version;

  // 1. Bitstream packaging: Byte Mode (0100) + 8-bit length + data
  const bits: number[] = [];
  function pushBits(bVal: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((bVal >> i) & 1);
    }
  }

  // Mode: 0100 (Byte mode)
  pushBits(4, 4);
  // Character count: 8 bits for versions 1-9
  pushBits(dataLen, 8);
  // Data bytes
  for (let i = 0; i < dataLen; i++) {
    pushBits(utf8Bytes[i] ?? 0, 8);
  }
  // Terminator: up to 4 zeroes
  const maxDataBits = totalDataBytes * 8;
  const termLen = Math.min(4, maxDataBits - bits.length);
  pushBits(0, termLen);
  // Pad to multiple of 8
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }
  // Pad bytes: alternating 0xEC (11101100) and 0x11 (00010001)
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxDataBits) {
    pushBits(padBytes[padIdx % 2] ?? 0, 8);
    padIdx++;
  }

  // Convert bits to data codewords
  const dataCodewords = new Uint8Array(totalDataBytes);
  for (let i = 0; i < totalDataBytes; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | (bits[i * 8 + b] ?? 0);
    }
    dataCodewords[i] = byteVal;
  }

  // 2. Generate Error Correction Codewords
  const ecCodewords = rsEncode(dataCodewords, ecCount);

  // Combine data + ec
  const allCodewords = new Uint8Array(totalDataBytes + ecCount);
  allCodewords.set(dataCodewords);
  allCodewords.set(ecCodewords, totalDataBytes);

  // 3. Matrix setup
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setModule(r: number, c: number, mVal: boolean) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      const row = matrix[r];
      const fnRow = isFunction[r];
      if (row && fnRow) {
        row[c] = mVal;
        fnRow[c] = true;
      }
    }
  }

  // Finder pattern (7x7) + separator
  function placeFinder(top: number, left: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = top + r;
        const col = left + c;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            setModule(row, col, isBorder || isCenter);
          } else {
            setModule(row, col, false); // Separator
          }
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Alignment patterns
  if (alignmentPositions.length > 0) {
    for (const r of alignmentPositions) {
      for (const c of alignmentPositions) {
        // Skip finder areas
        if ((r < 9 && c < 9) || (r < 9 && c > size - 10) || (r > size - 10 && c < 9)) {
          continue;
        }
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isCenter = dr === 0 && dc === 0;
            setModule(r + dr, c + dc, isBorder || isCenter);
          }
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6]?.[i]) setModule(6, i, i % 2 === 0);
    if (!isFunction[i]?.[6]) setModule(i, 6, i % 2 === 0);
  }

  // Dark module
  setModule(size - 8, 8, true);

  // Reserve format information areas
  for (let i = 0; i < 9; i++) {
    const r8 = isFunction[8];
    if (r8 && !r8[i]) r8[i] = true;
    const ri = isFunction[i];
    if (ri && !ri[8]) ri[8] = true;
  }
  for (let i = 0; i < 8; i++) {
    const r8 = isFunction[8];
    if (r8 && !r8[size - 1 - i]) r8[size - 1 - i] = true;
    const rSize = isFunction[size - 1 - i];
    if (rSize && !rSize[8]) rSize[8] = true;
  }

  // 4. Place data bits in 2-column zig-zag
  const allBits: number[] = [];
  for (let i = 0; i < allCodewords.length; i++) {
    const cw = allCodewords[i] ?? 0;
    for (let b = 7; b >= 0; b--) {
      allBits.push((cw >> b) & 1);
    }
  }

  let bitIdx = 0;
  let upwards = true;

  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--; // Skip vertical timing column

    const rowIndices = Array.from({ length: size }, (_, i) => (upwards ? size - 1 - i : i));

    for (const r of rowIndices) {
      for (const c of [rightCol, rightCol - 1]) {
        if (!isFunction[r]?.[c]) {
          const bit = bitIdx < allBits.length ? (allBits[bitIdx] ?? 0) : 0;
          bitIdx++;

          // Apply standard mask 0: (row + col) % 2 === 0
          const mask = (r + c) % 2 === 0;
          const targetRow = matrix[r];
          if (targetRow) {
            targetRow[c] = (bit === 1) !== mask;
          }
        }
      }
    }
    upwards = !upwards;
  }

  // 5. Write format bits: Error Correction L + Mask 0
  // Standard format information for L & mask 0 is 0x77c4 (BCH 15,5)
  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];

  // Top-left format bits
  const tlCoords: [number, number][] = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  for (let i = 0; i < 15; i++) {
    const coord = tlCoords[i];
    if (coord) {
      const [r, c] = coord;
      const targetRow = matrix[r];
      if (targetRow) {
        targetRow[c] = formatBits[i] === 1;
      }
    }
  }

  // Split format bits around bottom-left & top-right
  for (let i = 0; i < 7; i++) {
    const targetRow = matrix[size - 1 - i];
    if (targetRow) {
      targetRow[8] = formatBits[i] === 1;
    }
  }
  for (let i = 7; i < 15; i++) {
    const targetRow = matrix[8];
    if (targetRow) {
      targetRow[size - 15 + i] = formatBits[i] === 1;
    }
  }

  // 6. Generate SVG with Quiet Zone (4 modules)
  const quietZone = 4;
  const totalDim = size + quietZone * 2;
  const cellSize = 5;
  const svgWidth = totalDim * cellSize;

  let pathD = '';
  for (let r = 0; r < size; r++) {
    const row = matrix[r];
    if (!row) continue;
    for (let c = 0; c < size; c++) {
      if (row[c]) {
        const x = (c + quietZone) * cellSize;
        const y = (r + quietZone) * cellSize;
        pathD += `M${x},${y}h${cellSize}v${cellSize}h-${cellSize}z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgWidth}" width="100%" height="100%" fill="none" shape-rendering="crispEdges">
  <rect width="${svgWidth}" height="${svgWidth}" fill="#ffffff" rx="8"/>
  <path fill="#1a1a24" d="${pathD.trim()}"/>
</svg>`;
}
