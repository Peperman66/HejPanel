import { pool } from '../index.ts';

type Event = {
    Name: string,
    Description: string,
    IsImportant: boolean
}
export type Events = Array<Event>;

export async function SaveEventData(data: Events): Promise<void> {
    const client = await pool.connect();
    const transaction = client.createTransaction("save_events");
    client.queryArray('TRUNCATE TABLE events;');

    for (let i = 0; i < data.length; i++) {
        const currentEvent = data[i];
        client.queryArray(`INSERT INTO events (Id, Name, Description, IsImportant) VALUES (${i}, ${currentEvent.Name}, ${currentEvent.Description}, ${currentEvent.IsImportant});`);
    }
    await client.end()
    return transaction.commit();
}

export async function GetEventData(): Promise<Events> {
    const client = await pool.connect();
    const transaction = client.createTransaction("read_events", {read_only: true});

    const result = await client.queryObject<Event>('SELECT Name, Description, IsImportant FROM events ORDER BY Id;');
    await transaction.commit();
    await client.end();
    return result.rows;
}

