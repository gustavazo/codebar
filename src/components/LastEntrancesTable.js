import moment from "moment"
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import React from "react"

/**
 * 
 * @param {object} param0
 * @param {Array<object>}param0.lastEntrances
 * @param {React.CSSProperties} param0.containerStyle 
 * @returns 
 */
function LastEntrancesTable({ lastEntrances, containerStyle = {} }) {
    if (!lastEntrances?.length) return <></>
    const styles = {
        cell(index) {
            const commonStyle = { textAlign: 'center', fontSize: 15 }
            if (index) {
                return { ...commonStyle, color: 'gray', fontSize: 12 }
            }
            return { ...commonStyle, backgroundColor: '' }
        }
    }

    return (
        <div style={{ ...containerStyle, display: 'flex' }}>
            <div>
                <div style={{ fontSize: 15, margin: '80px 0 0 0', textAlign: 'center' }}>Últimos ingresos</div>
                <TableContainer>
                    <Table>
                        <TableBody>
                            {lastEntrances?.map((e, index) => {
                                const fulldate = e.end ? e.end : e.start;
                                const date = moment(fulldate).format('DD/MM/YYYY');
                                const time = moment(fulldate).add(3, 'hours').format('HH:mm');
                                const registerType = e.end ? 'Salida' : 'Entrada';
                                return (
                                    <TableRow>
                                        <TableCell style={styles.cell(index)}>{e.fullName}</TableCell>
                                        <TableCell style={styles.cell(index)}>{e.type}</TableCell>
                                        <TableCell style={styles.cell(index)}>{registerType}</TableCell>
                                        <TableCell style={styles.cell(index)}>{time}</TableCell>
                                        <TableCell style={styles.cell(index)}>{date}</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div >
    )


}
export default LastEntrancesTable