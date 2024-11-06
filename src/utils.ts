export const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export enum ChunkTypes {
    IHDR = 'IHDR',
    acTL = 'acTL',
    fcTL = 'fcTL',
    fdAT = 'fdAT',
    IDAT = 'IDAT',
    IEND = 'IEND'
}

export interface IFrame {
    top: number,
    left: number,
    width: number;
    height: number;
    delayNum: number;
    delayDen: number;
    delay: number;
    disposeOp: number;
    blendOp: number;
}

export interface IAPNG {
    width: number;
    height: number;
    frameCount: number;
    loopCount: number;
    frames: Frame[]
}

export class Frame implements IFrame {
    public frameChunks?: Uint8Array[] = [];

    constructor(
        public top: number,
        public left: number,
        public width: number,
        public height: number,
        public delayNum: number,
        public delayDen: number,
        public delay: number,
        public disposeOp: number,
        public blendOp: number,
        public imageData: Uint8Array,
    ) {
    }
}


export class APNG implements IAPNG {
    constructor(
        public width: number,
        public height: number,
        public frameCount: number,
        public loopCount: number,
        public frames: Frame[]
    ) { }
}

export const createApng = (): APNG => new APNG(0, 0, 0, 0, []);
export const createFrame = (): Frame => new Frame(0, 0, 0, 0, 0, 0, 0, 0, 0, new Uint8Array);

export const options: Object = {

}

export function readInt32(buffer: Uint8Array, offset: number): number {
    return (buffer[offset] << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | (buffer[offset + 3] >>> 0);
}

export function readInt16(buffer: Uint8Array, offset: number): number {
    return (buffer[offset] << 8) | (buffer[offset + 1] >>> 0);
}

export function getSequenceNumber(buffer: Uint8Array) {
    return (
        (buffer[0] << 24) |
        (buffer[1] << 16) |
        (buffer[2] << 8) |
        (buffer[3])
    )
}

export function getChunkType(buffer: Uint8Array, offset: number): string {
    const a = buffer[offset + 4];
    const b = buffer[offset + 5];
    const c = buffer[offset + 6];
    const d = buffer[offset + 7];
    return String.fromCharCode(a, b, c, d);
}


export function uint32ToUint8Array(value: number): Uint8Array {
    const arr = new Uint8Array(4);
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
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}
