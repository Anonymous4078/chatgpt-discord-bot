import { ImageGenerationBody } from "./image.js";
import { ImageAPIPath } from "../manager.js";

export interface ImageConfigModelSettings {
    /** Whether the resolution can be changed */
    modifyResolution?: boolean;
}

export type ImageModelSettings = Required<ImageConfigModelSettings>

export interface ImageConfigModel {
    /** Display name of the model */
    name: string;

    /** Identifier of the model */
    id: string;

    /** Description of the model */
    description: string;

    /** Various settings for the model */
    settings?: ImageModelSettings;

    /** Additional tags for the prompt, e.g. trigger words */
    tags?: string[];

    /** API path for this model */
    path: ImageAPIPath;

    /** Additional body to use for the API request */
    body?: Partial<ImageGenerationBody>;
}

export type ImageModel = Required<Omit<ImageConfigModel, "settings">> & {
    settings: ImageModelSettings;
}

export const ImageConfigModels: ImageConfigModel[] = [
    {
        name: "Kandinsky",
        description: "Multi-lingual latent diffusion model",
        id: "kandinsky",
        path: "kandinsky"
    },

    {
        name: "SDXL",
        description: "Latest Stable Diffusion model",
        id: "sdxl",
        path: "sh",

        settings: {
            modifyResolution: false
        },

        body: {
            model: "SDXL_beta::stability.ai#6901",
            width: 1024, height: 1024
        }
    },

    {
        name: "Project Unreal Engine 5",
        description: "Trained to look like Unreal Engine 5 renders",
        id: "ue5",
        path: "sh",

        body: {
            model: "stable_diffusion"
        }
    },

    {
        name: "I Can't Believe It's Not Photography",
        description: "Highly photo-realistic Stable Diffusion model",
        id: "icbinp",
        path: "sh",
        
        body: {
            model: "ICBINP - I Can't Believe It's Not Photography"
        }
    },

    {
        name: "Anything Diffusion",
        description: "Stable Diffusion-based model for generating anime",
        id: "anything-diffusion",
        path: "sh",

        tags: [ "anime", "booru" ],
        
        body: {
            model: "Anything Diffusion"
        }
    }
]