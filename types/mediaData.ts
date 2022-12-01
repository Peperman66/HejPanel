import {Buffer} from '../deps.ts';

export type MediaImage = {
    hash: string,
    duration: number,
    data?: MediaData
}

export type MediaData = {
    hash: string,
    data: Buffer
}