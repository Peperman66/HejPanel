type Image = {
    Image: string,
    Description: string
}

export type Images = Array<Image>;

export function SaveMediaData(data: Images): Promise<void> {
    return Deno.writeTextFile('db/media.json', JSON.stringify(data))
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