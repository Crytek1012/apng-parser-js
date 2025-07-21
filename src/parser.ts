import { APNG } from './structures/apng';
import { Frame, IFrameData } from './structures/frame';
import { ChunkType, PNG_SIGNATURE, isApng } from './util/constants';

export default function apngParser(buffer: Buffer): APNG {
    if (!isApng(buffer)) throw new Error('Invalid APNG buffer.');

    const apng = new APNG();
    const dataChunks: Buffer[][] = [[]];
    let currentFrame: IFrameData | null = null;
    let offset = PNG_SIGNATURE.length;

    let palette: Buffer | null = null;
    let transparency: Buffer | null = null;

    while (offset < buffer.length) {
        const length = buffer.readUInt32BE(offset);
        const type = buffer.toString('ascii', offset + 4, offset + 8);
        const chunk = buffer.subarray(offset + 8, offset + 8 + length);

        switch (type) {
            case ChunkType.IHDR:
                apng.width = chunk.readUInt32BE(0);
                apng.height = chunk.readUInt32BE(4);
                apng.bitDepth = chunk[8];
                apng.colorType = chunk[9];
                apng.compressionMethod = chunk[10];
                apng.filterMethod = chunk[11];
                apng.interlaceMethod = chunk[12];
                break;

            case ChunkType.acTL:
                apng.frameCount = chunk.readUInt32BE(0);
                apng.loopCount = chunk.readUInt32BE(4);
                break;

            case ChunkType.PLTE:
                if (chunk.length > 0) {
                    palette = chunk;
                    apng.palette = palette;
                }
                break;


            case ChunkType.tRNS:
                if (chunk.length > 0) {
                    transparency = chunk;
                    apng.transparency = chunk;
                }
                break;

            case ChunkType.fcTL:
                if (currentFrame) {
                    apng.frames.push(new Frame(currentFrame));
                    dataChunks.push([]);
                }

                currentFrame = {
                    width: chunk.readUInt32BE(4),
                    height: chunk.readUInt32BE(8),
                    left: chunk.readUInt32BE(12),
                    top: chunk.readUInt32BE(16),
                    delayNum: chunk.readUInt16BE(20),
                    delayDen: chunk.readUInt16BE(22) || 100,
                    disposeOp: chunk[24],
                    blendOp: chunk[25],
                    data: Buffer.alloc(0),
                    palette,
                    transparency,
                    bitDepth: apng.bitDepth,
                    colorType: apng.colorType,
                };

                if (apng.frames.length === 0 && currentFrame.disposeOp === 2) currentFrame.disposeOp = 1;
                break;

            case ChunkType.IDAT:
                dataChunks[dataChunks.length - 1].push(chunk);
                break;

            case ChunkType.fdAT:
                dataChunks[dataChunks.length - 1].push(chunk.subarray(4));
                break;

            default:
                break;
        }

        offset += 8 + length + 4;
    }

    if (currentFrame) apng.frames.push(new Frame(currentFrame));
    if (!apng.frames.length || !dataChunks.some(chunks => chunks.length > 0)) {
        throw new Error('No APNG frames or image data extracted');
    }

    for (let i = 0; i < apng.frames.length; i++) {
        const frame = apng.frames[i];
        const frameData = Buffer.concat(dataChunks[i] || []);
        if (frameData.length === 0) throw new Error(`No image data for frame ${i}`);

        frame.data = frameData
    }

    return apng;
}