import {
    APNG,
    ChunkTypes,
    createApng,
    createFrame,
    getChunkType,
    createChunk,
    uint32ToUint8Array,
    PNG_SIGNATURE,
    readInt16,
    readInt32,
    concatUint8Arrays
} from './utils.js'


/**
 * Parses an APNG buffer and returns its metadata
 * @param buffer the buffer of the file
 * @returns
 */
export default function apngParser(buffer: Buffer | Uint8Array): APNG {

    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

    const maxLength = Math.min(PNG_SIGNATURE.length, bytes.length);
    for (let i = 0; i < maxLength; i++) {
        if (bytes[i] !== PNG_SIGNATURE[i]) {
            throw new Error('Invalid PNG Signature.');
        }
    }

    let offset = 8;
    const apng = createApng();
    let headerBytes = new Uint8Array(13);
    let frame = null;

    const metadataChunks = [];
    const trailerChunks = [];

    while (offset < bytes.length) {
        const chunkLength = readInt32(bytes, offset);
        const chunkType = getChunkType(bytes, offset);
        const chunk = bytes.subarray(offset + 8, offset + 8 + chunkLength);

        switch (chunkType) {
            case ChunkTypes.IHDR:
                headerBytes.set(chunk); // Directly set header bytes
                apng.width = readInt32(chunk, 0);
                apng.height = readInt32(chunk, 4);
                break;

            case ChunkTypes.acTL:
                apng.frameCount = readInt32(chunk, 8);
                apng.loopCount = readInt32(chunk, 12);
                break;

            case ChunkTypes.fcTL:
                if (frame) {
                    apng.frames.push(frame);
                }
                frame = createFrame();
                frame.width = readInt32(chunk, 4);
                frame.height = readInt32(chunk, 8);
                frame.left = readInt32(chunk, 12);
                frame.top = readInt32(chunk, 16);

                const delayNum = readInt16(chunk, 20);
                const delayDem = readInt16(chunk, 22) || 100;
                frame.delay = Math.max((delayNum / delayDem) * 1000, 100);

                frame.disposeOp = chunk[24];
                frame.blendOp = chunk[25];
                frame.frameChunks = [];
                if (apng.frames.length === 0 && frame.disposeOp === 2) frame.disposeOp = 1;
                break;

            case ChunkTypes.IDAT:
            case ChunkTypes.fdAT:
                if (frame && frame.frameChunks) {
                    frame.frameChunks.push(chunk.subarray(chunkType === ChunkTypes.fdAT ? 4 : 0));
                }
                break;

            case ChunkTypes.IEND:
                trailerChunks.push(bytes.subarray(offset, offset + 12 + chunkLength));
                break;

            default:
                metadataChunks.push(bytes.subarray(offset, offset + 12 + chunkLength));
                break;
        }

        offset += 8 + chunkLength + 4;
    }

    if (frame) {
        apng.frames.push(frame);
    }

    if (apng.frames.length === 0) throw new Error('Failed to extract APNG frames.');

    for (const frame of apng.frames) {
        const uint8ArrayBuffer: Uint8Array[] = [PNG_SIGNATURE];

        headerBytes.set(uint32ToUint8Array(frame.width), 0);
        headerBytes.set(uint32ToUint8Array(frame.height), 4);
        uint8ArrayBuffer.push(createChunk('IHDR', headerBytes));
        uint8ArrayBuffer.push(...metadataChunks);

        if (frame.frameChunks) {
            frame.frameChunks.forEach(unit => {
                uint8ArrayBuffer.push(createChunk('IDAT', unit));
            });
        }

        uint8ArrayBuffer.push(...trailerChunks);
        frame.imageData = concatUint8Arrays(uint8ArrayBuffer);;
        delete frame.frameChunks;
    }

    return apng;
}


