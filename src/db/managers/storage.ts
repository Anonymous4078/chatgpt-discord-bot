import { Bucket, StorageClient, StorageError } from "@supabase/storage-js";

import { DatabaseImage, ImageRawResult, ImageResult } from "../../image/types/image.js";
import { DatabaseDescription } from "../../image/description.js";
import { ClusterDatabaseManager } from "../cluster.js";
import { DatabaseCollectionType } from "../manager.js";
import { SubClusterDatabaseManager } from "../sub.js";
import { GPTDatabaseError } from "../../error/db.js";
import { ImageBuffer } from "../../util/image.js";

type StorageBucketName = "images" | "descriptions"

export interface StorageImage {
    /* URL to the image file */
    url: string;
}

export class StorageManager extends SubClusterDatabaseManager {
    /* The Supabase storage client */
    private client: StorageClient;

    constructor(db: ClusterDatabaseManager) {
        super(db);
        this.client = null!;
    }

    public async setup(): Promise<void> { 
        /* Set up the Supabase storage client. */
        this.client = new StorageClient(`${this.db.bot.app.config.db.supabase.url}/storage/v1`, {
            Authorization: `Bearer ${this.db.bot.app.config.db.supabase.key.service}`,
            apikey: this.db.bot.app.config.db.supabase.key.anon
        });
    }

    /**
     * Get information about a bucket.
     * @param name Which bucket
     * 
     * @returns Bucket data
     */
    public async bucket(name: StorageBucketName): Promise<Bucket> {
        const { data, error } = await this.client.getBucket(name);
        this.error(error, name);

        if (data === null) throw new Error(`Bucket ${name} doesn't exist`);
        return data;
    }

    /**
     * Fetch a Stable Horde generation image from the database.
     * @param image Image to fetch
     * 
     * @returns URL to the public image
     */
    public imageURL(db: DatabaseImage, image: ImageResult, bucket: StorageBucketName): StorageImage {
        const { data } = this.client
            .from(bucket).getPublicUrl(`${db.id}/${image.id}.png`);

        return { url: data.publicUrl };
    }

    public async uploadImageResult(db: DatabaseImage, image: ImageResult, data: Buffer): Promise<StorageImage> {
        const { error } = await this.client
            .from("images")
            .upload(`${db.id}/${image.id}.png`, data, {
                cacheControl: "86400",
                contentType: "image/png"
            });

        /* Check for any errors. */
        this.error(error, "images");

        return this.imageURL(db, image, "images");
    }

    public async uploadImageDescription(image: DatabaseDescription, data: ImageBuffer): Promise<void> {
        const name: string = image.id;

        const { error } = await this.client
            .from("descriptions")
            .upload(name, data.buffer, {
                cacheControl: "86400",
                contentType: "image/png"
            });

        /* Check for any errors. */
        this.error(error, "descriptions");
    }

    public async uploadImageResults(db: DatabaseImage, images: ImageRawResult[]): Promise<StorageImage[]> {
        /* All generated images */
        images = images.filter(i => i.status !== "filtered");

        /* Upload all of the images to the storage bucket. */
        await Promise.all(images.map(async image => {
            const buffer: Buffer = ImageBuffer.load(image.base64).buffer;  
            await this.uploadImageResult(db, image, buffer);
        }));

        return images.map(image => this.imageURL(db, image, "images"));
    }

    /**
     * Check whether an error occurred while making a request, and throw an error if applicable.
     * @param error Storage error that possibly occurred
     * 
     * @throws A GPTDatabaseError, if needed
     */
    private error(error: StorageError | null, collection?: DatabaseCollectionType): void {
        if (error !== null) throw new GPTDatabaseError({
            collection: "images",
            raw: error
        });
    }
}