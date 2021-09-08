export function CallOnSetTime(callback: ()=>void, millisPastHour: number): number {
    const now = new Date();
    const diff = (millisPastHour + 60*60*1000 /*One hour*/ - (now.getMinutes() * 60*1000 + now.getSeconds() * 1000 + now.getMilliseconds())) % (60*60*1000) //One hour
    return setTimeout(callback, diff);
}