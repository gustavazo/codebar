//Ultimos ingresos: Hay que ver que hacer cuando existe un registro con entrada en ultimos ingresos y se realiza la salida. Como es un mismo registro se pisa

import "./App.css";
import { useState, useEffect, useRef } from "react";
import UserService from "./services/UserService";
import useCodebarScanner from "./hooks/useCodebar";
import moment from "moment";
import logoPulso from "./img/logo1024.png";
import Loader from "react-loader-spinner";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import EntranceService from "./services/EntranceService";
import Modal, { closeStyle } from 'simple-react-modal'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GrNetwork } from 'react-icons/gr'
import { io } from "socket.io-client";
import LinkOffIcon from '@mui/icons-material/LinkOff';
import 'moment/locale/es'
import { Tooltip } from "@mui/material";
import { getCurrentBill, getLastBillNotDisabled, getUserCondition } from "./utils/bills";
import LastEntrancesTable from "./components/LastEntrancesTable";
import { createEntrance, getLastEntrances } from "./utils/entrances";
import UserCondition from "./components/UserCondition";
import StaffEntrance from "./components/StaffEntrance";

moment.locale('es')

const socket = io("http://localhost:3005");



function App() {

  console.log('Render')
  const [user, setUser] = useState(null);
  const [billsToShow, setBillsToShow] = useState([]);
  const [classes, setClasses] = useState([]);
  const [plan, setPlan] = useState(null);
  const [message, setMessage] = useState(null);
  const [loader, setLoader] = useState(false);
  const codebar = useCodebarScanner();
  const [isDue, setIsDue] = useState(false);
  const [myText, setMyText] = useState("");
  const [order, setOrder] = useState([])
  const [modalOpen, setModalOpen] = useState(false);
  const [entrance, setEntrance] = useState({})
  const [lastEntrances, setLastEntrances] = useState([])
  const [accessControlConnection, setAccessControlConnection] = useState(false);
  const [userCondition, setUserCondition] = useState({ active: false, defaulter: false, inactive: false, decisionBill: null });
  const myRef = useRef();
  const dniField = useRef();
  const finding = useRef();






  /**
   * 
   * @param {Number} userCode 
   * @param {boolean} byDNI 
   * @param {boolean} fromFingerprint 
   * @returns 
   */
  const findAndSetUser = async (userCode, byDNI = false, fromFingerprint = false) => {
    if (finding.current) return
    finding.current = true
    let graceTime = 0
    setLoader(true);
    console.log('FindUser')
    let user;
    if (byDNI) {
      user = await UserService.find({
        where: {
          dni: userCode,
        },
      });
    } else {
      userCode = fromFingerprint ? userCode : userCode.substring(1);
      user = await UserService.find({
        where: {
          codebarId: userCode,
        },
      });
    }
    if (user.data[0]) {
      const promises = []
      const bills = findUserBills(user.data[0].id);
      const classes = findUserClasses(user.data[0].id);
      const lastPlan = findUserLastPlan(user.data[0].id);
      const newEntrance = createEntrance(user.data[0]/*, user.data[0].type, user.data[0] */);
      Promise.all([bills, classes, lastPlan, newEntrance]).then((values) => {
        const bills_ = values[0];
        handleBillsToshow(bills_)
        setUserCondition(getUserCondition(bills_))
        setClasses(values[1]);
        setPlan(values[2]);
        setEntrance(values[3]);
        setUser(user.data[0]);
        setMessage(null);
        setLoader(false);
        clear(5000)

      })
    } else {
      setUser(null);
      setBillsToShow([]);
      setEntrance({});
      setClasses([]);
      setPlan(null);
      setMessage("Usuario no encontrado");
      setLoader(false);
      clear(1000);

    }
  };

  const clear = async (delay) => {
    setLoader(false);
    return setTimeout(function () {
      setUser(null);
      setEntrance({})
      setBillsToShow([]);
      setClasses([]);
      setPlan(null);
      setIsDue(false);
      setMessage(null);
      setUserCondition({})
      getAndSetLastEntrances();
      finding.current = false
      myRef.current.value = '';
      myRef.current.focus();
    }, delay)
  }

  const handleBillsToshow = (bills) => {
    if (bills.length) {
      const currentBill = getCurrentBill(bills);
      const lastBillNotDisabled = getLastBillNotDisabled(bills);
      const billToShow = currentBill ? [currentBill] : lastBillNotDisabled ? [lastBillNotDisabled] : []
      setBillsToShow(billToShow);
    }
  }

  const getAndSetLastEntrances = async () => {
    setLastEntrances(await getLastEntrances(4));

  }

  const findUserBills = async (userId) => {
    const bills = await UserService.getBills(userId);
    return bills.data
  };


  const findUserClasses = async (userId) => {
    let begining = moment('0:00am', 'h:mma').toISOString();
    let end = moment(begining).add(1, 'days').toISOString();
    const classes = await UserService.getClasses(userId, {
      where: {
        date: {
          between: [begining, end]
        }
      }
    });
    const filterClasses = classes.data.filter(
      (classe) => classe.date < end || classe.date > begining
    );
    return classes.data
  };

  const findUserLastPlan = async (userId) => {
    let lastPlan = await UserService.getPlan(userId);
    lastPlan = lastPlan.data[lastPlan.data.length - 1]
    console.log('lastPlan', lastPlan)
    return lastPlan
  };



  const handleFindUser = (e) => {
    const value = e.target.value
    const valueLength = value.length;
    console.log('find != 8', value, valueLength)
    if (valueLength === 8) {
      console.log('find!!', value, valueLength)
      findAndSetUser(value, true);
    }
  }
  useEffect(() => {
    console.log('condition', user?.lastName, userCondition)
  }, [userCondition])


  useEffect(() => {
    if (codebar) {
      console.log('findCodebar')
      findAndSetUser(codebar);
    }
  }, [codebar]);

  useEffect(() => {
    myRef.current.focus();
    getAndSetLastEntrances();

    socket.on("accessControl", async function (event) {
      console.log("EVENT", event.data);
      findAndSetUser(event.data, true);
    })

    socket.on("accessControlConnection", async function (event) {
      console.log("EVENT-connection", event);
      setAccessControlConnection(event)
      //findAndSetUser(event.data);
    })

  }, []);




  return (
    <div className="App" style={{ marginTop: '0' }}>
      <ToastContainer hideProgressBar position="top-center" autoClose={2000} style={{ zIndex: 9999999 }}></ToastContainer>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          background: "#441B3E",
        }}
      >
        <img
          src={logoPulso}
          className={'logoPulso'}
          style={{ width: 50, height: "auto", margin: 10 }}
        />
        <h1 style={{ margin: 0, marginTop: 15, color: "white" }}>
          CONTROL DE INGRESO
        </h1>
        <span>{accessControlConnection?.state
          ? ''
          :
          <Tooltip title={'Sin conexión con el controlador de acceso' + (accessControlConnection.message ? (': ' + accessControlConnection.message) : '')}>
            <LinkOffIcon style={{ color: '#F18B0C' }}></LinkOffIcon>
          </Tooltip>
        }
        </span>
      </div>
      <header className="App-header">
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <div style={{ marginRight: 20 }}>
            {user ? (
              <div
                style={{
                  display: "flex",
                  width: 600,
                  justifyContent: "space-evenly",
                }}
              >
                <h3
                  style={{
                    color: "orange",
                    letterSpacing: 3,
                    background: "#441B3E",
                    padding: 5,
                    borderTopLeftRadius: 10,
                    border: "3px solid black",
                    borderRight: 0,
                  }}
                >
                  {user.firstName.toUpperCase() +
                    " " +
                    user.lastName.toUpperCase()}
                </h3>
                <h3
                  style={{
                    letterSpacing: 3,
                    padding: 5,
                    borderTopRightRadius: 10,
                    border: "3px solid black",
                    background: "orange",
                  }}
                >
                  DNI {user.dni}
                </h3>
              </div>
            ) : (
              <div>
                <p>Por favor, deslice la tarjeta</p>
              </div>
            )}
            {user && plan && (
              <>
                <h4
                  style={{
                    color: "black",
                    letterSpacing: 3,
                    border: "3px solid black",
                    background: "white",
                    marginTop: -33,
                    borderBottomLeftRadius: 10,
                    borderBottomRightRadius: 10,
                    padding: 8,
                    borderTop: 0,
                    width: 578,
                  }}
                >
                  {plan.name}
                </h4>
              </>
            )}
          </div>
        </div>
        {
          !user && !message && <div>
            <p>Ingrese su DNI</p>
            <input style={{ height: 30, fontSize: 15 }} type="text" ref={myRef} onChange={handleFindUser}></input>
            {accessControlConnection?.state ? "" : <div style={{ marginTop: 15, color: '#F18B0C' }}>Lector no disponible. Por favor usar teclado</div>}
          </div>
        }
        {(user) ?
          <>
            {user?.type !== '1' ?
              <UserCondition userCondition={userCondition}></UserCondition>
              :
              <StaffEntrance entrance={entrance}></StaffEntrance>
            }
          </>
          :
          message ? <h2>{message}</h2>
            :
            <LastEntrancesTable containerStyle={{ background: '', position: 'absolute', bottom: 0, right: 0 }} lastEntrances={lastEntrances}></LastEntrancesTable>
        }
        {loader && (
          <Loader
            type="Oval"
            color="orange"
            height={200}
            width={200}
            style={{
              position: "absolute",
              margin: "auto",
              height: "auto",
              top: "40%",
            }}
          />
        )}
      </header>
    </div>
  );
}




export default App;
