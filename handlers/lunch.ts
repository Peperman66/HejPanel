import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.13-alpha/deno-dom-wasm.ts";

export type Lunch = {
    LunchOne: string | null;
    LunchTwo: string | null;
    LunchThree: string | null;
    Soup: string | null;
    Snack: string | null;
}

let currentData: Lunch;

export function GetLunchData(): Lunch {
    return currentData;
}


function Parse(): Promise<Lunch> {
    return fetch('https://www.strava.cz/strava5/Jidelnicky?zarizeni=1692')
        .then(res => res.text())
        .then(text => {
            const doc = new DOMParser().parseFromString(text, "text/html");
            const currentDay = doc?.getElementsByClassName("jidla")[0];
            return {
                Soup: currentDay?.getElementsByClassName("nazev")[0]?.innerText || null,
                LunchOne: currentDay?.getElementsByClassName("nazev")[2]?.innerText || null,
                LunchTwo: currentDay?.getElementsByClassName("nazev")[3]?.innerText || null,
                LunchThree: null,
                Snack: currentDay?.getElementsByClassName("nazev")[8]?.innerText || null
            }
        });
}


function UpdateData() {
    Parse().then(data => currentData = data);
}

UpdateData();
setInterval(UpdateData, 6*60*60*1000) // 6 hours
