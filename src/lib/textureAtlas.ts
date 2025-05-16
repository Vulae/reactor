function toImageData(image: HTMLImageElement): ImageData | null {
    if (!image.complete || image.naturalWidth === 0) {
        return null;
    }
    const canvas = new OffscreenCanvas(image.naturalWidth, image.naturalHeight);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
}

// Rebuild atlas with added padding & more efficient packing.
function rebuildAtlas<
    Textures extends {
        [key: string]: [number, number, number, number];
    }
>(imageData: ImageData, textures: Textures): [ImageData, Textures] {
    // TODO: Implement atlas rebuilding.
    return [imageData, textures];
}

export class TextureAtlas<
    Textures extends {
        [key: string]: [number, number, number, number];
    }
> {
    private rebuilt: OffscreenCanvas | null = null;
    private rebuiltTextures: Textures | null = null;

    private image: HTMLImageElement;

    public readonly textures: Textures;

    public constructor(image: HTMLImageElement | string, textures: Textures) {
        if (typeof image == 'string') {
            this.image = new Image();
            this.image.src = image;
        } else {
            this.image = image;
        }
        this.image.loading = 'eager';

        this.textures = textures;
    }

    private loadAndRebuild(): boolean {
        if (this.rebuilt && this.rebuiltTextures) return true;
        const imageData = toImageData(this.image);
        if (!imageData) {
            return false;
        }
        const [rebuiltImageData, rebuiltTextures] = rebuildAtlas(imageData, this.textures);
        this.rebuiltTextures = rebuiltTextures;
        this.rebuilt = new OffscreenCanvas(rebuiltImageData.width, rebuiltImageData.height);
        const rebuiltCtx = this.rebuilt.getContext('2d')!;
        rebuiltCtx.putImageData(rebuiltImageData, 0, 0);
        return true;
    }

    public draw(
        ctx: CanvasRenderingContext2D,
        texture: keyof Textures,
        x: number = 0,
        y: number = 0,
        w: number = 1,
        h: number = 1
    ): void {
        if (!this.loadAndRebuild()) return;
        const [sx, sy, sw, sh] = this.rebuiltTextures![texture];
        ctx.drawImage(this.rebuilt!, sx, sy, sw, sh, x, y, w, h);
    }

    public awaitLoad(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.loadAndRebuild()) {
                return resolve();
            }

            const onLoad = () => {
                this.image.removeEventListener('load', onLoad);
                this.image.removeEventListener('error', onError);
                if (!this.loadAndRebuild()) {
                    reject(
                        'TextureAtlas image failed to load and rebuild when it was already loaded????'
                    );
                    return;
                }
                resolve();
            };
            const onError = (ev: ErrorEvent) => {
                this.image.removeEventListener('load', onLoad);
                this.image.removeEventListener('error', onError);
                reject(ev);
            };

            this.image.addEventListener('load', onLoad);
            this.image.addEventListener('error', onError);
        });
    }

    private blob(texture: keyof Textures): Promise<Blob> {
        const [sx, sy, sw, sh] = this.rebuiltTextures![texture];
        const canvas = new OffscreenCanvas(sw, sh);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(this.rebuilt!, sx, sy, sw, sh, 0, 0, sw, sh);
        return canvas.convertToBlob({ type: 'image/png' });
    }

    public async getTextureImageBlob(texture: keyof Textures): Promise<Blob> {
        await this.awaitLoad();
        return await this.blob(texture);
    }
}

export class TextureAtlasAnimation<
    Textures extends {
        [key: string]: [number, number, number, number];
    },
    Frames extends (keyof Textures)[]
> {
    public readonly atlas: TextureAtlas<Textures>;
    public readonly frames: Frames;
    public drawOutOfBounds: boolean;

    public constructor(
        atlas: TextureAtlas<Textures>,
        frames: Frames,
        drawOutOfBounds: boolean = false
    ) {
        this.atlas = atlas;
        this.frames = frames;
        this.drawOutOfBounds = drawOutOfBounds;
    }

    public draw(
        ctx: CanvasRenderingContext2D,
        percent: number,
        x: number = 0,
        y: number = 0,
        w: number = 1,
        h: number = 1
    ): void {
        if (this.drawOutOfBounds) {
            percent = Math.min(Math.max(percent, 0), 1);
        } else {
            if (percent < 0 || percent > 1) {
                return;
            }
        }
        const texture = this.frames[Math.floor(percent * this.frames.length)];
        this.atlas.draw(ctx, texture, x, y, w, h);
    }
}
