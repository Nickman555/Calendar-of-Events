function getEvents(period = "100y") {
    if (timeParse1(period) != -1 && timeParse1(period).getTime() > Date.now()) {
        period = timeParse1(period).getTime();
    }
    else if (!isNaN(Date.parse(period)) && Date.parse(period) > Date.now()) {
        period = Date.parse(period);
    }
    else {
        console.log("Period invalid");
        return null;
    }

    let events = lsLoad();

    events = events.filter(event => Date.parse(event.time) < period);

    if (events.length == 0) {
        console.log("There are no events");
        return null;
    }
    for (let event of events) {
        console.log(event);
    }
    return events;
}

function addEvent(name, time = "10s", callback, extraTime, extraCallback) {
    if (lsGet(name) != -1) {
        console.log("Event with that name already exists");
        return null;
    }
    if (!isNaN(Date.parse(time)) && Date.parse(time) > Date.now()) {
        time = Date.parse(time);
    }
    else if (timeParse1(time) != -1 && timeParse1(time).getTime() > Date.now()) {
        time = timeParse1(time).getTime();
    }
    else {
        console.log("Time invalid");
        return null;
    }
    if (extraTime != undefined && extraTimeParse(extraTime, time) == -1) {
        console.log("Extra time invalid");
        return null;
    }

    const events = lsLoad();

    const timerId = setTimeout(() => {
        callback();
        lsDelete(name);
    }, time - Date.now());

    let extraTimerId = null;
    if (extraTime != undefined && extraCallback != undefined) {
        extraTimerId = setTimeout(() => {
            extraCallback();
        }, extraTimeParse(extraTime, time));
    }

    const event = {
        name: name,
        time: new Date(time),
        callback: functionParse(callback),
        timerId: timerId,
        extraTime: (extraTime != undefined) ? extraTime.trim().replace(/\s/g, "") : null,
        extraCallback: (extraCallback != undefined) ? functionParse(extraCallback) : null,
        extraTimerId: extraTimerId
    };

    events.push(event);
    lsSave(events);

    if (lsGet(name) != -1) {
        console.log(`${name} was created successfully`);
        return lsGet(name);
    }
    else {
        console.log("Something went wrong");
        return null;
    }
}

function addRecurEvent(name, time, interval, callback, extraTime, extraCallback) {
    let format = false;
    const intervalStr = interval.trim();
    if (lsGet(name) != -1) {
        console.log("Event with that name already exists");
        return null;
    }
    if (!isNaN(Date.parse(time)) && Date.parse(time) > Date.now() && timeParse1(interval) != -1) {
        time = Date.parse(time);
        interval = timeParse1(interval).getTime() - Date.now();
    }
    else if (timeParse1(time) != -1 && timeParse1(time).getTime() > Date.now() && timeParse1(interval) != -1) {
        time = timeParse1(time).getTime();
        interval = timeParse1(interval).getTime() - Date.now();
    }
    else if (timeParse2(time) != -1 && intervalParse(interval) != -1) {
        format = true;
        time = timeParse2(time);
        interval = intervalParse(interval);
    }
    else {
        console.log("Time and/or interval invalid");
        return null;
    }
    if ((extraTime != undefined && !format && extraTimeParse(extraTime, Date.now() + interval) == -1) || (extraTime != undefined && format && (extraTimeParse(extraTime, Date.now() + findMinDifference(interval) * 24 * 3600 * 1000) == -1))) {
        console.log("Extra time invalid");
        return null;
    }


    let timerId = null;
    let recurTimerId = null;
    let extraTimerId = null;
    let extraRecurTimerId = null;
    let newInterval = new Array();
    if (format) {
        timerId = new Array();
        recurTimerId = new Array();
        for (x of interval) {
            let diff = x - new Date().getDay();
            if (diff < 0) {
                diff = diff + 7;
            }

            let date = new Date();
            date.setDate(new Date().getDate() + diff);
            date.setHours(time[0], time[1], time[2], 0);

            if (date.getTime() < Date.now()) {
                date.setDate(date.getDate() + 7);
            }

            newInterval.push(date.getTime());
        }
        newInterval.sort((a, b) => a - b);
        let i = 0;
        for (x of newInterval) {
            timerId[i] = setTimeout(() => {
                recurTimerId[i] = setInterval(() => {
                    callback();
                    let events = lsLoad();
                    let event = lsGet(name);
                    event.time = new Date((i < newInterval.length - 1) ? newInterval[i + 1] + (7 * 24 * 3600 * 1000) * Math.round((Date.now() - newInterval[i]) / (7 * 24 * 3600 * 1000)) : newInterval[0] + (7 * 24 * 3600 * 1000) * (Math.round((Date.now() - newInterval[i]) / (7 * 24 * 3600 * 1000)) + 1));
                    events = events.filter(event => event.name !== name);
                    events.push(event);
                    lsSave(events);
                }, 7 * 24 * 3600 * 1000);
                callback();
                let events = lsLoad();
                let event = lsGet(name);
                event.time = new Date((i < newInterval.length - 1) ? newInterval[i + 1] : newInterval[0] + 7 * 24 * 3600 * 1000);
                event.timerId[i] = recurTimerId[i];
                events = events.filter(event => event.name !== name);
                events.push(event);
                lsSave(events);
            }, x - Date.now());

            if (extraTime != undefined && extraCallback != undefined) {
                extraTimerId = new Array();
                extraRecurTimerId = new Array();
                extraTimerId[i] = setTimeout(() => {
                    extraRecurTimerId[i] = setInterval(() => {
                        extraCallback();
                    }, 7 * 24 * 3600 * 1000);
                    extraCallback();
                    let events = lsLoad();
                    let event = lsGet(name);
                    event.extraTimerId[i] = extraRecurTimerId[i];
                    events = events.filter(event => event.name !== name);
                    events.push(event);
                    lsSave(events);
                }, extraTimeParse(extraTime, x));
            }
            i++;
        }
        i = 0;
    }
    else {
        timerId = setTimeout(() => {
            recurTimerId = setInterval(() => {
                callback();
                let events = lsLoad();
                let event = lsGet(name);
                event.time = new Date(Date.parse(event.time) + interval);
                events = events.filter(event => event.name !== name);
                events.push(event);
                lsSave(events);
            }, interval);
            callback();
            let events = lsLoad();
            let event = lsGet(name);
            event.time = new Date(time + interval);
            event.timerId = recurTimerId;
            events = events.filter(event => event.name !== name);
            events.push(event);
            lsSave(events);
        }, time - Date.now());

        if (extraTime != undefined && extraCallback != undefined) {
            extraTimerId = setTimeout(() => {
                extraRecurTimerId = setInterval(() => {
                    extraCallback();
                }, interval);
                extraCallback();
                let events = lsLoad();
                let event = lsGet(name);
                event.extraTimerId = extraRecurTimerId;
                events = events.filter(event => event.name !== name);
                events.push(event);
                lsSave(events);
            }, extraTimeParse(extraTime, time));
        }
    }

    const event = {
        name: name,
        time: format ? new Date(newInterval[0]) : new Date(time),
        interval: format ? intervalStr : intervalStr.replace(/\s/g, ""),
        callback: functionParse(callback),
        timerId: timerId,
        extraTime: (extraTime != undefined) ? extraTime.trim().replace(/\s/g, "") : null,
        extraCallback: (extraCallback != undefined) ? functionParse(extraCallback) : null,
        extraTimerId: extraTimerId
    };

    const events = lsLoad();
    events.push(event);
    lsSave(events);

    if (lsGet(name) != -1) {
        console.log(`${name} was created successfully`);
        return lsGet(name);
    }
    else {
        console.log("Something went wrong");
        return null;
    }
}

function deleteEvent(name) {
    if (lsGet(name) == -1) {
        console.log("Event with that name does not exist");
        return null;
    }

    const event = lsGet(name);
    if (event.hasOwnProperty("interval") && intervalParse(event.interval) === -1) {
        clearTimeout(event.timerId);
        clearInterval(event.timerId);
        if (event.extraTimerId != null) {
            clearTimeout(event.extraTimerId);
            clearInterval(event.extraTimerId);
        }
    }
    else if (event.hasOwnProperty("interval") && intervalParse(event.interval) !== -1) {
        for (let timer of event.timerId) {
            clearTimeout(timer);
            clearInterval(timer);
        }
        if (event.extraTimerId != null) {
            for (let extraTimer of event.extraTimerId) {
            clearTimeout(extraTimer);
            clearInterval(extraTimer);
        }
        }
    }
    else {
        clearTimeout(event.timerId);
        if (event.extraTimerId != null) {
            clearTimeout(event.extraTimerId);
        }
    }

    lsDelete(name);

    if (lsGet(name) == -1) {
        console.log(`${name} was deleted successfully`);
        return null;
    }
    else {
        console.log("Something went wrong");
        return null;
    }
}

function init() {
    const events = lsLoad();
    let newEvents = new Array();

    for (let event1 of events) {
        if (event1.hasOwnProperty("interval") && intervalParse(event1.interval) === -1) {
            while (Date.parse(event1.time) < Date.now()) {
                event1.time = new Date(Date.parse(event1.time) + timeParse1(event1.interval).getTime() - Date.now());
            }

            let recurTimerId = null;
            let extraRecurTimerId = null;
            const callback = new Function(...event1.callback[2].split(/,\s*/), event1.callback[1]);
            event1.timerId = setTimeout(() => {
                recurTimerId = setInterval(() => {
                    callback();
                    let events = lsLoad();
                    let event = lsGet(event1.name);
                    event.time = new Date(Date.parse(event.time) + timeParse1(event1.interval).getTime() - Date.now());
                    events = events.filter(event => event.name !== event1.name);
                    events.push(event);
                    lsSave(events);
                }, timeParse1(event1.interval).getTime() - Date.now());
                callback();
                let events = lsLoad();
                let event = lsGet(event1.name);
                event.time = new Date(Date.parse(event1.time) + timeParse1(event1.interval).getTime() - Date.now());
                event.timerId = recurTimerId;
                events = events.filter(event => event.name !== event1.name);
                events.push(event);
                lsSave(events);
            }, Date.parse(event1.time) - Date.now());

            if (event1.extraTime != undefined && event1.extraCallback != undefined) {
                const extraCallback = new Function(...event1.extraCallback[2].split(/,\s*/), event1.extraCallback[1]);
                event1.extraTimerId = setTimeout(() => {
                    extraRecurTimerId = setInterval(() => {
                        extraCallback();
                    }, timeParse1(event1.interval).getTime() - Date.now());
                    extraCallback();
                    let events = lsLoad();
                    let event = lsGet(event1.name);
                    event.extraTimerId = extraRecurTimerId;
                    events = events.filter(event => event.name !== event1.name);
                    events.push(event);
                    lsSave(events);
                }, extraTimeParse(event1.extraTime, Date.parse(event1.time)));
            }

            newEvents.push(event1);
        }
        else if (event1.hasOwnProperty("interval") && intervalParse(event1.interval) !== -1) {
            recurTimerId = new Array();
            let newInterval = new Array();
            for (x of intervalParse(event1.interval)) {
                let diff = x - new Date().getDay();
                if (diff < 0) {
                    diff = diff + 7;
                }

                let date = new Date();
                date.setDate(new Date().getDate() + diff);
                date.setHours(new Date(event1.time).getHours(), new Date(event1.time).getMinutes(), new Date(event1.time).getSeconds(), 0);

                if (date.getTime() < Date.now()) {
                    date.setDate(date.getDate() + 7);
                }

                newInterval.push(date.getTime());
            }
            newInterval.sort((a, b) => a - b);
            let i = 0;
            const callback = new Function(...event1.callback[2].split(/,\s*/), event1.callback[1]);
            if (event1.extraTime != undefined && event1.extraCallback != undefined) {
                const extraCallback = new Function(...event1.extraCallback[2].split(/,\s*/), event1.extraCallback[1]);
            }
            for (x of newInterval) {
                event1.timerId[i] = setTimeout(() => {
                    recurTimerId[i] = setInterval(() => {
                        callback();
                        let events = lsLoad();
                        let event = lsGet(event1.name);
                        event.time = new Date((i < newInterval.length - 1) ? newInterval[i + 1] + (7 * 24 * 3600 * 1000) * Math.round((Date.now() - newInterval[i]) / (7 * 24 * 3600 * 1000)) : newInterval[0] + (7 * 24 * 3600 * 1000) * (Math.round((Date.now() - newInterval[i]) / (7 * 24 * 3600 * 1000)) + 1));
                        events = events.filter(event => event.name !== event1.name);
                        events.push(event);
                        lsSave(events);
                    }, 7 * 24 * 3600 * 1000);
                    callback();
                    let events = lsLoad();
                    let event = lsGet(event1.name);
                    event.time = new Date((i < newInterval.length - 1) ? newInterval[i + 1] : newInterval[0] + 7 * 24 * 3600 * 1000);
                    event.timerId[i] = recurTimerId[i];
                    events = events.filter(event => event.name !== event1.name);
                    events.push(event);
                    lsSave(events);
                }, x - Date.now());

                if (event1.extraTime != undefined && event1.extraCallback != undefined) {
                    extraRecurTimerId = new Array();
                    event1.extraTimerId[i] = setTimeout(() => {
                        extraRecurTimerId[i] = setInterval(() => {
                            extraCallback();
                        }, 7 * 24 * 3600 * 1000);
                        extraCallback();
                        let events = lsLoad();
                        let event = lsGet(event1.name);
                        event.extraTimerId[i] = extraRecurTimerId[i];
                        events = events.filter(event => event.name !== event1.name);
                        events.push(event);
                        lsSave(events);
                    }, extraTimeParse(extraTime, x));
                }
                i++;
            }
            i = 0;

            newEvents.push(event1);
        }
        else {
            if (Date.parse(event1.time) > Date.now()) {
                const callback = new Function(...event1.callback[2].split(/,\s*/), event1.callback[1]);
                event1.timerId = setTimeout(() => {
                    callback();
                    lsDelete(event1.name);
                }, Date.parse(event1.time) - Date.now());

                if (event1.extraTime != undefined && event1.extraCallback != undefined) {
                    const extraCallback = new Function(...event1.extraCallback[2].split(/,\s*/), event1.extraCallback[1]);
                    event1.extraTimerId = setTimeout(() => {
                        extraCallback();
                    }, extraTimeParse(event1.extraTime, Date.parse(event1.time)));
                }

                newEvents.push(event1);
            }
        }

        lsSave(newEvents);
    }
}

function timeParse1(time) {
    if (!/^\d+[YyMmWwDdHhSs](\s*\d+[YyMmWwDdHhSs])*$/.test(time.trim())) {
        return -1;
    }

    const arr = time.trim().split(/(?<=Y|y|M|W|w|D|d|h|H|m|s|S)\s*/);
    let date = new Date();

    for (let x of arr) {
        switch (x.at(-1)) {
            case "Y":
            case "y":
                date.setFullYear(date.getFullYear() + +x.slice(0, x.length - 1));
                break;
            case "M":
                date.setMonth(date.getMonth() + +x.slice(0, x.length - 1));
                break;
            case "W":
            case "w":
                date.setDate(date.getDate() + 7 * +x.slice(0, x.length - 1));
                break;
            case "D":
            case "d":
                date.setDate(date.getDate() + +x.slice(0, x.length - 1));
                break;
            case "h":
            case "H":
                date.setHours(date.getHours() + +x.slice(0, x.length - 1));
                break;
            case "m":
                date.setMinutes(date.getMinutes() + +x.slice(0, x.length - 1));
                break;
            case "s":
            case "S":
                date.setSeconds(date.getSeconds() + +x.slice(0, x.length - 1));
                break;
        }
    }

    return date;
}

function extraTimeParse(time, date) {
    if (!/^\d+[YyMmWwDdHhSs](\s*\d+[YyMmWwDdHhSs])*$/.test(time.trim())) {
        return -1;
    }

    const arr = time.trim().split(/(?<=Y|y|M|W|w|D|d|h|H|m|s|S)\s*/);
    date = new Date(date);

    for (let x of arr) {
        switch (x.at(-1)) {
            case "Y":
            case "y":
                date.setFullYear(date.getFullYear() - +x.slice(0, x.length - 1));
                break;
            case "M":
                date.setMonth(date.getMonth() - +x.slice(0, x.length - 1));
                break;
            case "W":
            case "w":
                date.setDate(date.getDate() - 7 * +x.slice(0, x.length - 1));
                break;
            case "D":
            case "d":
                date.setDate(date.getDate() - +x.slice(0, x.length - 1));
                break;
            case "h":
            case "H":
                date.setHours(date.getHours() - +x.slice(0, x.length - 1));
                break;
            case "m":
                date.setMinutes(date.getMinutes() - +x.slice(0, x.length - 1));
                break;
            case "s":
            case "S":
                date.setSeconds(date.getSeconds() - +x.slice(0, x.length - 1));
                break;
        }
    }

    if (date.getTime() <= Date.now()) {
        return -1;
    }
    return date.getTime() - Date.now();
}

function timeParse2(time) {
    if (!/^([01]?\d|2[0-3]):([012345]?\d)(:[012345]?\d)?$/.test(time.trim())) {
        return -1;
    }
    
    const arr = time.trim().split(":");
    let i = 0;
    for (let x of arr) {
        if (x.length == 2 && x[0] == "0") {
            x = x.slice(1);
        }
        arr[i] = +x;
        i++;
    }
    if(arr.length == 2) {
        arr[2] = 0;
    }

    return arr;
}

function intervalParse(interval) {
    if (!/^(mon|tue|wed|thu|fri|sat|sun)(\s+(mon|tue|wed|thu|fri|sat|sun)){0,6}$/.test(interval.trim().toLowerCase()) || hasDuplicates(interval.trim().toLowerCase().split(/\s+/))) {
        return -1;
    }

    const arr = new Array();
    const arr2 = interval.trim().toLowerCase().split(/\s+/);

    for (let x of arr2) {
        switch (x) {
            case "mon":
                arr.push(1);
                break;
            case "tue":
                arr.push(2);
                break;
            case "wed":
                arr.push(3);
                break;
            case "thu":
                arr.push(4);
                break;
            case "fri":
                arr.push(5);
                break;
            case "sat":
                arr.push(6);
                break;
            case "sun":
                arr.push(0);
                break;
        }
    }

    return arr;
}

function functionParse(callback) {
    const callbackString = callback.toString();
    const name = callback.name;
    const body = callbackString.substring((callbackString.indexOf("{")) + 1, callbackString.lastIndexOf("}"));
    const params = callbackString.substring((callbackString.indexOf("(")) + 1, callbackString.indexOf(")"));
    const callbackArray = [name, body, params];
    return callbackArray;
}

function hasDuplicates(array) {
    if (new Set(array).size !== array.length) {
        return true;
    }
    return false;
}

function findMinDifference(array) {
    if (array.length < 1) {
        return -1;
    }
    else if (array.length == 1) {
        return 7;
    }

    array.sort((a, b) => a - b);

    let minDiff;
    for (let i = 0; i < arr.length - 1; i++) {
        let diff = arr[i + 1] - arr[i];
        if (diff < minDiff) {
            minDiff = diff;
        }
    }

    return minDiff;
}

function lsSave(events) {
    localStorage.setItem("coe-events", JSON.stringify(events));
}

function lsLoad() {
    if (JSON.parse(localStorage.getItem("coe-events")) == null) {
        return new Array();
    }
    return JSON.parse(localStorage.getItem("coe-events"));
}

function lsGet(name) {
    const events = lsLoad();
    if (events.length === 0) {
        return -1;
    }
    if (events.find(event => event.name === name) === undefined) {
        return -1;
    }
    return events.find(event => event.name === name);
}

function lsDelete(name) {
    let events = lsLoad();
    if (events.length === 0) {
        return -1;
    }
    if (events.find(event => event.name === name) === undefined) {
        return -1;
    }
    events = events.filter(event => event.name !== name);
    lsSave(events); 
}

function clear() {
    localStorage.clear();
}

function testFunction1() {
    console.log("Test function 1");
}

function testFunction2(a, b,c ,s) {
    console.log("Test function 2");
    console.log(a + b + c + s);
}

init();