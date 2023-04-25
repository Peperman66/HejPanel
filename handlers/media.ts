import type { MediaData, MediaImage, MediaRequest } from "../types/mediaData.ts";
import { setMedia, getMediaImages } from "./db.ts";

import {decode} from '../deps.ts';
import {Buffer} from '../deps.ts'

export async function SaveMediaData(data: MediaRequest[]): Promise<void> {

    const mediaData: MediaImage[] = [];

    for (const currentData of data) {
        const base64string = currentData.image.split(',')[1]
        const rawData = decode(base64string)
        const hashBytes = (await crypto.subtle.digest('SHA-1', rawData))
        const hashArray = Array.from(new Uint8Array(hashBytes));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 7);
        const currentMediaData: MediaImage = {
            duration: currentData.duration,
            hash: hashHex,
            data: {
                hash: hashHex,
                data: new Buffer(rawData)
            }
        }
        mediaData.push(currentMediaData);
    }

    return setMedia(mediaData);
}

export function GetMediaData(): Promise<Omit<MediaImage, "data">[]> {
    return getMediaImages(false);
}