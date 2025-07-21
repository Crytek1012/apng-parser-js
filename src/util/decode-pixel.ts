import { ColorType } from '../util/constants';

function decodeGrayscale(data: Buffer, bitDepth: number): Buffer {
    if (bitDepth !== 8) throw new Error('Only 8-bit grayscale supported');
    const length = data.length;
    const rgba = Buffer.alloc(length * 4);
    for (let i = 0; i < length; i++) {
        const v = data[i], o = i << 2;
        rgba[o] = v;
        rgba[o + 1] = v;
        rgba[o + 2] = v;
        rgba[o + 3] = 255;
    }
    return rgba;
}

function decodeTruecolor(data: Buffer, bitDepth: number): Buffer {
    if (bitDepth !== 8) throw new Error('Only 8-bit truecolor supported');
    const pixelCount = data.length / 3;
    const rgba = Buffer.alloc(pixelCount * 4);
    for (let i = 0, j = 0; i < pixelCount; i++, j += 3) {
        const o = i << 2;
        rgba[o] = data[j];
        rgba[o + 1] = data[j + 1];
        rgba[o + 2] = data[j + 2];
        rgba[o + 3] = 255;
    }
    return rgba;
}

function decodeGrayscaleAlpha(data: Buffer, bitDepth: number): Buffer {
    if (bitDepth !== 8) throw new Error('Only 8-bit grayscale+alpha supported');
    const pixelCount = data.length / 2;
    const rgba = Buffer.alloc(pixelCount * 4);
    for (let i = 0; i < pixelCount; i++) {
        const v = data[i * 2];
        const a = data[i * 2 + 1];
        rgba[i * 4] = v;
        rgba[i * 4 + 1] = v;
        rgba[i * 4 + 2] = v;
        rgba[i * 4 + 3] = a;
    }
    return rgba;
}

function decodeTruecolorAlpha(data: Buffer, bitDepth: number): Buffer {
    if (bitDepth !== 8) throw new Error('Only 8-bit truecolor+alpha supported');
    const rgba = Buffer.alloc(data.length);
    data.copy(rgba);
    return rgba;
}

export function decodeIndexedToRGBA(pixelData: Buffer, palette: Buffer, transparency?: Buffer): Buffer {
    const numPixels = pixelData.length;
    const rgba = Buffer.alloc(numPixels * 4);

    for (let i = 0; i < numPixels; i++) {
        const idx = pixelData[i];
        const pOffset = idx * 3;

        rgba[i * 4] = palette[pOffset];
        rgba[i * 4 + 1] = palette[pOffset + 1];
        rgba[i * 4 + 2] = palette[pOffset + 2];

        if (transparency && transparency.length > idx) {
            rgba[i * 4 + 3] = transparency[idx];
        } else {
            rgba[i * 4 + 3] = 255;
        }
    }
    return rgba;
}

export function decodePixelData(pixelData: Buffer, ihdr: { colorType: ColorType; bitDepth: number; palette?: Buffer | null; transparency?: Buffer | null }): Buffer {
    switch (ihdr.colorType) {
        case 0: return decodeGrayscale(pixelData, ihdr.bitDepth);
        case 2: return decodeTruecolor(pixelData, ihdr.bitDepth);
        case 3:
            if (!ihdr.palette) throw new Error('Palette required for indexed color');
            return decodeIndexedToRGBA(pixelData, ihdr.palette, ihdr.transparency || undefined);
        case 4: return decodeGrayscaleAlpha(pixelData, ihdr.bitDepth);
        case 6: return decodeTruecolorAlpha(pixelData, ihdr.bitDepth);
        default: throw new Error(`Unsupported colorType: ${ihdr.colorType}`);
    }
}