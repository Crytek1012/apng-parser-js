import { writeFile } from "fs/promises";
import { Frame } from "./frame";
import { join } from "path";

export class APNG {
    constructor(
        public width: number = 0,
        public height: number = 0,
        public bitDepth: number = 0,
        public colorType: number = 0,
        public compressionMethod: number = 0,
        public filterMethod: number = 0,
        public interlaceMethod: number = 0,
        public palette: Buffer | null = null,
        public transparency: Buffer | null = null,
        public frameCount: number = 0,
        public loopCount: number = 0,
        public frames: Frame[] = []
    ) { }

    /**
     * Get the total duration of the APNG
     * @returns 
     */
    getDuration(): number {
        return this.frames.reduce((sum, f) => sum + f.getDelayMs(), 0);
    }

    /**
     * Saves all frames as PNG files to the specified directory.
     * @param dir Output directory path.
     * @param name Optional base filename
     */
    async saveFrames(dir: string, name = "frame") {
        if (!dir) throw new Error("Output directory is required.");

        for (let i = 0; i < this.frames.length; i++) {
            const filename = join(dir, `${name}_${i}.png`);
            try {
                await writeFile(filename, this.frames[i].toPNG());
            } catch (err) {
                throw new Error(`Failed to write frame ${i}: ${err}`);
            }
        }
    }
}