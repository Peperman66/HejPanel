import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.13-alpha/deno-dom-wasm.ts";

export type Lunch = {
    LunchOne: string | null;
    LunchTwo: string | null;
    LunchThree: string | null;
    Soup: string | null;
    Snack: string | null;
}

let currentData: Lunch;

export async function GetLunchData(): Promise<Lunch> {
    if (currentData === undefined) {
        await Parse();
    }
    return currentData;
}

//Yes, there are really trailing spaces in the source
const nameTable: Record<string, string> = {
    "Polévka ": "Soup",
    "Oběd 1 1": "LunchOne",
    "Oběd 2 1": "LunchTwo",
    "Svačina ": "Snack"
}

function Parse(): Promise<Lunch> {
    return fetch('https://www.strava.cz/strava5/Jidelnicky?zarizeni=1692')
        .then(res => res.text())
        .then(text => {
            const doc = new DOMParser().parseFromString(text, "text/html");
            const currentDay = doc?.getElementsByClassName("jidla")[0];
            const output: Lunch & Record<string, string | null> = {
                LunchOne: null,
                LunchTwo: null,
                LunchThree: null,
                Soup: null,
                Snack: null
            };
            for (let i = 0; i < (currentDay?.getElementsByClassName("popis")?.length || 0); i++) {
                const currentElement = doc?.getElementsByClassName("popis")[i];
                if (currentElement?.innerText !== undefined && nameTable[currentElement.innerText] !== null) {
                    output[nameTable[currentElement.innerText]] = currentElement?.parentElement?.getElementsByClassName("nazev")[0]?.innerText || null;
                }
            }
            return output;
        });
}


export function UpdateLunchData() {
    return Parse().then(data => currentData = data);
}

UpdateLunchData();
setInterval(UpdateLunchData, 6*60*60*1000) // 6 hours
