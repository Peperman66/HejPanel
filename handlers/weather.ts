import {CallOnSetTime} from '../libs/time_call.ts';

const apiKey = Deno.env.get("OPENWEATHERMAP_APIKEY");

export type Weather = {
    CurrentTemperature: number,
    CurrentTemperatureIcon: string,
    MinTemperature: number,
    MaxTemperature: number,
    NextTemperatureTime1: number,
    NextTemperatureIcon1: string,
    NextTemperatureTime2: number,
    NextTemperatureIcon2: string
}
let currentData: Weather;

export async function GetWeatherData() {
    if (currentData === undefined) {
        return await FetchData();
    }
    return currentData;
}

function FetchData(): Promise<Weather> {
    return fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=49.602&lon=17.239&units=metric&exclude=minutely,alerts&appid=${apiKey}`)
        .then(res => res.json())
        .then(data => {
            const result: Weather = {
                CurrentTemperature: Math.round(data.current.temp),
                CurrentTemperatureIcon: data.current.weather[0].icon,
                MinTemperature: Math.round(data.daily[0].temp.min),
                MaxTemperature: Math.round(data.daily[0].temp.max),
                NextTemperatureTime1: 0,
                NextTemperatureIcon1: "",
                NextTemperatureTime2: 0,
                NextTemperatureIcon2: ""
            }
            const nextIndex = new Date().getMinutes() < 49 ? 1 : 2;
            result.NextTemperatureTime1 = data.hourly[nextIndex].dt;
            result.NextTemperatureIcon1 = data.hourly[nextIndex].weather[0].icon;
            for (let i = nextIndex + 1; i < data.hourly.length; i++) {
                const currentHour = new Date(data.hourly[i].dt*1000).getHours()
                if (result.NextTemperatureTime2 === 0 && (currentHour === 14 || currentHour === 16)) {
                    result.NextTemperatureTime2 = data.hourly[i].dt;
                    result.NextTemperatureIcon2 = data.hourly[i].weather[0].icon;
                    break;
                }
            }
            return result;
        }).catch(error => {
            console.error(error);
            return {
                CurrentTemperature: 4,
                CurrentTemperatureIcon: "04n",
                MinTemperature: 0,
                MaxTemperature: 5,
                NextTemperatureTime1: 46800,
                NextTemperatureTime2: 54000,
                NextTemperatureIcon1: "04n",
                NextTemperatureIcon2: "04n"
            }
        })
}

function UpdateData() {
    UpdateWeatherData().then(() => CallOnSetTime(UpdateData, 49*60*1000 + 30*1000 /*29 minutes and 30 seconds*/));
}

export function GetData() {
    return currentData;
}

export function UpdateWeatherData() {
    return FetchData().then(data => currentData = data);
}

UpdateData();