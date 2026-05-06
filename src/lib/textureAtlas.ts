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

type TextureAtlasObj<T extends string> = { [_ in T]: [number, number, number, number] };

class Rect {
    public readonly x: number;
    public readonly y: number;
    public readonly width: number;
    public readonly height: number;

    public constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

const PACKER_NODE_UNOCCUPIED = Symbol('packer-node-unoccupied');
const PACKER_NODE_OCCUPIED = Symbol('packer-node-occupied');

/** https://blackpawn.com/texts/lightmaps/ */
class PackerNode {
    public readonly rect: Rect;
    public state:
        | typeof PACKER_NODE_UNOCCUPIED
        | typeof PACKER_NODE_OCCUPIED
        | [PackerNode, PackerNode] = PACKER_NODE_UNOCCUPIED;

    public constructor(rect: Rect) {
        this.rect = rect;
    }

    public insert(width: number, height: number): Rect | null {
        if (this.state == PACKER_NODE_OCCUPIED) {
            return null;
        }

        if (this.state != PACKER_NODE_UNOCCUPIED) {
            return this.state[0].insert(width, height) ?? this.state[1].insert(width, height);
        }

        if (this.rect.width < width || this.rect.height < height) {
            return null;
        }
        if (this.rect.width == width && this.rect.height == height) {
            this.state = PACKER_NODE_OCCUPIED;
            return this.rect;
        }

        if (this.rect.width - width > this.rect.height - height) {
            this.state = [
                new PackerNode(new Rect(this.rect.x, this.rect.y, width, this.rect.height)),
                new PackerNode(
                    new Rect(
                        this.rect.x + width,
                        this.rect.y,
                        this.rect.width - width,
                        this.rect.height
                    )
                )
            ];
        } else {
            this.state = [
                new PackerNode(new Rect(this.rect.x, this.rect.y, this.rect.width, height)),
                new PackerNode(
                    new Rect(
                        this.rect.x,
                        this.rect.y + height,
                        this.rect.width,
                        this.rect.height - height
                    )
                )
            ];
        }
        return this.state[0].insert(width, height);
    }
}

function findBestPackedAtlasSize<Textures extends string>(
    textures: TextureAtlasObj<Textures>,
    pad: boolean = true
): number {
    function pack<Textures extends string>(
        textures: TextureAtlasObj<Textures>,
        pad: boolean,
        size: number
    ): boolean {
        const root = new PackerNode(new Rect(0, 0, size, size));
        for (const texture in textures) {
            const [_sx, _sy, sw, sh] = textures[texture];
            if (root.insert(sw + (pad ? 1 : 0), sh + (pad ? 1 : 0)) === null) {
                return false;
            }
        }
        return true;
    }

    let low = 1;
    while (!pack(textures, pad, low)) {
        low <<= 1;
    }
    let high = low;
    low >>= 1;
    let best = high;
    while (low <= high) {
        const mid = low + ((high - low) >> 1);
        if (pack(textures, pad, mid)) {
            best = mid;
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }
    return best;
}

function rebuildAtlas<Textures extends string>(
    imageData: ImageData,
    textures: TextureAtlasObj<Textures>,
    pad: boolean = false
): [ImageData, TextureAtlasObj<Textures>] {
    const originalCanvas = new OffscreenCanvas(imageData.width, imageData.height);
    const originalCtx = originalCanvas.getContext('2d', {
        willReadFrequently: true
    })!;
    originalCtx.putImageData(imageData, 0, 0);

    const rebuiltSize = findBestPackedAtlasSize(textures, pad);

    const rebuiltCanvas = new OffscreenCanvas(rebuiltSize, rebuiltSize);
    const rebuiltCtx = rebuiltCanvas.getContext('2d')!;

    const root = new PackerNode(new Rect(0, 0, rebuiltSize, rebuiltSize));
    const rebuiltTextures: TextureAtlasObj<Textures> = {} as TextureAtlasObj<Textures>;

    for (const texture in textures) {
        const [sx, sy, sw, sh] = textures[texture];
        const rect = root.insert(sw + (pad ? 1 : 0), sh + (pad ? 1 : 0));
        if (rect === null) {
            throw 'kajsdhakdasd';
        }
        rebuiltTextures[texture] = [
            rect.x,
            rect.y,
            rect.width - (pad ? 1 : 0),
            rect.height - (pad ? 1 : 0)
        ];
        rebuiltCtx.putImageData(originalCtx.getImageData(sx, sy, sw, sh), rect.x, rect.y);
    }

    return [
        rebuiltCtx.getImageData(root.rect.x, root.rect.y, root.rect.width, root.rect.height),
        rebuiltTextures
    ];
}

export class TextureAtlas<Textures extends string> {
    private rebuilt: OffscreenCanvas | null = null;
    private rebuiltTextures: TextureAtlasObj<Textures> | null = null;

    private image: HTMLImageElement;

    public readonly textures: TextureAtlasObj<Textures>;

    public constructor(image: HTMLImageElement | string, textures: TextureAtlasObj<Textures>) {
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
        texture: Textures,
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

    private async blob(texture: Textures): Promise<Blob> {
        const [sx, sy, sw, sh] = this.rebuiltTextures![texture];
        const canvas = new OffscreenCanvas(sw, sh);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(this.rebuilt!, sx, sy, sw, sh, 0, 0, sw, sh);
        return await canvas.convertToBlob({ type: 'image/png' });
    }

    private readonly blobCache: Map<Textures, string> = new Map();

    public clearBlobCache(): void {
        for (const [_, url] of this.blobCache) {
            URL.revokeObjectURL(url);
        }
        this.blobCache.clear();
    }

    public async getTextureImageAsBlobURL(texture: Textures): Promise<string> {
        {
            const cached = this.blobCache.get(texture);
            if (cached !== undefined) {
                return cached;
            }
        }
        await this.awaitLoad();
        const blob = await this.blob(texture);
        {
            const cached = this.blobCache.get(texture);
            if (cached !== undefined) {
                return cached;
            }
        }
        const url = URL.createObjectURL(blob);
        this.blobCache.set(texture, url);
        return url;
    }
}

export class TextureAtlasAnimation<Textures extends string, Frames extends Textures[]> {
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
