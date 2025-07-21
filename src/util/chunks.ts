import { ChunkType } from "./constants";

export function createIHDRChunk(params: {
    width: number;
    height: number;
    bitDepth?: number;
    colorType?: number;
    compressionMethod?: number;
    filterMethod?: number;
    interlaceMethod?: number;
}): Buffer {
    const header = Buffer.alloc(13);
    header.writeUInt32BE(params.width, 0);
    header.writeUInt32BE(params.height, 4);
    header[8] = params.bitDepth || 8;
    header[9] = params.colorType || 3;
    header[10] = params.compressionMethod || 0;
    header[11] = params.filterMethod || 0;
    header[12] = params.interlaceMethod || 0;
    return createChunk(ChunkType.IHDR, header);
}

export function createChunk(type: ChunkType, data: Buffer): Buffer {
    const length = data.length;
    const chunk = Buffer.alloc(8 + length + 4); // length + type + data + crc

    chunk.writeUInt32BE(length, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);

    const crc = CRC32.crc32(chunk.subarray(4, 8 + length));
    chunk.writeUInt32BE(crc, 8 + length);

    return chunk;
}

const CRC32 = (() => {
    const table = new Uint32Array(256);
    const polynomial = 0xEDB88320;

    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (polynomial ^ (c >>> 1)) : (c >>> 1);
        }
        table[n] = c >>> 0;
    }

    function crc32(buffer: Uint8Array): number {
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < buffer.length; i++) {
            crc = (crc >>> 8) ^ table[(crc ^ buffer[i]) & 0xFF];
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    return { crc32 };
})();