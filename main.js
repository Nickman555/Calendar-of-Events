function getEvents(period) {
    if (period != undefined) {
        for (let i = 0; i<localStorage.length; i++) {
            let key = localStorage.key(i);
            if (JSON.parse(localStorage.getItem(key)).date > Date.now() && JSON.parse(localStorage.getItem(key)).date < new Date(period)) {
                console.log(`${key} - date:${JSON.parse(localStorage.getItem(key)).date}, func:${JSON.parse(localStorage.getItem(key)).func}`);
            }
        }
    }
    else {
        for (let i = 0; i<localStorage.length; i++) {
            let key = localStorage.key(i);
            console.log(`${key} - date:${JSON.parse(localStorage.getItem(key)).date}, func:${JSON.parse(localStorage.getItem(key)).func}`);
        }
    }
}

function addEvent(name, date, func = testFunction1) {
    let timerId = setTimeout(() => {
        func();
        localStorage.removeItem(name);
    }, new Date(date) - Date.now());

    let event = {
        name: name,
        date: date,
        func: func.name,
        timerId: timerId
    };

    localStorage.setItem(name, JSON.stringify(event));
}

function deleteEvent(name) {
    clearTimeout(JSON.parse(localStorage.getItem(name)).timerId);

    localStorage.removeItem(name);
}

function editEvent(name, newName, newDate) {
    
}

function clear() {
    localStorage.clear();
}

function testFunction1() {
    console.log("Test function 1");
}