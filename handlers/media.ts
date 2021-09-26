import {sha256} from 'https://deno.land/x/sha256@v1.0.2/mod.ts';
import {decode} from 'https://deno.land/std@0.99.0/encoding/base64.ts';

type Image = {
    Image: string,
    Duration: number;
}
export type Images = Array<Image>;

export function SaveMediaData(data: Images): Promise<void> {
    const images: Images = [];
    try {
        Deno.mkdirSync('db/images/');
    } catch {}
    for (let i = 0; i < data.length; i++) {
        const imageData = data[i].Image;
        const imageHash = sha256(imageData, 'base64', 'hex').slice(0, 7) as string;
        Deno.writeFileSync(`db/images/${imageHash}.png`, decode(imageData));
        images[i] = {
            Image: imageHash,
            Duration: data[i].Duration
        }
    }
    for (const file of Deno.readDirSync('db/images/')) {
        if (!images.some((img) => file.name.split('.')[0] === img.Image)) {
            Deno.removeSync(`db/images/${file.name}`);
        }
    }
    return Deno.writeTextFile('db/media.json', JSON.stringify(images));
}

export function GetMediaData(): Promise<Images> {
    return Deno.readTextFile('db/media.json')
        .then(data => {
            return JSON.parse(data);
        })
        .catch(err => {
            console.log(err);
            return [];
        });
}