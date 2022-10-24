import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import moment from 'moment';
export default function StaffEntrance({ entrance }) {
    return (
        <div>
            <div >
                <div style={{ paddingTop: 50, fontWeight: "bold", color: "CaptionText" }}>PERSONAL REGISTRADO</div>
                <div style={{ margin: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {
                        entrance.end ?
                            <>
                                <LogoutIcon style={{ fontSize: 30, color: 'red', alignmentBaseline: 'central' }} />
                                <span style={{ marginLeft: 10 }}>Salida</span>
                            </>
                            :
                            <>
                                <LoginIcon style={{ fontSize: 30, color: 'green' }} />
                                <span style={{ marginLeft: 10 }}>Entrada</span></>
                    }
                </div>
            </div>
            <div>
                {moment(entrance.start).add(3, 'hours').format("dddd D [de] MMMM, HH:mm [hs]") + (entrance.end ? (" - " + moment(entrance.end).add(3, 'hours').format("dddd D [de] MMMM, HH:mm [hs]")) : '')}
            </div>
        </div>
    )
}