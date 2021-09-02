type Event = {
    Name: string,
    Description: string,
    IsImportant: boolean
}
export type Events = Array<Event>;

function ParseData(data: unknown): Events {
    const output = data as Events;
    return output;
}

export function SaveEventData(data: unknown): Promise<void> {
    const parsedData = ParseData(data);
    return Deno.writeTextFile('db/events.json', JSON.stringify(parsedData));
}

export function GetEventData(): Promise<Events> {
    return Deno.readTextFile('db/events.json')
        .then(data => {
            const obj: Events = JSON.parse(data);
            return obj;
        })
        .catch(err => {
            console.log(err);
            return [];
        });
}

