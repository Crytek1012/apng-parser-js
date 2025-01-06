import {
    APNG,
    ChunkTypes,
    getChunkType,
    createChunk,
    uint32ToUint8Array,
    readUInt16,
    readUInt32,
    concatUint8Arrays,
    PNG_SIGNATURE,
    Frame,
    defaultParserOptions
} from './utils.js'


/**
 * Parses an APNG buffer and returns its metadata
 * @param buffer the buffer of the file
 * @returns
 */
export default function apngParser(buffer: Uint8Array, options = defaultParserOptions): APNG {

    const bytes = buffer;
    const maxLength = Math.min(PNG_SIGNATURE.length, bytes.length);
    for (let i = 0; i < maxLength; i++) {
        if (bytes[i] !== PNG_SIGNATURE[i]) {
            throw new Error('Invalid PNG Signature. This is either not an APNG or the buffer has been corrupted.');
        }
    }

    let offset = 8;
    const apng = new APNG()
    let frame = null;
    const dataChunks: Uint8Array[][] = [[]];

    const headerBytes = new Uint8Array(13);
    const metadataChunks: Uint8Array[] = [];
    const trailerChunks: Uint8Array[] = [];

    while (offset < bytes.length) {
        const chunkLength = readUInt32(bytes, offset);
        const chunkType = getChunkType(bytes, offset);
        const chunk = bytes.subarray(offset + 8, offset + 8 + chunkLength);

        switch (chunkType) {
            case ChunkTypes.IHDR:
                headerBytes.set(chunk);
                apng.width = readUInt32(chunk, 0);
                apng.height = readUInt32(chunk, 4);
                apng.bitDepth = chunk[8]
                apng.colorType = chunk[9]
                apng.compressionMethod = chunk[10]
                apng.filterMethod = chunk[11]
                apng.interlaceMethod = chunk[12]
                break;

            case ChunkTypes.acTL:
                apng.frameCount = readUInt32(chunk, 0);
                apng.loopCount = readUInt32(chunk, 4);
                break;


            case ChunkTypes.PLTE:
                apng.palette = chunk;
                if (!options.raw) metadataChunks.push(bytes.subarray(offset, offset + 12 + chunkLength));
                break;

            case ChunkTypes.fcTL:
                if (frame) {
                    apng.frames.push(frame);
                    dataChunks.push([]);
                }

                frame = new Frame()
                frame.width = readUInt32(chunk, 4);
                frame.height = readUInt32(chunk, 8);
                frame.left = readUInt32(chunk, 12);
                frame.top = readUInt32(chunk, 16);

                const delayNum = readUInt16(chunk, 20);
                const delayDem = readUInt16(chunk, 22) || 100;
                frame.delay = Math.max((delayNum / delayDem) * 1000, 100);

                frame.disposeOp = chunk[24];
                frame.blendOp = chunk[25];
                if (apng.frames.length === 0 && frame.disposeOp === 2) frame.disposeOp = 1;
                break;

            case ChunkTypes.IDAT:
                dataChunks[dataChunks.length - 1].push(chunk)
                break;
            case ChunkTypes.fdAT:
                dataChunks[dataChunks.length - 1].push(chunk.subarray(4))
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

    if (apng.frames.length === 0) throw new Error('Failed to extract APNG frames. Could not find any IDAT or FdAT chunks.');

    let chunkIndex = 0;
    if (options.raw) {
        apng.isRaw = true;
        apng.frames.forEach((frame, i) => frame.imageData = concatUint8Arrays(dataChunks[i]))
    }
    else {
        for (const frame of apng.frames) {
            const bufferArray: Uint8Array[] = [PNG_SIGNATURE]

            headerBytes.set(uint32ToUint8Array(frame.width), 0);
            headerBytes.set(uint32ToUint8Array(frame.height), 4);

            bufferArray.push(createChunk('IHDR', headerBytes));
            bufferArray.push(...metadataChunks);

            dataChunks[chunkIndex].forEach(unit => {
                bufferArray.push(createChunk('IDAT', unit));
            });
            chunkIndex += 1;

            bufferArray.push(...trailerChunks);
            frame.imageData = concatUint8Arrays(bufferArray);
        }
    }

    return apng;
}