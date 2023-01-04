import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import DangerousOutlinedIcon from '@mui/icons-material/DangerousOutlined';
import PanToolOutlinedIcon from '@mui/icons-material/PanToolOutlined';
import moment from 'moment';
import { graceDays } from '../utils/bills';

function UserCondition({ userCondition, }) {
    const styles = {
        conditionStyle(userCondition) {
            if (userCondition.active) return { color: 'green' }
            if (userCondition.defaulter) return { color: '#FFA500' }
            if (userCondition.inactivez) return { color: 'red' }
        }
    }
    function getMessage(userCondition) {
        //Si es activo:     Mostrar el proximo vencimiento de la factura
        //Si es moroso:     Mostrar la factura con la que valida y decirle que tiene tiempo de pagar hasta el tiempo de gracia
        //Si es inactivo:   Si la factura con la que valida está paga indicarle que venció hace más del tiempo de gracia. 
        //                  Si la factura no está paga o no existe(Quiere decir que no encontró factura previa válida con cual verificar) ver que hacer.
        const decisionBillDueOn = moment(userCondition.decisionBill?.dueOn.split("T")[0]).format("DD - MM - YYYY")
        const daysBetweenTodayAndDecisionBillDueOn = moment().diff(moment(userCondition.decisionBill?.dueOn), 'days');
        if (userCondition.active) {
            return <h5>{("Próximo vencimiento: " + decisionBillDueOn)}</h5>
        }
        if (userCondition.defaulter) {
            const daysToPay = graceDays - daysBetweenTodayAndDecisionBillDueOn
            return (
                <>
                    <h5>{"Venció: " + decisionBillDueOn}</h5>
                    <div style={{ color: '' }}>{'Tiempo para pagar: ' + daysToPay + ' días'}</div>
                </>
            )
        }
        if (userCondition.inactive) {
            if (!decisionBill || decisionBill.isDue) {
                return <h5>{'No se registró factura paga'}</h5>
            } else {
                return (
                    <>
                        <h5>{"Venció: " + decisionBillDueOn}</h5>
                        <h6>{'Hace: ' + daysBetweenTodayAndDecisionBillDueOn + ' días'}</h6>
                    </>
                )
            }
        }
        console.log('usercondition', userCondition)
    }

    const { active, defaulter, inactive, decisionBill } = userCondition
    return (
        <>
            {
                active ? <CheckCircleIcon style={{ ...styles.conditionStyle(userCondition), fontSize: 200 }}></CheckCircleIcon> :
                    defaulter ? <WarningIcon style={{ fontSize: 200, ...styles.conditionStyle(userCondition) }}></WarningIcon> :
                        inactive ? <DangerousOutlinedIcon style={{ fontSize: 200, ...styles.conditionStyle(userCondition) }} ></DangerousOutlinedIcon> : null
                // userCondition.inactive ? <PanToolOutlinedIcon style={{ fontSize: 200, ...styles.conditionStyle(userCondition) }} ></PanToolOutlinedIcon> : null
            }

            <>
                <h4
                    style={{
                        color: "orange",
                        textDecoration: "underline",

                        borderBottom: 0,
                        marginBottom: 0,
                        padding: 5,
                        background: "",
                        borderRadius: 5,
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                    }}
                >
                </h4>

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        width: "50%",
                        justifyContent: "space-evenly",
                        border: "5px solid #441B3E",
                        borderRadius: 20,
                        fontSize: 40
                    }}
                >
                    <div style={{ ...styles.conditionStyle(userCondition) }}>
                        <h5>
                            {getMessage(userCondition)}

                        </h5>
                    </div>
                </div>
            </>
        </>

    )

}

export default UserCondition