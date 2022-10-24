
import moment from "moment";
import BillService from "../services/BillService";
import PlanService from "../services/PlanService";
import UserService from "../services/UserService";

export const graceDays = 15;
/** 
  * Devuelve la cuota vigente añadiendo una propiedad index que indica la posición dentro del array pasado como argumento. En caso que no exista cuota vigente devuelve null. El argumento Bills puede ser nulo o undefined
*/
export const getCurrentBill = (bills) => {
    if (!bills?.length) return null //Si el array esta vacio no hay currentBill
    const lastBill = bills[bills.length - 1];
    const { isExpired } = checkBill(lastBill);
    if (isExpired) return null //Si la primera ya expiro no hay currentBill
    for (let i = bills.length - 1; i >= 0; i--) {
        const bill = bills[i];
        const { isCurrent } = checkBill(bill);
        if (isCurrent && !bill.disabled) return { ...bill, index: i };
    }
    return null //Si hay un caso no contemplado devuelve null
}


/**
   * Verifica el estado de la cuota pasada como argumento. Las clasifica en un objeto con las siguiente propiedades: 
   * @isCurrent  (Cuota corriente): El dia de hoy se encuentra entre la fecha de creacion y expiracion.
   * @isExpired (Couta no vigente): El dia de hoy es posterior a la fecha de expiracion(dueOn).
   * @isLater (Cuota adelantada): La fecha de creacion es posterior a la fecha de hoy. Generalmente son cuotas generadas automaticamente   
   */
export const checkBill = (bill) => {
    const today = moment();
    let condition = {
        isCurrent: false,
        isLater: false,
        isExpired: false
    };
    //isCurrent
    if (today.isBetween(moment(bill.created), moment(bill.dueOn))) {//La fecha de hoy está entre fecha de creacion y fecha de expiracion
        condition.isCurrent = true;
    };
    //isLater
    if (moment(bill.created).diff(moment(today), 'days') > 0) {//La fecha de creacion es posterior a la fecha de hoy
        condition.isLater = true;
    };
    //isExpired
    if (moment(bill.dueOn).diff(today, "days") < 0) {//La fecha de expiracion es anterior al dia de hoy
        condition.isExpired = true
    };
    return condition
};


/** 
  * Devuelve la cuota o las coutas vigentes añadiendo una propiedad index que indica la posición dentro del array pasado como argumento. En caso que no exista cuota vigente devuelve array vacío. El argumento Bills puede ser nulo o undefined
  * Se implentó para traer las currentBills duplicadas por error de generación de facturas
  * */
export const getAllCurrentsBills = (bills) => {
    let currentsBills = [];
    if (!bills?.length) return [] //Si el array esta vacio no hay currentBill
    const lastBill = bills[bills.length - 1];
    const { isExpired } = checkBill(lastBill);
    if (isExpired) return [] //Si la primera ya expiro no hay currentBill
    for (let i = bills.length - 1; i >= 0; i--) {
        const bill = bills[i];
        const { isCurrent } = checkBill(bill);
        if (isCurrent && !bill.disabled) currentsBills.push({ ...bill, index: i });
    }
    return currentsBills //Si hay un caso no contemplado devuelve null
}


/**
  * Devuelve la condicion del usuario a partir de las bills pasadas como argumento. Devuelve un objeto con las siguientes propiedades: 
  * @active Activo
  * @defaulter Moroso
  * @inactive Inactivo 
  * */
export const getUserConditionDeprecated = (userBills) => {
    //tres condiciones ACTIVO(active), MOROSO(defaulter), INACTIVO(inactive)
    let condition = { active: false, defaulter: false, inactive: false }
    userBills = userBills ? userBills.filter(b => !b.disabled) : null;
    const currentBill = getCurrentBill(userBills);
    if (!currentBill) {
        condition.inactive = true;
        return condition;
    }
    if (!currentBill.isDue) {
        condition.active = true;
        //if (currentBill.isInstallment) counters_.activesWithInstallments++;
        return condition;
    }
    if (currentBill.isDue) {
        const today = moment();
        const prevBillIndex = currentBill.index - 1;
        const prevBill = (prevBillIndex >= 0) ? userBills[prevBillIndex] : null;
        //Si esta dentro de los 15 días es considerado moroso. Pero debe verificarse que la anterior este paga. 
        //Si no lo esta quiere decir que esta acumulando facturas impagas.
        //Otra posibilidad es que no tenga facturas previas en ese caso es considerado moroso.
        const defaulterCondition = moment(today).diff(currentBill.created, 'days') <= 15 && (!prevBill || !prevBill?.isDue); //menor a 15 dias && (no tiene facturas previas || la anterior esta paga)
        if (defaulterCondition) {
            condition.defaulter = true;
        } else {//Si no reune las condiciones de moroso se considera inactivo
            condition.inactive = true;
        }
        return condition;
    }

    // return condition
}


/**
  * Devuelve la condicion del usuario a partir de las bills pasadas como argumento. Devuelve un objeto con las siguientes propiedades: 
  * @active Activo
  * @defaulter Moroso
  * @inactive Inactivo 
  * @decisionBill Factura que obtuvo para hacer la validación
  * */
export const getUserCondition = (userBills) => {
    //tres condiciones ACTIVO(active), MOROSO(defaulter), INACTIVO(inactive)
    let condition = { active: false, defaulter: false, inactive: false, decisionBill: null }
    const today = moment();
    userBills = userBills ? userBills.filter(b => !b.disabled) : null;
    const currentBill = getCurrentBill(userBills);

    if (!currentBill || currentBill.isDue) {
        //Las facturas al vencer tienen un tiempo de gracia en el cual la persona 
        //puede seguir ingresando al gimnasio en condición de deudor
        let lastBill = null;
        //Si tiene current y no está paga debe buscarse la anterior para trabajar con ella. 
        if (currentBill) {
            lastBill = getLastBillNotDisabled(userBills, currentBill.index - 1);
        } else {
            //si no tiene current se busca la ultima factura no deshabilitada
            lastBill = getLastBillNotDisabled(userBills);
        }
        if (!lastBill || lastBill.isDue) {
            condition.inactive = true;
            condition.decisionBill = lastBill;
            return condition;
        } else {
            const defaulterCondition = moment(today).diff(lastBill.dueOn, 'days') <= graceDays; //Si la ultima factura vencio hace menos de 15 dias 
            if (defaulterCondition) {
                condition.defaulter = true;
            } else {//Si no reune las condiciones de moroso se considera inactivo
                condition.inactive = true;
            }
            condition.decisionBill = lastBill;
            return condition;
        }
    }
    if (!currentBill.isDue) {
        condition.active = true;
        condition.decisionBill = currentBill;
        //if (currentBill.isInstallment) counters_.activesWithInstallments++;
        return condition;
    }

    console.log('getUserCondition: No pudo determinarse la condición del usuario')
    return condition
}




/**Devuelve el monto a colocar en la factura. Debe pasarse el plan de usuario y el plan real.
 * @param plan plan real
 * @param userPlan plan de usuario
 */
const getBillAmount = (plan, userPlan) => {
    const durationName = {
        1: 'priceOneMonth',
        7: 'priceOneWeek',
        3: 'priceThreeMonths',
        6: 'priceSixMonths',
        12: 'priceTwelveMonths',
        14: 'priceTwoWeeks',
    };
    const key = durationName[userPlan.duration]
    let finalPrice = plan[key];
    console.log('final', finalPrice)
    finalPrice = finalPrice - (finalPrice * Number(userPlan.discount)) / 100 + (finalPrice * Number(userPlan.recharge)) / 100
    finalPrice = (userPlan.installments > 1) ? finalPrice / Number(userPlan.installments) : finalPrice
    console.log('final', finalPrice)
    return finalPrice;
};
// /**
//  * Devuelve la ultima factura no deshabilitada del array pasado como argumento. Caso contrario devuelve null
// */
// export const getLastBillNotDisabled = (bills) => {
//     const userBills = bills ? bills.filter(b => !b.disabled) : null;
//     const lastBill = userBills ? userBills[userBills.length - 1] : null;
//     return lastBill
// }
/**
 * Devuelve la ultima factura no deshabilitada a partir del índice pasado como argumento. Busca desde el elemnto índice (inluyendolo) hacia atrás
 * @param {Array<object>} bills Array de facturas
 * @param {number} startIndex Indice desde donde comienza la busqueda de la ultima factura no deshabilitada(Busca desde el elemento indice inclusive hacia atras)
 * @returns {object|null} bill | null
 */
export const getLastBillNotDisabled = (bills, startIndex = null) => {
    if (bills?.length) {
        if (startIndex === null) startIndex = bills.length - 1
        if (startIndex >= bills.length || startIndex < 0) return null
        for (let i = startIndex; i >= 0; i--) {
            const bill = bills[i];
            if (!bill.disabled) return bill
        }
    }
    return null
}


/**
* Genera una factura en base al userPlan pasado como argumento. Actualiza el precio plan real. Si createDate no se expecifica se adopta la fecha de hoy
* @param userPlan plan de usuario de donde toma parametros
* @param createDate Fecha de creacion de la factura. En realidad es el comienzo de la vigencia (opcional)
* @param {Number} monthDuration Duración de la factura creada. Con este dato calcula el dueOn. Si no se pasa, la duración la saca del plan.
* @param {Number} currentIsInstallment El argumento debe pasar en caso que se esté generando una cuota. Indica el numero de cuota que se genera. 
* @return devuelve la factura generada en caso de exito
*/
const generateBill = async (userPlan, createDate = null, monthDuration = null, currentInstallment = null) => {
    const resp = await PlanService.findById(userPlan.planId);
    const plan = resp.data;
    console.log('generateBill', 'userPlan', userPlan, 'plan', plan);
    const created = createDate ? moment(createDate).startOf('day').toISOString() : moment().startOf("day").toISOString();
    const duration = monthDuration ? monthDuration : userPlan.duration;
    const durationType = !monthDuration ? ((duration === 7 || duration === 14) ? "days" : "months") : "months";
    let bill = {
        userPlanId: userPlan.id,
        date: moment().toISOString(),
        created: created,
        dueOn: moment(created).startOf("day").add(duration, durationType).toISOString(),
        userId: userPlan.userId,
        //Se actualiza el precio
        isInstallment: (userPlan.installments > 1),
        installments: userPlan.installments,
        amount: Number(getBillAmount(plan, userPlan)),
        isFirst: false,
    }
    const installmentProperties = {
        totalInstallments: userPlan.installments,
        currentInstallment: currentInstallment,
    }
    if (bill.isInstallment) bill = { ...bill, ...installmentProperties }
    const createdBillResp = await BillService.create(bill)
    return createdBillResp.data;

}

/**
 * Genera cuotas a partir del plan de usuario pasado como argumento. Puede indicarse el comienzo de la primer cuota. Por defecto toma el día de hoy
 * @param {object} userPlan Plan de usuario donde saca los parametros. Si el plan de usuario no tiene cuotas, arrojará error
 * @param {Date} startDate Comienzo del plan. Es la fecha create de la primer cuota. Si no se pasa el argumento tomará la fecha actual
 * @returns {Promise<[object]>} newBills[] Array de las facturas generadas. El item 0 corresponde a la cuota 1
 */
const generateInstallments = async (userPlan, startDate = null) => {
    let newBills = []
    const today = moment().startOf("day").toISOString();
    const startDate_ = startDate ? startDate : today;
    if (!(userPlan.installments > 1)) throw new Error('El plan no tiene cuotas asignadas');
    let installmentIndex = 1;
    for (let i = 0; userPlan.installments > i; i++) {
        let createDate = moment(startDate_).add(i, 'month').toISOString()
        //cuota final
        if (installmentIndex === userPlan.installments) {
            const remainingMonths = userPlan.duration - userPlan.installments + 1;
            const newBill = await generateBill(userPlan, createDate, remainingMonths, installmentIndex);
            newBills.push(newBill);
            //resto de la cuotas
        } else {
            const newBill = await generateBill(userPlan, createDate, 1, installmentIndex);
            newBills.push(newBill);
        }
        installmentIndex++
    }
    return newBills
}


/**Condiciones para la renovación de facturas. Recive como argumento las facturas de usuario con las que evalua la condición.
 *@param {object} lastBill Última factura de usuario.
*/
export const getConditionToRenovateBill = (bills) => {
    console.log('bills', bills)
    let messages = []
    let condition = false
    try {
        if (!bills?.length) throw new Error('No se encontró factura previa')
        const lastBill = getLastBillNotDisabled(bills)
        if (!lastBill) throw new Error('No se encontró factura previa válida')
        console.log('bills', lastBill)

        const graceDays = 15;
        const daysBetweenTodayAndLastDueOnCondition = moment().startOf('day').diff(moment(lastBill.dueOn).startOf('day'), "days") <= graceDays;
        if (!daysBetweenTodayAndLastDueOnCondition) messages.push('El vencimiento del último abono debe ser inferior a' + ' ' + graceDays + ' ');

        const lastBillPayCondition = !lastBill.isDue;
        if (!lastBillPayCondition) messages.push('El último abono debe estar pago')
        condition = daysBetweenTodayAndLastDueOnCondition && lastBillPayCondition;
    } catch (err) {
        messages.push(err.toString())
        console.error(err)
        console.log('ERROR')
    } finally {
        const message = messages.length ? messages.join(', ') : null
        return { condition, message };
    }
}

/**
 * Renueva una factura en base al ultimo plan de usuario. Renovación implica que el vencimiento de la factura previa será la fecha de creación de la nueva factura. En caso que el plan tenga cuotas generará cuotas
 * @param {string} userId Id de usuario de donde se obtiene su último plan.
 * @returns {Promise<[object]>} {newBills[], errorMessage} newBills[]: Array de las facturas generadas. El item 0 corresponde a la cuota 1; errorMessage String: Mensaje de error en caso que exista 
 */
export const renovateBill = async (userId) => {
    let newBills = [];
    let errorMessage = null
    try {
        const lastUserPlan = await UserService.getLastUserPlan(userId);
        if (!lastUserPlan) throw new Error('El usuario no tiene plan asignado');
        let resp = await UserService.getBills(userId);
        const bills = resp.data;
        console.log('bills', bills)
        const conditionToRenovate = getConditionToRenovateBill(bills);
        if (!conditionToRenovate.condition) throw new Error(conditionToRenovate.message);
        const lastBill = getLastBillNotDisabled(bills)
        if (lastUserPlan.installments > 1) {
            //generar cuotas
            const newBills_ = await generateInstallments(lastUserPlan, lastBill.dueOn)
            newBills = newBills_;
        } else {
            //generar factura única
            const newBill = await generateBill(lastUserPlan, lastBill.dueOn)
            newBills.push(newBill);
        }
    } catch (err) {
        console.error(err)
        errorMessage = err.toString()
    } finally {
        return { newBills, errorMessage }
    }
}


/**
 * Genera una nueva factura o cuotas de acuerdo al ultimo plan de usuario.
 * @param {string} userId Id de usuario de donde se obtiene su último plan.
 */
export const newBillFromUserPlan = async (userId) => {
    let newBills = []
    let errorMessage = null
    try {
        const lastUserPlan = await UserService.getLastUserPlan(userId);
        if (!lastUserPlan) throw new Error('El usuario no tiene plan asignado');
        if (lastUserPlan.installments > 1) {
            //generar cuotas
            const newBills_ = await generateInstallments(lastUserPlan)
            newBills = newBills_;
        } else {
            //generar factura única
            const newBill = await generateBill(lastUserPlan)
            newBills.push(newBill);
        }
    } catch (err) {
        console.error(err)
        errorMessage = err.toString()
    } finally {
        return { newBills, errorMessage }
    }
}


// export const renovateBillWithInstallments = async (userId) => {
//     let newBills = []
//     let errorMessage = null
//     try {
//         let resp = await UserService.getPlan(userId);
//         const userPlans = resp.data;
//         const lastUserPlan = userPlans[userPlans.length - 1];
//         if (!lastUserPlan) throw new Error('El usuario no tiene plan asignado')
//         const amount = Number(lastUserPlan.data.finalPrice) / Number(lastUserPlan.data.installments)


//         if (hasBills) {
//             await BillService.updateFields(userPlanBill.id, {
//                 userPlanId: lastUserPlan.data.id,
//                 installments: lastUserPlan.data.installments,
//                 currentInstallment: 1,
//                 amount,
//                 isInstallment: true,
//                 dueOn: moment(userPlanBill.created).add(1, 'month'),
//                 totalInstallments: lastUserPlan.data.installments
//             });
//             let installmentIndex = 2;

//             for (let i = 0; lastUserPlan.data.installments - 1 > i; i++) {
//                 let billStartDate = moment(userPlanBill.dueOn).add(i, 'month').toISOString()
//                 let billEndDate = moment(userPlanBill.dueOn).add(i + 1, 'month').toISOString()
//                 if (installmentIndex === lastUserPlan.data.installments) {
//                     billEndDate = moment(billStartDate).add(lastUserPlan.data.duration - (installmentIndex - 1), 'month')
//                     await BillService.create({
//                         userId: id,
//                         userPlanId: lastUserPlan.data.id,
//                         currentInstallment: installmentIndex,
//                         amount,
//                         isInstallment: true,
//                         dueOn: billEndDate,
//                         created: billStartDate,
//                         totalInstallments: lastUserPlan.data.installments
//                     });
//                 } else {
//                     await BillService.create({
//                         userId: id,
//                         userPlanId: lastUserPlan.data.id,
//                         currentInstallment: installmentIndex,
//                         amount,
//                         isInstallment: true,
//                         dueOn: billEndDate,
//                         created: billStartDate,
//                         totalInstallments: lastUserPlan.data.installments
//                     });
//                 }
//                 installmentIndex++
//             }

//         }
//     } catch (err) {
//         console.error(err)
//         errorMessage = err.toString()
//     } finally {
//         return { newBills, errorMessage }
//     }
// }
