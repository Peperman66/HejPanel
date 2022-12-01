import {PrismaClient} from '../generated/client/deno/edge.ts';
import type { Event } from '../types/event.ts';
import type { MediaData, MediaImage } from '../types/mediaData.ts';
import {config} from '../deps.ts';

await config({export: true})

console.log(Deno.env.get("DATABASE_PROXY_URL"))
console.log(Deno.env)

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: Deno.env.get("DATABASE_PROXY_URL")
        }
    }
});

type PrismaEvent = Event & {id: number};
type PrismaImage = MediaImage & {id: number};

function exclude<T, Key extends keyof T>(base: T, keys: Key[]): Omit<T, Key> {
    for (const key of keys) {
        delete base[key];
    }
    return base;
}

export async function setEvents(events: Event[]) {
    const eventsWithId: PrismaEvent[] = events.map((event, index) => {
        const _event = event as PrismaEvent;
        _event.id = index;
        return _event
    })
    await prisma.$transaction([
        prisma.event.deleteMany({where: {}}),
        prisma.event.createMany({
            data: eventsWithId
        })
    ]);
}

export async function getEvents(): Promise<Event[]> {
    const prismaEvents = await prisma.event.findMany({
        where: {},
        orderBy: {
            id: 'asc'
        }
    })
    return prismaEvents.map((event) => {
        return exclude(event, ["id"]) as Event;
    })
}

export async function getMediaData(hash: string): Promise<MediaData | null> {
    const image = await prisma.imageData.findFirst({
        where: {
            hash: hash
        },
        select: {
            data: true,
            hash: true
        }
    })
    return image;
}

export async function getMediaImages(includeData: boolean): Promise<MediaImage[]> {
    const images = await prisma.image.findMany({
        where: {},
        include: {
            data: includeData
        },
        orderBy: {
            id: 'asc'
        }
    })

    return images.map(image => {
        return exclude(image, ["id"]);
    })
}

export async function setMedia(media: MediaImage[]) {
    await prisma.$transaction([
        prisma.image.deleteMany({
            where: {}
        }),
        prisma.imageData.deleteMany({
            where: {}
        }),
        prisma.image.createMany({
            data: media.map((image, index) => {
                const _image = image as PrismaImage;
                _image.id = index;
                return _image;
            })
        })
    ]);
}