import { writeFile } from "fs/promises";
import { ChunkType, ColorType, PNG_SIGNATURE } from "../util/constants";
import { createChunk, createIHDRChunk } from "../util/chunks";
import { join } from "path";
import { decodeFrameRGBA } from "../util/decode-frame";

export interface IFrameData {
    width: number;
    height: number;
    left: number;
    top: number;
    delayNum: number;
    delayDen: number;
    disposeOp: number;
    blendOp: number;
    bitDepth: number;
    colorType: ColorType;
    transparency: Buffer | null;
    palette: Buffer | null;
    data: Buffer;
}

export class Frame {
    width: number;
    height: number;
    left: number;
    top: number;
    delayNum: number;
    delayDen: number;
    disposeOp: number;
    blendOp: number;
    bitDepth: number;
    colorType: ColorType;
    transparency: Buffer | null;
    palette: Buffer | null;
    data: Buffer;
    private rgba: Buffer | null = null;

    constructor(data: IFrameData) {
        this.width = data.width;
        this.height = data.height;
        this.left = data.left;
        this.top = data.top;
        this.bitDepth = data.bitDepth;
        this.delayNum = data.delayNum;
        this.delayDen = data.delayDen;
        this.blendOp = data.blendOp;
        this.disposeOp = data.disposeOp;
        this.colorType = data.colorType;
        this.transparency = data.transparency;
        this.palette = data.palette;
        this.data = data.data;
    }

    /**
     * Get the frame delay in milliseconds
     * @returns 
     */
    getDelayMs(): number {
        return (this.delayDen ? this.delayNum / this.delayDen : 0) * 1000;
    }

    /**
     * Whether the frame contains any transparency
     * @returns 
     */
    hasAlpha(): boolean {
        return (
            this.colorType === ColorType.TruecolorAlpha ||
            this.colorType === ColorType.GrayscaleAlpha ||
            !!this.transparency
        );
    }

    /**
     * Compare the position, size, and pixel data of two frames
     * @param other 
     * @returns 
     */
    isEqualTo(other: Frame): boolean {
        return this.width === other.width &&
            this.height === other.height &&
            this.left === other.left &&
            this.top === other.top &&
            this.data.equals(other.data);
    }

    /**
     * Extract the raw pixel data of this frame
     * @returns 
     */
    getRGBA(): Buffer {
        if (!this.rgba) {
            this.rgba = decodeFrameRGBA(this.data, this);
        }
        return this.rgba;
    }

    /**
     * 
     * @returns 
     */
    toPNG(): Buffer {

        const ihdrChunk = createIHDRChunk({
            width: this.width,
            height: this.height,
            bitDepth: this.bitDepth,
            colorType: this.colorType,
            compressionMethod: 0,
            filterMethod: 0,
            interlaceMethod: 0
        });

        const chunks = [
            Buffer.from(PNG_SIGNATURE),
            ihdrChunk
        ];

        if (this.colorType === ColorType.IndexedColor && this.palette) {
            chunks.push(createChunk(ChunkType.PLTE, this.palette));
        }

        if (this.transparency) {
            chunks.push(createChunk(ChunkType.tRNS, this.transparency));
        }

        chunks.push(createChunk(ChunkType.IDAT, this.data));

        chunks.push(createChunk(ChunkType.IEND, Buffer.alloc(0)));

        return Buffer.concat(chunks);
    }

    /**
     * Save the frame to the specified directory.
     * @param dir Output directory path.
     * @param name Optional base filename
     */
    async save(dir: string, name = "frame") {
        if (!dir) throw new Error('Output directory is required.')

        const filename = join(dir, `${name}.png`);
        try {
            await writeFile(filename, this.toPNG());
        } catch (err) {
            throw new Error(`Failed to write frame: ${err}`);
        }
    }
}