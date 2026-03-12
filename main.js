function getEvents(period = "100y") {
    let events = new Array();
    for (let i = 0; i<localStorage.length; i++) {
        let key = localStorage.key(i);
        if (Date.parse(JSON.parse(localStorage.getItem(key)).date) > Date.now() && Date.parse(JSON.parse(localStorage.getItem(key)).date) < Date.now() + timeParse(period)) {
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

function addEvent(name, date = "10s", func = testFunction1) {
    if (localStorage.getItem(name) !== null) {
        console.log("Event with that name already exists");
        return null;
    }

    let timerId = setTimeout(() => {
        func();
        localStorage.removeItem(name);
    }, timeParse(date));

    let event = {
        name: name,
        date: new Date(Date.now() + timeParse(date)),
        func: func.name,
        timerId: timerId
    };

    localStorage.setItem(name, JSON.stringify(event));

    if (localStorage.getItem(name) !== null) {
        console.log(`${name} was created successfully`);
        return localStorage.getItem(name);
    }
    else {
        console.log("Something went wrong");
        return null;
    }
}

function deleteEvent(name) {
    if (localStorage.getItem(name) === null) {
        console.log("Event with that name doesn't exist");
        return null;
    }

    clearTimeout(JSON.parse(localStorage.getItem(name)).timerId);

    localStorage.removeItem(name);

    if (localStorage.getItem(name) === null) {
        console.log(`${name} was deleted successfully`);
        return null;
    }
    else {
        console.log("Something went wrong");
        return null;
    }
}

function editEvent(name, newName, newDate) {
    if (localStorage.getItem(name) === null) {
        console.log("Event with that name doesn't exist");
        return null;
    }

    let event = JSON.parse(localStorage.getItem(name));

    if (newName != undefined || newDate != undefined) {
        clearTimeout(event.timerId);

        let timerId = setTimeout(() => {
            event.func();
            localStorage.removeItem((newName != undefined) ? newName : event.name);
        }, new Date((newDate != undefined) ? Date.now() + timeParse(newDate) : event.date) - Date.now());
        if (newName != undefined) {
            event.name = newName;
        }
        if (newDate != undefined) {
            event.date = newDate;
        }
        event.timerId = timerId;

        localStorage.removeItem(name);
        localStorage.setItem(newName, JSON.stringify(event));

        console.log(`${name} was edited successfully`);
        return localStorage.getItem(newName);
    }
    else {
        return localStorage.getItem(name);
    }
}

function init() {
    let events = new Array();
    for (let i = 0; i<localStorage.length; i++) {
        let key = localStorage.key(i);
        let event = JSON.parse(localStorage.getItem(key));
        if (Date.parse(event.date) > Date.now()) {
            event.timerId = setTimeout(() => {
                event.func();
                localStorage.removeItem(event.name);
            }, new Date(event.date) - Date.now());

            events.push(event);
        }
    }
    for (let event of events) {
        localStorage.setItem(event.name, JSON.stringify(event))
    }

    getEvents();
}

function timeParse(time) {
    let parsedTime = 0;
    if (!isNaN(Date.parse(time))) {
        parsedTime = new Date(time) - Date.now();
    }
    else {
        let arr = new Array();
        let timeStr = time;
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
    return parsedTime;
}

function clear() {
    localStorage.clear();
}

function testFunction1() {
    console.log("Test function 1");
}