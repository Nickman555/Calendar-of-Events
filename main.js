function getEvents(period = "100y") {
    if (timeParse(period) == -1) {
        console.log("Period invalid");
        return null;
    }

    const events = new Array();
    for (let i = 0; i<localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key.startsWith("CoE-")) {
            continue;
        }
        const date = JSON.parse(localStorage.getItem(key)).date;
        if (Date.parse(date) > Date.now() && Date.parse(date) < Date.now() + timeParse(period)) {
            events.push(localStorage.getItem(key));
        }
    }

    if (events.length == 0) {
        console.log("There are no events");
        return null;
    }
    for (let event of events) {
        console.log(event);
    }
    return events;
}

function addEvent(name, date = "10s", callback = testFunction1) {
    if (localStorage.getItem("CoE-" + name) !== null) {
        console.log("Event with that name already exists");
        return null;
    }
    if (timeParse(date) == -1) {
        console.log("Date invalid");
        return null;
    }

    if (date) {

    }

    const timerId = setTimeout(() => {
        callback();
        localStorage.removeItem("CoE-" + name);
    }, timeParse(date));

    const event = {
        name: name,
        date: new Date(Date.now() + timeParse(date)),
        callback: functionParse(callback),
        timerId: timerId
    };

    localStorage.setItem("CoE-" + name, JSON.stringify(event));

    if (localStorage.getItem("CoE-" + name) !== null) {
        console.log(`${name} was created successfully`);
        return localStorage.getItem("CoE-" + name);
    }
    else {
        console.log("Something went wrong");
        return null;
    }
}

function deleteEvent(name) {
    if (localStorage.getItem("CoE-" + name) === null) {
        console.log("Event with that name doesn't exist");
        return null;
    }

    clearTimeout(JSON.parse(localStorage.getItem("CoE-" + name)).timerId);

    localStorage.removeItem("CoE-" + name);

    if (localStorage.getItem("CoE-" + name) === null) {
        console.log(`${name} was deleted successfully`);
        return null;
    }
    else {
        console.log("Something went wrong");
        return null;
    }
}

function changeEventName(name, newName) {
    if (localStorage.getItem("CoE-" + name) === null) {
        console.log("Event with that name doesn't exist");
        return null;
    }
    if (newName === undefined) {
        return localStorage.getItem("CoE-" + name);
    }

    const event = JSON.parse(localStorage.getItem("CoE-" + name));

    clearTimeout(event.timerId);

    const body = event.callback[1];
    const params = event.callback[2].split(/,\s*/);
    const callback = new Function(...params, body);
    const timerId = setTimeout(() => {
        callback();
        localStorage.removeItem("CoE-" + newName);
    }, new Date(Date.parse(event.date) - Date.now()));
    event.name = newName;
    event.timerId = timerId;

    localStorage.removeItem("CoE-" + name);
    localStorage.setItem("CoE-" + newName, JSON.stringify(event));

    console.log(`${name} name was changed to ${newName} successfully`);
    return localStorage.getItem("CoE-" + (newName));
}

function changeEventDate(name, newDate) {
    if (localStorage.getItem("CoE-" + name) === null) {
        console.log("Event with that name doesn't exist");
        return null;
    }
    if (newDate != undefined && timeParse(newDate) == -1) {
        console.log("Date invalid");
        return null;
    }

    const event = JSON.parse(localStorage.getItem("CoE-" + name));

    clearTimeout(event.timerId);

    const body = event.callback[1];
    const params = event.callback[2].split(/,\s*/);
    const callback = new Function(...params, body);
    const timerId = setTimeout(() => {
        callback();
        localStorage.removeItem("CoE-" + name);
    }, new Date(timeParse(newDate)));
    event.date = new Date(Date.now() + timeParse(newDate));
    event.timerId = timerId;

    localStorage.removeItem("CoE-" + name);
    localStorage.setItem("CoE-" + name, JSON.stringify(event));

    console.log(`${name} date was changed successfully`);
    return localStorage.getItem("CoE-" + (name));
}

function init() {
    const events = new Array();
    for (let i = 0; i<localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key.startsWith("CoE-")) {
            continue;
        }
        const event = JSON.parse(localStorage.getItem(key));
        if (Date.parse(event.date) > Date.now()) {
            const body = event.callback[1];
            const params = event.callback[2].split(/,\s*/);
            const callback = new Function(...params, body);
            event.timerId = setTimeout(() => {
                callback();
                localStorage.removeItem("CoE-" + event.name);
            }, new Date(event.date) - Date.now());

            events.push(event);
        }
    }
    for (let event of events) {
        localStorage.setItem("CoE-" + event.name, JSON.stringify(event))
    }

    getEvents();
}

function timeParse(time) {
    let parsedTime = 0;
    if (!isNaN(Date.parse(time.trim())) && Date.parse(time.trim()) > Date.now()) {
        parsedTime = new Date(time.trim()) - Date.now();
    }
    else if (/^\d+[YyMmWwDdHhSs](\s*\d+[YyMmWwDdHhSs])*$/.test(time.trim())) {
        const arr = new Array();
        let timeStr = time.trim();
        let i = 0;

        while (true) {
            i = timeStr.search(/[YyMWwDdhHmsS]/);
            if (i == -1) break;
            arr.push(timeStr.slice(0, i + 1));
            k = timeStr.slice(i + 1).search(/[0123456789]/);
            if (k == -1) break;
            timeStr = timeStr.slice(i + 1 + k);
        }

        for (let x of arr) {
            switch (x.at(-1)) {
                case "Y":
                case "y":
                    parsedTime += x.slice(0, x.length - 1) * 365 * 24 * 3600 * 1000;
                    break;
                case "M":
                    parsedTime += x.slice(0, x.length - 1) * 30 * 24 * 3600 * 1000;
                    break;
                case "W":
                case "w":
                    parsedTime += x.slice(0, x.length - 1) * 7 * 24 * 3600 * 1000;
                    break;
                case "D":
                case "d":
                    parsedTime += x.slice(0, x.length - 1) * 24 * 3600 * 1000;
                    break;
                case "h":
                case "H":
                    parsedTime += x.slice(0, x.length - 1) * 3600 * 1000;
                    break;
                case "m":
                    parsedTime += x.slice(0, x.length - 1) * 60 * 1000;
                    break;
                case "s":
                case "S":
                    parsedTime += x.slice(0, x.length - 1) * 1000;
                    break;
            }
        }
    }
    else {
        return -1;
    }
    return parsedTime;
}

function functionParse(callback) {
    const callbackString = callback.toString();
    const name = callback.name;
    const body = callbackString.substring((callbackString.indexOf("{")) + 1, callbackString.lastIndexOf("}"));
    const params = callbackString.substring((callbackString.indexOf("(")) + 1, callbackString.indexOf(")"));
    const callbackArray = [name, body, params];
    return callbackArray;
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