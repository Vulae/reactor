import { hoiseArrayNull } from './util';

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

function rebuildAtlas<
    Textures extends {
        [key: string]: [number, number, number, number];
    }
>(imageData: ImageData, textures: Textures, pad: boolean = true): [ImageData, Textures] {
    /** https://blackpawn.com/texts/lightmaps/ */
    class PackerNode {
        public readonly x: number;
        public readonly y: number;
        public readonly width: number;
        public readonly height: number;

        public value: null | [PackerNode, PackerNode] | keyof Textures = null;

        public constructor(x: number, y: number, width: number, height: number) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }

        public insert(texture: keyof Textures, width: number, height: number): PackerNode | null {
            if (Array.isArray(this.value)) {
                return (
                    this.value[0].insert(texture, width, height) ??
                    this.value[1].insert(texture, width, height)
                );
            }

            if (typeof this.value == 'string') {
                return null;
            }

            if (width > this.width || height > this.height) {
                return null;
            }

            if (width == this.width && height == this.height) {
                this.value = texture;
                return this;
            }

            const dw = this.width - width;
            const dh = this.height - height;
            this.value = [
                dw > dh
                    ? new PackerNode(this.x, this.y, width, this.height)
                    : new PackerNode(this.x, this.y, this.width, height),
                dw > dh
                    ? new PackerNode(this.x + width, this.y, this.width - width, this.height)
                    : new PackerNode(this.x, this.y + height, this.width, this.height - height)
            ];

            return this.value[0].insert(texture, width, height);
        }
    }

    for (let size = 32; size <= 2 ** 16; size *= 2) {
        const root = new PackerNode(0, 0, size, size);

        const textureNodes = hoiseArrayNull(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            Object.entries(textures).map(([texture, [_x, _y, w, h]]) =>
                root.insert(texture, w + (pad ? 1 : 0), h + (pad ? 1 : 0))
            )
        );

        if (!textureNodes) {
            continue;
        }

        const originalCanvas = new OffscreenCanvas(imageData.width, imageData.height);
        const originalCtx = originalCanvas.getContext('2d')!;
        originalCtx.putImageData(imageData, 0, 0);

        const rebuiltCanvas = new OffscreenCanvas(root.width, root.height);
        const rebuiltCtx = rebuiltCanvas.getContext('2d')!;

        const packedTextures = Object.fromEntries(
            textureNodes.map((node) => {
                if (typeof node.value != 'string') {
                    throw new Error('unreachable');
                }

                const [originalX, originalY, originalWidth, originalHeight] = textures[node.value];

                if (
                    node.width - (pad ? 1 : 0) != originalWidth ||
                    node.height - (pad ? 1 : 0) != originalHeight
                ) {
                    throw new Error('MY SANITY CHECK');
                }

                rebuiltCtx.putImageData(
                    originalCtx.getImageData(originalX, originalY, originalWidth, originalHeight),
                    node.x,
                    node.y
                );

                return [
                    node.value,
                    [node.x, node.y, node.width - (pad ? 1 : 0), node.height - (pad ? 1 : 0)]
                ];
            })
        ) as Textures;

        return [rebuiltCtx.getImageData(root.x, root.y, root.width, root.height), packedTextures];
    }

    console.warn('Could not pack atlas texture to reasonable size!');
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

    public async debugGetRebuiltBlob(): Promise<Blob> {
        await this.awaitLoad();
        return await this.rebuilt!.convertToBlob({ type: 'image/png' });
    }

    private async blob(texture: keyof Textures): Promise<Blob> {
        const [sx, sy, sw, sh] = this.rebuiltTextures![texture];
        const canvas = new OffscreenCanvas(sw, sh);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(this.rebuilt!, sx, sy, sw, sh, 0, 0, sw, sh);
        return await canvas.convertToBlob({ type: 'image/png' });
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
        const texture =
            this.frames[Math.min(Math.floor(percent * this.frames.length), this.frames.length - 1)];
        this.atlas.draw(ctx, texture, x, y, w, h);
    }
}
