import type { Event } from "../types/event.ts";
import { setEvents, getEvents } from "./db.ts";


export async function SaveEventData(data: Event[]): Promise<void> {

    await setEvents(data);

}

export function GetEventData(): Promise<Event[]> {
    return getEvents();
}

