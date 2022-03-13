import { config } from 'https://deno.land/x/dotenv@v3.2.0/mod.ts';
import { Client } from 'https://deno.land/x/postgres@v0.15.0/mod.ts';

type Image = {
    Image: string,
    Duration: number;
}
export type Images = Array<Image>;

const client = new Client(config().DATABASE_URL);
await client.connect();

export function SaveMediaData(data: Images): Promise<void> {
    const transaction = client.createTransaction("save_media");
    client.queryArray('TRUNCATE TABLE media;');

    for (let i = 0; i < data.length; i++) {
        const imageData = data[i].Image;
        const imageDuration = data[i].Duration;
        client.queryArray(`INSERT INTO media (Id, Image, Duration) VALUES (${i}, ${imageData}, ${imageDuration});`);
    }

    return transaction.commit();
}

export async function GetMediaData(): Promise<Images> {
    const transaction = client.createTransaction("read_media", { read_only: true });
    const data = await client.queryObject<Image>('SELECT Image, Duration FROM media ORDER BY ID;');
    await transaction.commit();
    return data.rows;
}