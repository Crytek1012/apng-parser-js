export const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export enum ChunkType {
    IHDR = 'IHDR',
    acTL = 'acTL',
    fcTL = 'fcTL',
    fdAT = 'fdAT',
    IDAT = 'IDAT',
    IEND = 'IEND',
    PLTE = 'PLTE',
    tRNS = 'tRNS'
}

export enum FilterType {
    None = 0,
    Sub = 1,
    Up = 2,
    Average = 3,
    Paeth = 4
}

export enum ColorType {
    Grayscale = 0,
    Truecolor = 2,
    IndexedColor = 3,
    GrayscaleAlpha = 4,
    TruecolorAlpha = 6,
}

export function isApng(buffer: Buffer): boolean {
    let offset = PNG_SIGNATURE.length;

    while (offset < buffer.length) {
        const length = buffer.readUInt32BE(offset);
        const type = buffer.toString('ascii', offset + 4, offset + 8);
        if (type === ChunkType.acTL) return true;
        if (type === ChunkType.IDAT || type === ChunkType.IEND) break;
        offset += 12 + length;
    }

    return false;
}