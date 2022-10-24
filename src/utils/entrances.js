import EntranceService from "../services/EntranceService";
import moment from "moment";

/**
 * Devuelve las ultimas entradas registradas. Contempla el caso de registros con entrada y salida, en ese caso toma la salida como fecha de ordenamiento en el array
 * @param {number} limit Cantidad maxima que devuelve
 * @returns 
 */
export const getLastEntrances = async (limit) => {
    const lastEntrancesStart = (await EntranceService.find({ order: 'start DESC', limit: limit })).data
    const lastEntrancesEnd = (await EntranceService.find({ order: 'end DESC', limit: limit })).data
    let allEntrances = [...lastEntrancesStart, ...lastEntrancesEnd];
    let lastEntrances = [];
    allEntrances.forEach((e) => {
        const already = lastEntrances.find((element) => element.id === e.id)
        if (!already) {
            lastEntrances.push(e);
        }
    })
    lastEntrances.sort((a, b) => {
        return new Date(b.end ? b.end : b.start) - new Date(a.end ? a.end : a.start);
    })
    for (let i = lastEntrances.length; i > limit; i--) {
        const element = lastEntrances.pop();
    }
    return lastEntrances
}

/**
 * 
 * @param {object} user 
 * @returns 
 */
export const createEntrance = async (user) => {
    console.log('user', user);
    //user.type
    const resp = await EntranceService.find({ where: { userId: user.id } })
    const lastEntrance = resp.data[resp.data.length - 1];
    let newEntrance =null;
    const startDay = moment(lastEntrance?.start).add(3, 'hours').startOf('day');
    const today = moment().startOf('day');
    const daysBetweenStartAndToday = today.diff(startDay, 'days');
    console.log('startDay', today, startDay, daysBetweenStartAndToday)

    const isStaff = user.type === '1';
    const expiredTime = lastEntrance ? (daysBetweenStartAndToday >= 1) : false
    const conditionToAddEndToRegister = isStaff && lastEntrance && !lastEntrance.end && !expiredTime
    //Si es Staff
    if (conditionToAddEndToRegister) {
        //Si es personal, tiene ingresos registrados y el ultimo registro no tiene salida entonces agrega la salida
        const newField = { end: moment(new Date()).subtract(3, "hours").toISOString(), }
        await EntranceService.patch(lastEntrance.id, newField)
        newEntrance = { ...lastEntrance, ...newField }
    } else {//si no crea uno nuevo con start(entrada)
        const date = new Date(2022, 9, 20, 24)
        newEntrance = {
            userId: user.id,
            start: moment().subtract(3, "hours").toISOString(),
            userType: !user.type ? "0" : user.type,
            fullName: user.firstName + ' ' + user.lastName
        }
        await EntranceService.create(newEntrance);
    }
    return newEntrance
}

