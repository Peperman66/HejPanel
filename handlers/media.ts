import type { MediaImage } from "../types/mediaData.ts";
import { setMedia, getMediaImages } from "./db.ts";

export function SaveMediaData(data: MediaImage[]): Promise<void> {
    return setMedia(data);
}

export function GetMediaData(): Promise<Omit<MediaImage, "data">[]> {
    return getMediaImages(false);
}