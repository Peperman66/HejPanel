import { config } from 'https://deno.land/x/dotenv@v2.0.0/mod.ts';

const apiKey: string = config({safe: true}).LUNCH_API_KEY;

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

function UpdateData() {
    fetch(`https://api.momentum-dev.eu/hej/Lunch/apikey=${apiKey}`)
    .then(data => data.json())
    .then(data => currentData = data);
}

UpdateData();
setInterval(UpdateData, 6*60*60*1000) // 6 hours
