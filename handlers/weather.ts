import { config } from 'https://deno.land/x/dotenv@v2.0.0/mod.ts';

const apiKey = config({safe: true}).OPENWEATHERMAP_APIKEY

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


export function GetWeatherData() {
    return currentData;
}

function GetData(): Promise<Weather> {
    return fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=46.602&lon=17.239&units=metric&exclude=minutely,alerts&appid=${apiKey}`)
        .then(res => res.json())
        .then(data => {
            let result: Weather = {
                CurrentTemperature: Math.round(data.current.temp),
                CurrentTemperatureIcon: data.current.weather[0].icon,
                MinTemperature: Math.round(data.daily[0].temp.min),
                MaxTemperature: Math.round(data.daily[0].temp.max),
                NextTemperatureTime1: 0,
                NextTemperatureIcon1: "",
                NextTemperatureTime2: 0,
                NextTemperatureIcon2: ""
            }
            for (let i = 0; i < data.hourly.length; i++) {
                if (result.NextTemperatureTime1 === 0 && new Date(data.hourly[i].dt*1000).getHours() === 8) {
                    result.NextTemperatureTime1 = data.hourly[i].dt;
                    result.NextTemperatureIcon1 = data.hourly[i].weather[0].icon;
                }
                if (result.NextTemperatureTime2 === 0 && new Date(data.hourly[i].dt*1000).getHours() === 14) {
                    result.NextTemperatureTime2 = data.hourly[i].dt;
                    result.NextTemperatureIcon2 = data.hourly[i].weather[0].icon;
                }
            }
            return result;
        })
}

function UpdateData() {
    GetData()
        .then(data => currentData = data);
}

UpdateData();
setInterval(UpdateData, 30*60*1000) // 30 minutes