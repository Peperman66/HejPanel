import { pool } from '../index.ts';

type Image = {
    Image: string,
    Duration: number;
}
export type Images = Array<Image>;

export async function SaveMediaData(data: Images): Promise<void> {
    const client = await pool.connect();
    const transaction = client.createTransaction("save_media");
    await transaction.begin();
    client.queryArray('TRUNCATE TABLE media;');

    for (let i = 0; i < data.length; i++) {
        const imageData = data[i].Image;
        const imageDuration = data[i].Duration;
        client.queryArray(`INSERT INTO media (Id, Image, Duration) VALUES (${i}, ${imageData}, ${imageDuration});`);
    }
    client.release();
    return transaction.commit();
}

export async function GetMediaData(): Promise<Images> {
    const client = await pool.connect();
    const transaction = client.createTransaction("read_media", { read_only: true });
    await transaction.begin();
    const data = await client.queryObject<Image>('SELECT Image, Duration FROM media ORDER BY ID;');
    await transaction.commit();
    client.release();
    return data.rows;
}