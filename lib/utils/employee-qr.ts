// lib/utils/employee-qr.ts
// Dependency-free QR Code generator (byte mode, ECC level M, auto version).
// Port of the public-domain Nayuki QR Code generator (TypeScript), trimmed to
// the features the Employee Module needs: encode a short string (e.g. asset tag)
// into a boolean module matrix that components/employee/qr-code.tsx renders.
// No external dependencies are added (package.json is intentionally untouched).

type Bit = number;

const ECC_CODEWORDS_PER_BLOCK: Record<number, number[]> = {
  // index by ECC level (0=L,1=M,2=Q,3=H) then version-1
  0: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18],
  1: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26],
  2: [0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24],
  3: [0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28],
};
const NUM_ERROR_CORRECTION_BLOCKS: Record<number, number[]> = {
  0: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4],
  1: [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5],
  2: [0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8],
  3: [0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8],
};

const ECC_LEVEL_M = 1;

function reedSolomonComputeDivisor(degree: number): number[] {
  let result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = ((result[j] ?? 0) << 1) ^ ((j === 0 ? root : 0));
      if (result[j] !== undefined && (result[j] & 0x100) !== 0) {
        result[j] ^= 0x11d;
      }
    }
    root = (root << 1) ^ ((root & 0x80) !== 0 ? 0x11d : 0);
  }
  return result;
}

function reedSolomonComputeRemainder(data: number[], divisor: number[]): number[] {
  const result = new Array<number>(divisor.length).fill(0);
  for (const b of data) {
    const factor = b ^ (result.shift() ?? 0);
    result.push(0);
    divisor.forEach((coef, i) => {
      result[i] ^= reedSolomonMultiply(coef, factor);
    });
  }
  return result;
}

function reedSolomonMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z & 0x80) !== 0 ? 0x11d : 0);
    z ^= ((y >> i) & 1) * x;
  }
  return z & 0xff;
}

function getNumDataCodewords(version: number): number {
  return (
    Math.floor((16 * version * version + 128 * version + 64) / 4) -
    ECC_CODEWORDS_PER_BLOCK[ECC_LEVEL_M][version] *
      NUM_ERROR_CORRECTION_BLOCKS[ECC_LEVEL_M][version]
  );
}

function getNumRawDataModules(version: number): number {
  return (
    16 * version * version +
    128 * version +
    64 -
    8 * ECC_CODEWORDS_PER_BLOCK[ECC_LEVEL_M][version] *
      NUM_ERROR_CORRECTION_BLOCKS[ECC_LEVEL_M][version] -
    4 * version * version - // finder + format
    8
  );
}

export interface QrMatrix {
  size: number;
  modules: boolean[][];
}

export function generateQrMatrix(text: string): QrMatrix {
  // Choose smallest version (1..10) that fits the data.
  const bytes = Array.from(new TextEncoder().encode(text));
  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const capacityBits = getNumDataCodewords(v) * 8;
    // byte mode header: 4 (mode) + 8/16 (length) + 4 (terminator) + 8*len
    const headerBits = v <= 9 ? 12 : 16;
    const needed = headerBits + 8 * bytes.length + 4;
    if (needed <= capacityBits) {
      version = v;
      break;
    }
  }
  if (version === 0) {
    throw new Error("Text too long for QR (max ~100 bytes for version 10).");
  }

  const dataCapacityBits = getNumDataCodewords(version) * 8;
  const bb: Bit[] = [];
  appendBits(bb, 0x4, 4); // byte mode
  if (version <= 9) appendBits(bb, bytes.length, 8);
  else appendBits(bb, bytes.length, 16);
  for (const b of bytes) appendBits(bb, b, 8);
  appendBits(bb, 0, Math.min(4, dataCapacityBits - bb.length));
  while (bb.length % 8 !== 0) bb.push(0);
  while (bb.length < dataCapacityBits) {
    bb.push(0xec, 0x11);
  }
  const dataCodewords = bytesToCodewords(bb);

  const ecc = ECC_CODEWORDS_PER_BLOCK[ECC_LEVEL_M][version];
  const nBlocks = NUM_ERROR_CORRECTION_BLOCKS[ECC_LEVEL_M][version];
  const divisor = reedSolomonComputeDivisor(ecc);

  const blockLen = Math.floor(dataCodewords.length / nBlocks);
  const blocks: number[][] = [];
  const shortBlocks: number[][] = [];
  for (let i = 0, off = 0; i < nBlocks; i++) {
    const len = blockLen + (i < dataCodewords.length % nBlocks ? 1 : 0);
    const blk = dataCodewords.slice(off, off + len);
    off += len;
    blocks.push(blk);
    const rem = reedSolomonComputeRemainder(blk, divisor);
    shortBlocks.push(rem);
  }

  const result: number[] = [];
  for (let i = 0; i < blockLen + 1; i++) {
    for (let j = 0; j < blocks.length; j++) {
      if (i < blocks[j].length) result.push(blocks[j][i]);
    }
  }
  for (let i = 0; i < ecc; i++) {
    for (const sb of shortBlocks) result.push(sb[i]);
  }

  return drawModules(version, result);
}

function bytesToCodewords(bits: Bit[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] ?? 0);
    out.push(byte);
  }
  return out;
}

function appendBits(arr: Bit[], val: number, len: number) {
  for (let i = len - 1; i >= 0; i--) arr.push((val >>> i) & 1);
}

function drawModules(version: number, data: number[]): QrMatrix {
  const size = version * 4 + 17;
  const modules: boolean[][] = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false)
  );
  const isFn: boolean[][] = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false)
  );

  // Finder patterns
  drawFinder(modules, isFn, 0, 0);
  drawFinder(modules, isFn, size - 7, 0);
  drawFinder(modules, isFn, 0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const v = i % 2 === 0;
    set(modules, isFn, 6, i, v, true);
    set(modules, isFn, i, 6, v, true);
  }

  // Alignment patterns
  const alignCoords = alignmentPatternPositions(version);
  for (const [r, c] of alignCoords) {
    if (isFn[r][c]) continue;
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const on = Math.max(Math.abs(dr), Math.abs(dc)) !== 2;
        set(modules, isFn, r + dr, c + dc, on, true);
      }
    }
  }

  // Dark module
  set(modules, isFn, 8, size - 8, true, true);

  // Data placement (zig-zag)
  let bitIndex = 0;
  let dir = -1;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let row = 0; row < size; row++) {
      for (let c = 0; c < 2; c++) {
        const r = dir > 0 ? size - 1 - row : row;
        if (!isFn[r][col - c]) {
          const bit = ((data[bitIndex >>> 3] ?? 0) >> (7 - (bitIndex & 7))) & 1;
          bitIndex++;
          set(modules, isFn, r, col - c, bit === 1, true);
        }
      }
    }
    dir = -dir;
  }

  applyBestMask(modules, isFn, version, size);
  return { size, modules };
}

function applyBestMask(
  modules: boolean[][],
  isFn: boolean[][],
  version: number,
  size: number
) {
  let bestMask = 0;
  let bestPenalty = Infinity;
  for (let m = 0; m < 8; m++) {
    const masked = maskCopy(modules, isFn, m, size);
    drawFormatBits(masked, isFn, m, version, size);
    const penalty = computePenalty(masked, isFn, size);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = m;
    }
  }
  // Apply best mask permanently
  const final = maskCopy(modules, isFn, bestMask, size);
  drawFormatBits(final, isFn, bestMask, version, size);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) modules[r][c] = final[r][c];
}

function maskCopy(
  modules: boolean[][],
  isFn: boolean[][],
  mask: number,
  size: number
): boolean[][] {
  const out = modules.map((row) => row.slice());
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!isFn[r][c] && getMaskBit(mask, r, c)) out[r][c] = !out[r][c];
  return out;
}

function getMaskBit(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    default: return false;
  }
}

function drawFormatBits(
  modules: boolean[][],
  isFn: boolean[][],
  mask: number,
  _version: number,
  size: number
) {
  // Format info = (15 bits). ECC level M has type bits 0b00, which yields the
  // base constant 0x5412 when mask=0. Mask index is OR-ed into bits 10..12.
  const full = (0x5412 | (mask << 10)) & 0x7fff;
  for (let i = 0; i <= 5; i++) set(modules, isFn, 8, i, ((full >>> i) & 1) === 1, true);
  set(modules, isFn, 8, 7, ((full >>> 6) & 1) === 1, true);
  set(modules, isFn, 8, 8, ((full >>> 7) & 1) === 1, true);
  set(modules, isFn, 7, 8, ((full >>> 8) & 1) === 1, true);
  for (let i = 9; i < 15; i++)
    set(modules, isFn, 14 - i, 8, ((full >>> i) & 1) === 1, true);
  for (let i = 0; i < 8; i++)
    set(modules, isFn, size - 1 - i, 8, ((full >>> i) & 1) === 1, true);
  for (let i = 8; i < 15; i++)
    set(modules, isFn, 8, size - 15 + i, ((full >>> i) & 1) === 1, true);
  set(modules, isFn, 8, size - 8, true, true);
}

function computePenalty(
  modules: boolean[][],
  _isFn: boolean[][],
  size: number
): number {
  let penalty = 0;
  // Rule 1: rows/columns of 5+ same color
  for (let r = 0; r < size; r++) {
    let run = 1;
    for (let c = 1; c < size; c++) {
      if (modules[r][c] === modules[r][c - 1]) {
        run++;
        if (run === 5) penalty += 3;
        else if (run > 5) penalty += 1;
      } else run = 1;
    }
  }
  for (let c = 0; c < size; c++) {
    let run = 1;
    for (let r = 1; r < size; r++) {
      if (modules[r][c] === modules[r - 1][c]) {
        run++;
        if (run === 5) penalty += 3;
        else if (run > 5) penalty += 1;
      } else run = 1;
    }
  }
  // Rule 2: 2x2 blocks
  for (let r = 0; r < size - 1; r++)
    for (let c = 0; c < size - 1; c++) {
      const v = modules[r][c];
      if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1])
        penalty += 3;
    }
  return penalty;
}

function drawFinder(
  modules: boolean[][],
  isFn: boolean[][],
  top: number,
  left: number
) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = top + r;
      const cc = left + c;
      if (rr < 0 || rr >= modules.length || cc < 0 || cc >= modules.length) continue;
      const inBounds = r >= 0 && r <= 6 && c >= 0 && c <= 6;
      const on =
        inBounds && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
      set(modules, isFn, rr, cc, on, true);
    }
  }
}

function alignmentPatternPositions(version: number): [number, number][] {
  const coords: number[] =
    version === 1
      ? []
      : version === 2
      ? [6, 18]
      : version === 3
      ? [6, 22]
      : version === 4
      ? [6, 26]
      : version === 5
      ? [6, 30]
      : version === 6
      ? [6, 34]
      : version === 7
      ? [6, 22, 38]
      : version === 8
      ? [6, 24, 42]
      : version === 9
      ? [6, 26, 46]
      : [6, 28, 50];
  const out: [number, number][] = [];
  for (const r of coords)
    for (const c of coords)
      if (!(r === 6 && c === 6) && !(r === 6 && c === coords[coords.length - 1]) && !(r === coords[coords.length - 1] && c === 6))
        out.push([r, c]);
  return out;
}

function set(
  modules: boolean[][],
  isFn: boolean[][],
  r: number,
  c: number,
  v: boolean,
  fn: boolean
) {
  if (r < 0 || c < 0 || r >= modules.length || c >= modules.length) return;
  modules[r][c] = v;
  if (fn) isFn[r][c] = true;
}
