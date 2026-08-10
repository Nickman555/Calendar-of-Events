/**
 * Вывод в консоль списка событий
 * @param {number} period - Период за который необходим список событий (в мс), по умолчанию - все события (за 100 лет)
 * @returns {array} Список событий за указанный период
 */
function getEvents(period = 3153600000000) {
    let events = lsLoad();
    if (events === -1 || events.length === 0) return "There are no events.";

    if (typeof(period) !== "number" || period < 0) return "Period is invalid.";

    events = events.filter(event => event.dateTime <= Date.now() + period);

    if (events.length === 0) return "There are no events for this period.";
    else {
        for (let event of events) {
            console.log(event);
        }
        return events;
    }
}

/**
 * Создание нового события
 * @param {string} name - Имя события
 * @param {number} dateTime - Время через которое будет вызвана функция callback (в мс)
 * @param {function} callback - Функция которая будет вызвана через время dateTime
 * @param {number} extraTime - Время до вызова функции callback за которое будет вызвана функция extraCallback (в мс)
 * @param {function} extraCallback - Функция которая будет вызвана за время extraTime до вызова функции callback
 * @returns {object} Созданное в результате работы функции событие
 */
function addEvent(name, dateTime, callback, extraTime, extraCallback) {
    let events = lsLoad();
    if (events === -1) events = new Array();

    let isExtra = false;

    if (name === undefined) return "Name is not defined.";
    if (lsGet(name) !== -1) return "Event with this name already exists.";
    if (dateTime === undefined) return "DateTime is not defined.";
    if (typeof(dateTime) !== "number" || dateTime < 0) return "DateTime is invalid.";
    if (callback === undefined) return "Callback is not defined.";
    if (extraTime !== undefined && extraCallback !== undefined) {
        isExtra = true;
        if (typeof(extraTime) !== "number" || extraTime < 0) return "ExtraTime is invalid.";
    }

    const timerId = setTimeout(() => {
        callback();
        lsDelete(name);
    }, dateTime);

    let extraTimerId = null;
    if (isExtra) {
        extraTimerId = setTimeout(() => {
            extraCallback();
        }, dateTime - extraTime);
    }

    const event = {
        name: name,
        dateTime: Date.now() + dateTime,
        callback: functionParse(callback),
        timerId: timerId,
        extraTime: (isExtra) ? extraTime : null,
        extraCallback: (isExtra) ? functionParse(extraCallback) : null,
        extraTimerId: extraTimerId
    };

    events.push(event);
    lsSave(events);

    if (lsGet(name) !== -1) return lsGet(name);
    else return "Something went wrong.";
}

/**
 * Создание нового повторяющегося события
 * @param {string} name - Имя повторяющегося события
 * @param {string} time - Время в которое будет вызываться повторяющееся событие (в формате "HH:MM:SS")
 * @param {string} days - Дни недели в которые будет вызываться повторяющееся событие (в формате "mon tue ... sun")
 * @param {function} callback - Функция которая будет вызываться в дни days во время time
 * @param {number} extraTime - Время до вызова функции callback за которое будет вызываться функция extraCallback (в мс)
 * @param {function} extraCallback - Функция которая будет вызываться за время extraTime до вызова функции callback
 * @returns {object} Созданное в результате работы функции повторяющееся событие
 */
function addRecurEvent(name, time, days, callback, extraTime, extraCallback) {
    let events = lsLoad();
    if (events === -1) events = new Array();

    let isExtra = false;

    if (name === undefined) return "Name is not defined.";
    if (lsGet(name) !== -1) return "Event with this name already exists.";
    if (time === undefined) return "Time is not defined.";
    if (timeParse(time) === -1) return "Time is invalid.";
    if (days === undefined) return "Days is not defined.";
    if (daysParse(days) === -1) return "Days is invalid.";
    if (callback === undefined) return "Callback is not defined.";
    if (extraTime !== undefined && extraCallback !== undefined) {
        isExtra = true;
        if (typeof(extraTime) !== "number" || extraTime < 0) return "ExtraTime is invalid.";
    }

    time = timeParse(time);
    days = daysParse(days);

    let arr = new Array();
    for (let day of days.sort()) {
        let date = new Date();
        date.setDate(date.getDate() - date.getDay() + day);
        date.setHours(time[0], time[1], time[2], 0);
        if (date.getTime() < Date.now()) date.setDate(date.getDate() + 7);
        arr.push(date.getTime());
    }
    arr.sort();

    const timerId = timeoutRec(arr, callback, name, false);

    let extraTimerId = null;
    if (isExtra) {
        let extraArr = new Array();
        for (let time of arr) {
            extraArr.push(time - extraTime);
        }
        extraTimerId = timeoutRec(extraArr, extraCallback, name, true);
    }

    const event = {
        name: name,
        time: time,
        days: days,
        dateTime: arr[0],
        callback: functionParse(callback),
        timerId: timerId,
        extraTime: (isExtra) ? extraTime : null,
        extraCallback: (isExtra) ? functionParse(extraCallback) : null,
        extraTimerId: extraTimerId
    };

    events.push(event);
    lsSave(events);

    if (lsGet(name) !== -1) return lsGet(name);
    else return "Something went wrong.";
}

/**
 * Вспомогательная функция, которая создаёт рекурсию из setTimeout'ов для повторяющегося события
 * @param {array} time - Массив с отсортированными таймстампами, обозначающими когда необходимо вызывать функцию callback
 * @param {function} callback - Функция которая будет вызываться через определённое время
 * @param {string} name - Имя события для которого вызывается функция
 * @param {boolean} isExtra - Обозначение будет ли setTimeout вызывать основную функцию callback или дополнительную extraCallback (если false - то основную, и наоборот)
 * @returns {number} Идентификатор созданного setTimeout
 */
function timeoutRec(time, callback, name, isExtra) {
    let id = setTimeout(() => {
        callback();
        time[0] = time[0] + 604800000;
        time.sort();
        let event = lsGet(name);
        if (!isExtra) event.dateTime = time[0];
        if (!isExtra) event.timerId = timeoutRec(time, callback, name, isExtra);
        else event.extraTimerId = timeoutRec(time, callback, name, isExtra);
        lsDelete(name);
        let events = lsLoad();
        events.push(event);
        lsSave(events);
    }, time[0] - Date.now());
    return id;
}

/**
 * Инициализация всех имеющихся в памяти событий (создание им setTimeout'ов)
 * @returns {string} Сообщение что все имеющиеся события были успешно инициализированы
 */
function init() {
    let events = lsLoad();
    if (events === -1 || events.length === 0) return "There are no events.";
    let newEvents = new Array();

    for (let event of events) {
        if (!event.hasOwnProperty("time") && !event.hasOwnProperty("days")) {
            const callback = new Function(...event.callback[2].split(/,\s*/), event.callback[1]);
            event.timerId = setTimeout(() => {
                callback();
                lsDelete(event.name);
            }, event.dateTime - Date.now());

            if (event.extraTimerId !== null && Date.now() < event.dateTime - event.extraTime) {
                const extraCallback = new Function(...event.extraCallback[2].split(/,\s*/), event.extraCallback[1]);
                event.extraTimerId = setTimeout(() => {
                    extraCallback();
                }, event.dateTime - Date.now() - event.extraTime);
            }

            newEvents.push(event);
        }
        else if (event.hasOwnProperty("time") && event.hasOwnProperty("days")) {
            let arr = new Array();
            for (let day of event.days.sort()) {
                let date = new Date();
                date.setDate(date.getDate() - date.getDay() + day);
                date.setHours(event.time[0], event.time[1], event.time[2], 0);
                if (date.getTime() < Date.now()) date.setDate(date.getDate() + 7);
                arr.push(date.getTime());
            }
            arr.sort();

            const callback = new Function(...event.callback[2].split(/,\s*/), event.callback[1]);
            event.timerId = timeoutRec(arr, callback, event.name, false);

            if (event.extraTimerId !== null) {
                let extraArr = new Array();
                for (let time of arr) {
                    extraArr.push(time - event.extraTime);
                }
                const extraCallback = new Function(...event.extraCallback[2].split(/,\s*/), event.extraCallback[1]);
                event.extraTimerId = timeoutRec(extraArr, extraCallback, event.name, true);
            }

            newEvents.push(event);
        }
    }
    lsSave(newEvents);

    if (newEvents.length === events.length) return "Events were successfully initialized.";
    else return "Something went wrong.";
}

/**
 * Удаление события по имени
 * @param {string} name - Имя удаляемого события
 * @returns {string} Сообщение об успешном удалении события
 */
function deleteEvent(name) {
    let event = lsGet(name);
    if (event === -1) return "Event with this name does not exist.";
    if (event.hasOwnProperty("time") && event.hasOwnProperty("days")) return "This event is recurring, use deleteRecurEvent function.";

    clearTimeout(event.timerId);
    if (event.extraTimerId !== null && Date.now() < event.dateTime - event.extraTime) clearTimeout(event.extraTimerId);

    lsDelete(name);

    if (lsGet(name) === -1) return "Event was deleted successfully.";
    else return "Something went wrong.";
}

/**
 * Удаление повторяющегося события по имени
 * @param {string} name - Имя удаляемого повторяющегося события
 * @returns {string} Сообщение об успешном удалении повторяющегося события
 */
function deleteRecurEvent(name) {
    let event = lsGet(name);
    if (event === -1) return "Event with this name does not exist.";
    if (!event.hasOwnProperty("time") && !event.hasOwnProperty("days")) return "This event is not recurring, use deleteEvent function.";

    clearTimeout(event.timerId);
    if (event.extraTimerId !== null) clearTimeout(event.extraTimerId);

    lsDelete(name);

    if (lsGet(name) === -1) return "Event was deleted successfully.";
    else return "Something went wrong.";
}

/**
 * Изменение имени события
 * @param {string} name - Текущее имя события
 * @param {string} newName - Новое имя события
 * @returns {object} Событие с изменённым в результате работы функции именем
 */
function changeEventName(name, newName) {
    let event = lsGet(name);
    if (event === -1) return "Event with this name does not exist.";
    if (event.hasOwnProperty("time") && event.hasOwnProperty("days")) return "This event is recurring, use changeRecurEventName function.";

    if (newName === undefined) return "NewName is not defined.";
    if (lsGet(newName) !== -1) return "Event with this NewName already exists.";

    clearTimeout(event.timerId);
    const callback = new Function(...event.callback[2].split(/,\s*/), event.callback[1]);
    event.timerId = setTimeout(() => {
        callback();
        lsDelete(newName);
    }, event.dateTime - Date.now());

    event.name = newName;

    lsDelete(name);
    let events = lsLoad();
    events.push(event);
    lsSave(events);

    if (lsGet(name) !== -1 || lsGet(newName) === -1) return "Something went wrong.";
    else return lsGet(newName);
}

/**
 * Изменение имени повторяющегося события
 * @param {string} name - Текущее имя повторяющегося события
 * @param {string} newName - Новое имя повторяющегося события
 * @returns {object} Повторяющееся событие с изменённым в результате работы функции именем
 */
function changeRecurEventName(name, newName) {
    let event = lsGet(name);
    if (event === -1) return "Event with this name does not exist.";
    if (!event.hasOwnProperty("time") && !event.hasOwnProperty("days")) return "This event is not recurring, use changeEventName function.";

    if (newName === undefined) return "NewName is not defined.";
    if (lsGet(newName) !== -1) return "Event with this NewName already exists.";

    let arr = new Array();
    for (let day of event.days.sort()) {
        let date = new Date();
        date.setDate(date.getDate() - date.getDay() + day);
        date.setHours(event.time[0], event.time[1], event.time[2], 0);
        if (date.getTime() < Date.now()) date.setDate(date.getDate() + 7);
        arr.push(date.getTime());
    }
    arr.sort();

    clearTimeout(event.timerId);
    const callback = new Function(...event.callback[2].split(/,\s*/), event.callback[1]);
    event.timerId = timeoutRec(arr, callback, newName, false);

    if (event.extraTimerId !== null) {
        let extraArr = new Array();
        for (let time of arr) {
            extraArr.push(time - event.extraTime);
        }

        clearTimeout(event.extraTimerId);
        const extraCallback = new Function(...event.extraCallback[2].split(/,\s*/), event.extraCallback[1]);
        event.extraTimerId = timeoutRec(extraArr, extraCallback, newName, true);
    }

    event.name = newName;

    lsDelete(name);
    let events = lsLoad();
    events.push(event);
    lsSave(events);

    if (lsGet(name) !== -1 || lsGet(newName) === -1) return "Something went wrong.";
    else return lsGet(newName);
}

/**
 * Изменение времени выполнения события по имени
 * @param {string} name - Имя события которому необходимо поменять время выполнения
 * @param {number} newDateTime - Новое время выполнения события (в мс)
 * @returns {object} Событие с изменённым в результате работы функции временем выполнения
 */
function changeEventDate(name, newDateTime) {
    let event = lsGet(name);
    if (event === -1) return "Event with this name does not exist.";
    if (event.hasOwnProperty("time") && event.hasOwnProperty("days")) return "This event is recurring, use changeRecurEventDate function.";

    if (newDateTime === undefined) return "NewDateTime is not defined.";
    if (typeof(newDateTime) !== "number" || newDateTime < 0) return "NewDateTime is invalid.";

    clearTimeout(event.timerId);
    const callback = new Function(...event.callback[2].split(/,\s*/), event.callback[1]);
    event.timerId = setTimeout(() => {
        callback();
        lsDelete(name);
    }, newDateTime);

    if (event.extraTimerId !== null && Date.now() < event.dateTime - event.extraTime) clearTimeout(event.extraTimerId);
    if (event.extraTimerId !== null) {
        const extraCallback = new Function(...event.extraCallback[2].split(/,\s*/), event.extraCallback[1]);
        event.extraTimerId = setTimeout(() => {
            extraCallback();
        }, newDateTime - event.extraTime);
    }

    event.dateTime = Date.now() + newDateTime;

    lsDelete(name);
    let events = lsLoad();
    events.push(event);
    lsSave(events);

    if (lsGet(name).dateTime !== Date.now() + newDateTime) return "Something went wrong.";
    else return lsGet(name);
}

/**
 * Изменение времени и/или дней выполнения повторяющегося события по имени
 * @param {string} name - Имя повторяющегося события которому необходимо поменять время и/или дни выполнения
 * @param {string} newTime - Новое время в которое будет вызываться повторяющееся событие (в формате "HH:MM:SS")
 * @param {string} newDays - Новые дни недели в которые будет вызываться повторяющееся событие (в формате "mon tue ... sun")
 * @returns {object} Повторяющееся событие с изменённым в результате работы функции временем и/или днями выполнения
 */
function changeRecurEventDate(name, newTime, newDays) {
    let event = lsGet(name);
    if (event === -1) return "Event with this name does not exist.";
    if (!event.hasOwnProperty("time") && !event.hasOwnProperty("days")) return "This event is not recurring, use changeEventDate function.";

    if (newTime === undefined && newDays === undefined) return "Both NewTime and NewDays are not defined.";
    if (newTime !== undefined && timeParse(newTime) === -1) return "NewTime is invalid.";
    if (newDays !== undefined && daysParse(newDays) === -1) return "NewDays is invalid.";

    if (newTime === undefined) newTime = event.time;
    else newTime = timeParse(newTime);
    if (newDays === undefined) newDays = event.days;
    else newDays = daysParse(newDays);

    let arr = new Array();
    for (let day of newDays.sort()) {
        let date = new Date();
        date.setDate(date.getDate() - date.getDay() + day);
        date.setHours(newTime[0], newTime[1], newTime[2], 0);
        if (date.getTime() < Date.now()) date.setDate(date.getDate() + 7);
        arr.push(date.getTime());
    }
    arr.sort();

    clearTimeout(event.timerId);
    const callback = new Function(...event.callback[2].split(/,\s*/), event.callback[1]);
    event.timerId = timeoutRec(arr, callback, name, false);

    if (event.extraTimerId !== null) {
        let extraArr = new Array();
        for (let time of arr) {
            extraArr.push(time - event.extraTime);
        }

        clearTimeout(event.extraTimerId);
        const extraCallback = new Function(...event.extraCallback[2].split(/,\s*/), event.extraCallback[1]);
        event.extraTimerId = timeoutRec(extraArr, extraCallback, name, true);
    }

    event.time = newTime;
    event.days = newDays;
    event.dateTime = arr[0];

    lsDelete(name);
    let events = lsLoad();
    events.push(event);
    lsSave(events);

    if (JSON.stringify(lsGet(name).time) !== JSON.stringify(newTime) || JSON.stringify(lsGet(name).days) !== JSON.stringify(newDays)) return "Something went wrong.";
    else return lsGet(name);
}

/**
 * Добавление/замена, для события, дополнительной функции которая вызывается за заданное время до вызова основной функции
 * @param {string} name - Имя события которому необходимо добавить/заменить дополнительную функцию
 * @param {number} extraTime - Время до вызова основной функции за которое будет вызвана дополнительная функция extraCallback (в мс)
 * @param {function} extraCallback - Дополнительная функция которая будет вызвана за время extraTime до вызова основной функции
 * @returns {object} Событие с добавленной/заменённой в результате работы функции дополнительной функцией
 */
function addExtraCallback(name, extraTime, extraCallback) {
    let event = lsGet(name);
    if (event === -1) return "Event with this name does not exist.";
    if (event.hasOwnProperty("time") && event.hasOwnProperty("days")) return "This event is recurring, use addExtraRecurCallback function.";

    if (extraTime === undefined) return "ExtraTime is not defined.";
    if (typeof(extraTime) !== "number" || extraTime < 0) return "ExtraTime is invalid.";
    if (extraCallback === undefined) return "ExtraCallback is not defined.";

    if (event.extraTimerId !== null && Date.now() < event.dateTime - event.extraTime) clearTimeout(event.extraTimerId);
    event.extraTimerId = setTimeout(() => {
        extraCallback();
    }, event.dateTime - Date.now() - extraTime);

    event.extraTime = extraTime;
    event.extraCallback = functionParse(extraCallback);

    lsDelete(name);
    let events = lsLoad();
    events.push(event);
    lsSave(events);

    if (lsGet(name).extraTime !== extraTime || JSON.stringify(lsGet(name).extraCallback) !== JSON.stringify(functionParse(extraCallback))) return "Something went wrong.";
    else return lsGet(name);
}

/**
 * Добавление/замена, для повторяющегося события, дополнительной функции которая вызывается за заданное время до вызова основной функции
 * @param {string} name - Имя повторяющегося события которому необходимо добавить/заменить дополнительную функцию
 * @param {number} extraTime - Время до вызова основной функции за которое будет вызываться дополнительная функция extraCallback (в мс)
 * @param {function} extraCallback - Дополнительная функция которая будет вызываться за время extraTime до вызова основной функции
 * @returns {object} Повторяющееся событие с добавленной/заменённой в результате работы функции дополнительной функцией
 */
function addExtraRecurCallback(name, extraTime, extraCallback) {
    let event = lsGet(name);
    if (event === -1) return "Event with this name does not exist.";
    if (!event.hasOwnProperty("time") && !event.hasOwnProperty("days")) return "This event is not recurring, use addExtraCallback function.";

    if (extraTime === undefined) return "ExtraTime is not defined.";
    if (typeof(extraTime) !== "number" || extraTime < 0) return "ExtraTime is invalid.";
    if (extraCallback === undefined) return "ExtraCallback is not defined.";

    let arr = new Array();
    for (let day of event.days.sort()) {
        let date = new Date();
        date.setDate(date.getDate() - date.getDay() + day);
        date.setHours(event.time[0], event.time[1], event.time[2], 0);
        if (date.getTime() < Date.now()) date.setDate(date.getDate() + 7);
        arr.push(date.getTime());
    }
    arr.sort();

    let extraArr = new Array();
    for (let time of arr) {
        extraArr.push(time - extraTime);
    }
    if (event.extraTimerId !== null) clearTimeout(event.extraTimerId);
    event.extraTimerId = timeoutRec(extraArr, extraCallback, name, true);
    
    event.extraTime = extraTime;
    event.extraCallback = functionParse(extraCallback);

    lsDelete(name);
    let events = lsLoad();
    events.push(event);
    lsSave(events);

    if (lsGet(name).extraTime !== extraTime || JSON.stringify(lsGet(name).extraCallback) !== JSON.stringify(functionParse(extraCallback))) return "Something went wrong.";
    else return lsGet(name);
}

/**
 * Добавление/замена, глобально сразу для всех событий, дополнительной функции которая вызывается за заданное время до вызова основной функции
 * @param {number} extraTime - Время до вызова основной функции за которое будет вызываться дополнительная функция extraCallback (в мс)
 * @param {function} extraCallback - Дополнительная функция которая будет вызываться за время extraTime до вызова основной функции
 * @returns {string} Сообщение об успешном добавлении/замене дополнительной функции для всех событий
 */
function addEveryEventExtraCallback(extraTime, extraCallback) {
    let events = lsLoad();
    if (events === -1 || events.length === 0) return "There are no events.";
    let newEvents = new Array();

    if (extraTime === undefined) return "ExtraTime is not defined.";
    if (typeof(extraTime) !== "number" || extraTime < 0) return "ExtraTime is invalid.";
    if (extraCallback === undefined) return "ExtraCallback is not defined.";

    for (let event of events) {
        if (!event.hasOwnProperty("time") && !event.hasOwnProperty("days")) {
            if (event.extraTimerId !== null && Date.now() < event.dateTime - event.extraTime) clearTimeout(event.extraTimerId);
            event.extraTimerId = setTimeout(() => {
                extraCallback();
            }, event.dateTime - Date.now() - extraTime);

            event.extraTime = extraTime;
            event.extraCallback = functionParse(extraCallback);

            newEvents.push(event);
        }
        else if (event.hasOwnProperty("time") && event.hasOwnProperty("days")) {
            let arr = new Array();
            for (let day of event.days.sort()) {
                let date = new Date();
                date.setDate(date.getDate() - date.getDay() + day);
                date.setHours(event.time[0], event.time[1], event.time[2], 0);
                if (date.getTime() < Date.now()) date.setDate(date.getDate() + 7);
                arr.push(date.getTime());
            }
            arr.sort();

            let extraArr = new Array();
            for (let time of arr) {
                extraArr.push(time - extraTime);
            }
            if (event.extraTimerId !== null) clearTimeout(event.extraTimerId);
            event.extraTimerId = timeoutRec(extraArr, extraCallback, event.name, true);
            
            event.extraTime = extraTime;
            event.extraCallback = functionParse(extraCallback);

            newEvents.push(event);
        }
    }
    lsSave(newEvents);

    if (JSON.stringify(lsLoad()) !== JSON.stringify(newEvents)) return "Something went wrong.";
    else return "Extra callback was successfully added to every event.";
}

/**
 * Вспомогательная функция, которая преобразует полученную функцию в массив для его последующей записи в LocalStorage
 * @param {function} callback - Функция которую необходимо преобразовать в массив
 * @returns {array} Массив в который была преобразована полученная функция
 */
function functionParse(callback) {
    const callbackString = callback.toString();
    const name = callback.name;
    const body = callbackString.substring((callbackString.indexOf("{")) + 1, callbackString.lastIndexOf("}"));
    const params = callbackString.substring((callbackString.indexOf("(")) + 1, callbackString.indexOf(")"));
    const callbackArray = [name, body, params];
    return callbackArray;
}

/**
 * Вспомогательная функция, которая преобразует полученную строку с временем в массив для последующей с ним работы
 * @param {string} time - Строка с временем в формате "HH:MM:SS"
 * @returns {array} Массив в который была преобразована полученная строка
 */
function timeParse(time) {
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

/**
 * Вспомогательная функция, которая преобразует полученную строку с днями недели в массив для последующей с ним работы
 * @param {string} days - Строка с днями недели в формате "mon tue ... sun"
 * @returns {array} Массив в который была преобразована полученная строка
 */
function daysParse(days) {
    if (!/^(mon|tue|wed|thu|fri|sat|sun)(\s+(mon|tue|wed|thu|fri|sat|sun)){0,6}$/.test(days.trim().toLowerCase()) || hasDuplicates(days.trim().toLowerCase().split(/\s+/))) {
        return -1;
    }

    const arr = new Array();
    const arr2 = days.trim().toLowerCase().split(/\s+/);

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

/**
 * Вспомогательная функция, которая проверяет есть ли в полученном массиве дублирующиеся значения
 * @param {array} array - Полученный массив со значениями
 * @returns {boolean} Обозначение есть ли в полученном массиве дублирующиеся значения (если false - то нет, и наоборот)
 */
function hasDuplicates(array) {
    if (new Set(array).size !== array.length) {
        return true;
    }
    return false;
}

/**
 * Запись списка событий в LocalStorage
 * @param {array} events - 
 */
function lsSave(events) {
    localStorage.setItem("coe-events", JSON.stringify(events));
}

/**
 * Получение списка событий из LocalStorage'а
 * @returns {array} Список событий
 */
function lsLoad() {
    const events = localStorage.getItem("coe-events");
    if (events === null || events === "") return -1;
    return JSON.parse(events);
}

/**
 * Получение события по имени из списка событий в LocalStoage'е
 * @param {string} name - Имя необходимого события
 * @returns {object} - Событие с указанным именем
 */
function lsGet(name) {
    const events = lsLoad();
    if (events == -1) return -1;
    const event = events.find(event => event.name === name);
    if (event === undefined) return -1;
    return event;
}

/**
 * Удаление события по имени из списка событий в LocalStoage'е
 * @param {string} name - Имя удаляемого события
 */
function lsDelete(name) {
    let events = lsLoad();
    if (events == -1) return -1;
    if (events.find(event => event.name === name) === undefined) return -1;
    events = events.filter(event => event.name !== name);
    lsSave(events);
}

/**
 * dev: Очистка LocalStorage'а
 */
function clear() {
    localStorage.clear();
}

/**
 * dev: Тестовая функция передаваемая в качестве вызываемой функции в событиях, выводит текст "Test function" в консоль
 */
function testFunction() {
    console.log("Test function");
}

init();