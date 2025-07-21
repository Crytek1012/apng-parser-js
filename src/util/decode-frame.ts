import { inflateSync } from 'zlib';
import { decodePixelData } from './decode-pixel';
import { ColorType, FilterType } from '../util/constants';

function unfilterPNG(data: Buffer, width: number, height: number, bpp: number): Buffer {
    const stride = width * bpp;
    const out = Buffer.alloc(height * stride);
    let pos = 0;
    let outPos = 0;

    for (let y = 0; y < height; y++) {
        const filterType = data[pos++];
        switch (filterType) {
            case FilterType.None:
                data.copy(out, outPos, pos, pos + stride);
                break;

            case FilterType.Sub:
                for (let x = 0; x < stride; x++) {
                    const left = x >= bpp ? out[outPos + x - bpp] : 0;
                    out[outPos + x] = (data[pos + x] + left) & 0xff;
                }
                break;

            case FilterType.Up:
                for (let x = 0; x < stride; x++) {
                    const up = y > 0 ? out[outPos + x - stride] : 0;
                    out[outPos + x] = (data[pos + x] + up) & 0xff;
                }
                break;

            case FilterType.Average:
                for (let x = 0; x < stride; x++) {
                    const left = x >= bpp ? out[outPos + x - bpp] : 0;
                    const up = y > 0 ? out[outPos + x - stride] : 0;
                    out[outPos + x] = (data[pos + x] + Math.floor((left + up) / 2)) & 0xff;
                }
                break;

            case FilterType.Paeth:
                for (let x = 0; x < stride; x++) {
                    const left = x >= bpp ? out[outPos + x - bpp] : 0;
                    const up = y > 0 ? out[outPos + x - stride] : 0;
                    const upLeft = x >= bpp && y > 0 ? out[outPos + x - stride - bpp] : 0;
                    const p = left + up - upLeft;
                    const pa = Math.abs(p - left);
                    const pb = Math.abs(p - up);
                    const pc = Math.abs(p - upLeft);
                    let paeth = 0;
                    if (pa <= pb && pa <= pc) paeth = left;
                    else if (pb <= pc) paeth = up;
                    else paeth = upLeft;
                    out[outPos + x] = (data[pos + x] + paeth) & 0xff;
                }
                break;

            default:
                throw new Error('Unknown PNG filter type: ' + filterType);
        }
        pos += stride;
        outPos += stride;
    }

    return out;
}

interface FrameData {
    width: number;
    height: number;
    bitDepth: number;
    colorType: ColorType;
    palette?: Buffer | null;
    transparency?: Buffer | null;
}

export function decodeFrameRGBA(frameData: Buffer, frame: FrameData): Buffer {
    const inflated = inflateSync(frameData);

    let bpp: number;
    switch (frame.colorType) {
        case 0: bpp = 1; break; // grayscale, 8 bits = 1 byte
        case 2: bpp = 3; break; // truecolor RGB
        case 3: bpp = 1; break; // indexed-color
        case 4: bpp = 2; break; // grayscale + alpha
        case 6: bpp = 4; break; // truecolor + alpha
        default: throw new Error('Unsupported colorType ' + frame.colorType);
    }

    // scanlines
    const rawPixels = unfilterPNG(inflated, frame.width, frame.height, bpp);

    // raw pixel data to RGBA
    return decodePixelData(rawPixels, frame);
}
