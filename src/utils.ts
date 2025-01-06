import { writeFileSync } from 'fs';
import { inflate } from 'zlib';

export const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export enum ChunkTypes {
    IHDR = 'IHDR',
    acTL = 'acTL',
    fcTL = 'fcTL',
    fdAT = 'fdAT',
    IDAT = 'IDAT',
    IEND = 'IEND',
    PLTE = 'PLTE'
}

export enum FilterTypes {
    None = 0,
    Sub = 1,
    Up = 2,
    Average = 3,
    Paeth = 4
}

export class Frame {
    constructor(
        public top: number = 0,
        public left: number = 0,
        public width: number = 0,
        public height: number = 0,
        public delayNum: number = 0,
        public delayDen: number = 0,
        public delay: number = 0,
        public disposeOp: number = 0,
        public blendOp: number = 0,
        public imageData: Uint8Array = new Uint8Array()
    ) { }

    save(path: string) {
        if (!path) throw new Error('A valid path must be provided!');
        writeFileSync(`${path}/frame.png`, Buffer.from(this.imageData))
    }
}

export class APNG {

    public isRaw: Boolean = false;

    constructor(
        public width: number = 0,
        public height: number = 0,
        public bitDepth: number = 0,
        public colorType: number = 0,
        public compressionMethod: number = 0,
        public filterMethod: number = 0,
        public interlaceMethod: number = 0,
        public palette: Uint8Array = new Uint8Array(0),
        public frameCount: number = 0,
        public loopCount: number = 0,
        public frames: Frame[] = []
    ) { }

    parsePalette() {
        const colors: number[][] = [];
        for (let i = 0; i < this.palette.length; i += 3) {
            const r = this.palette[i];
            const g = this.palette[i + 1];
            const b = this.palette[i + 2];
            colors.push([r, g, b]);
        }

        return colors;
    }

    saveFrames(path: string) {
        if (!path) throw new Error('A valid path must be provided!')

        for (let i = 0; i < this.frames.length; i++) {
            writeFileSync(`${path}/frame_${i}.png`, this.frames[i].imageData)
        }
    }
}

export const defaultParserOptions = {
    raw: false
}

export function readUInt32(buffer: Uint8Array, offset: number): number {
    return (buffer[offset] << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | (buffer[offset + 3] >>> 0);
}

export function readUInt16(buffer: Uint8Array, offset: number): number {
    return (buffer[offset] << 8) | (buffer[offset + 1] >>> 0);
}

export function getChunkType(buffer: Uint8Array, offset: number): string {
    const a = buffer[offset + 4];
    const b = buffer[offset + 5];
    const c = buffer[offset + 6];
    const d = buffer[offset + 7];
    return String.fromCharCode(a, b, c, d);
}


export function uint32ToUint8Array(value: number): Uint8Array {
    const arr = new Uint8Array(4)
    new DataView(arr.buffer).setUint32(0, value);
    return arr;
}

export function createChunk(type: string, dataBytes: Uint8Array): Uint8Array {
    const length = dataBytes.length;
    const totalLength = 4 + type.length + length + 4; // Total size: length + type + data + CRC
    const bytes = new Uint8Array(totalLength);
    const dv = new DataView(bytes.buffer);

    dv.setUint32(0, length);

    for (let i = 0; i < type.length; i++) {
        bytes[4 + i] = type.charCodeAt(i);
    }

    bytes.set(dataBytes, 4 + type.length);

    const crcValue = CRC32.crc32(bytes.subarray(4, totalLength - 4));
    dv.setUint32(totalLength - 4, crcValue);

    return bytes;
}

const CRC32 = (() => {
    const table = new Int32Array(256);
    const polynomial = -306674912; // 0xEDB88320 in signed form

    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (polynomial ^ (c >>> 1)) : (c >>> 1);
        }
        table[n] = c;
    }

    function crc32(buffer: Uint8Array) {
        let crc = -1;
        const length = buffer.length;

        for (let i = 0; i < length; i++) {
            crc = (crc >>> 8) ^ table[(crc ^ buffer[i]) & 0xFF];
        }

        return crc ^ -1;
    }

    return { crc32 };
})();

export function concatUint8Arrays(arrays: Array<Uint8Array>) {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (let i = 0; i < arrays.length; i++) {
        result.set(arrays[i], offset);
        offset += arrays[i].length;
    }
    return result;
}