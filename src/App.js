import "./App.css";
import { useState, useEffect, useRef } from "react";
import UserService from "./services/UserService";
import useCodebarScanner from "./hooks/useCodebar";
import moment from "moment";
import logoPulso from "./img/logo1024.png";
import Loader from "react-loader-spinner";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import EntranceService from "./services/EntranceService";

function App() {
  const [user, setUser] = useState(null);
  const [bills, setBills] = useState([]);
  const [classes, setClasses] = useState([]);
  const [plan, setPlan] = useState(null);
  const [message, setMessage] = useState(null);
  const [loader, setLoader] = useState(false);
  const codebar = useCodebarScanner();
  const [isDue, setIsDue] = useState(false);
  const [myText, setMyText] = useState("");
  const [order,setOrder] = useState([])
  const myRef = useRef();

  const findUser2 = async (userCode) => {
    setLoader(true);
    const user = await UserService.find({
      where: {
        dni: userCode,
      },
    });
    console.log(user,'que llega', user.data[0].type)
    if (user.data[0]) {
      setUser(user.data[0]);
      findUserBills(user.data[0].id);
      findUserClasses(user.data[0].id);
      findUserLastPlan(user.data[0].id);
      createEntrance(user.data[0].id /*, user.data[0].type, user.data[0] */);
      setMessage(null);
    } else {
      setUser(null);
      setBills([]);
      setClasses([]);
      setPlan(null);
      setMessage("Usuario no encontrado");
    }
    setLoader(false);
    setTimeout(function() {
      setUser(null);
      setBills([]);
      setClasses([]);
      setPlan(null);
      myRef.current.focus();
    }, 5000)
  };

  const findUser = async (userCode) => {
    userCode = userCode.substring(1);

    setLoader(true);
    const user = await UserService.find({
      where: {
        codebarId: userCode,
      },
    });

    if (user.data[0]) {
      setUser(user.data[0]);
      findUserBills(user.data[0].id);
      findUserClasses(user.data[0].id);
      findUserLastPlan(user.data[0].id);
      createEntrance(user.data[0].id /*, user.data[0].type */ );
      setMessage(null);
    } else {
      setUser(null);
      setBills([]);
      setClasses([]);
      setPlan(null);
      setMessage("Usuario no encontrado");
    }
    setLoader(false);
    setTimeout(function() {
      setUser(null);
      setBills([]);
      setClasses([]);
      setPlan(null);
      myRef.current.focus();
    }, 5000)
  };

  const findUserBills = async (userId) => {
    const bills = await UserService.getBills(userId, {
      order: ["created DESC"],
      where: { disabled: false },
    });
    const today = moment(new Date()).endOf("day").valueOf();
    const myBills = bills.data.filter((b) => {
      console.log(moment(b.created).valueOf() < today);
      return moment(b.created).valueOf() < today;
    });
    for (var i = 0; i < myBills; i++) {
      if (myBills[i].isDue === true) {
        setIsDue(true);
        break;
      }
    }
    setBills(myBills);
  };

  const findUserClasses = async (userId) => {
    let begining = moment('0:00am', 'h:mma').toISOString();
    let end = moment(begining).add(1, 'days').toISOString();
    const classes = await UserService.getClasses(userId, {
      where: {
        date: {
          between:[begining, end]
        }
      }
    });
    const filterClasses = classes.data.filter(
      (classe) => classe.date < end || classe.date > begining
    );
    setClasses(classes.data);
    console.log(filterClasses)
  };

  const findUserLastPlan = async (userId) => {
    const lastPlan = await UserService.getPlan(userId);
    setPlan(lastPlan.data[lastPlan.data.length - 1]);
  };

  const createEntrance = (userId /*, type, name*/) => {
    EntranceService.create({
      userId,
      start: moment(new Date()).subtract(3, "hours").toISOString(),
      // userType: type === '' ? "0" : type,
      // fullName: name.firstName + ' ' + name.lastName
    });
  };

  const handleSabe = (e) => {
    if (e.target.value.length === 8) {
      findUser2(e.target.value)
    }
  }

  useEffect(() => {
    if (codebar) {
      findUser(codebar);
    }
  }, [codebar]);

  useEffect(() => {
    myRef.current.focus();
  }, []);

  return (
    <div className="App">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          background: "#441B3E",
        }}
      >
        <img
          src={logoPulso}
          style={{ width: 50, height: "auto", margin: 10 }}
        />
        <h1 style={{ margin: 0, marginTop: 15, color: "white" }}>
          CONTROL DE INGRESO
        </h1>
        <span />
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
            {plan && (
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
                  {plan.name.toUpperCase()}
                </h4>
              </>
            )}
          </div>
          <div style={{ marginRight: 20 }}> {isDue ? "????" : "????"}</div>
        </div>
        {user && (
          <div style={{ marginRight: 20 }}>
            {" "}
            {!user?.paseSanitario
              ? "???? Falta pase sanitario"
              : "???? Tiene pase sanitario"}
          </div>
        )}
        {
          !user && <div>
            <p>O ingrese su DNI</p>
            <input style={{height: 30, fontSize: 15}} type="text" ref={myRef} onChange={handleSabe}></input>
          </div>
        }
        {bills.length ? (
          <>
            <h4
              style={{
                color: "orange",
                textDecoration: "underline",
                border: "5px solid #441B3E",
                borderBottom: 0,
                marginBottom: 0,
                padding: 5,
                background: "#441B3E",
                borderRadius: 5,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
            >
              ??ltimas facturas
            </h4>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                width: "100%",
                justifyContent: "space-evenly",
                border: "5px solid #441B3E",
              }}
            >
              {bills.map((b) => (
                <div style={{ color: b.isDue ? "red" : "green" }}>
                  <h4>{b.name}</h4>
                  <h5>
                    Emitida:{" "}
                    {moment(b.created.split("T")[0]).format("DD-MM-YYYY")}
                  </h5>
                  <h5>
                    {b.isDue ? "Venci??:" : "Vence:"}{" "}
                    {moment(b.dueOn.split("T")[0]).format("DD-MM-YYYY")}
                  </h5>
                  <h6>{b.isDue ? "Adeuda" : "Abonada"}</h6>
                </div>
              ))}
            </div>
          </>
        ) : null}
        {classes.length ? (
          <>
            <h4
              style={{
                color: "orange",
                textDecoration: "underline",
                border: "5px solid #441B3E",
                borderBottom: 0,
                marginBottom: 0,
                padding: 5,
                background: "#441B3E",
                borderRadius: 5,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
            >
              Pr??ximas clases
            </h4>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                width: "100%",
                justifyContent: "space-evenly",
                border: "5px solid #441B3E",
              }}
            >
              {classes.map((c) => (
                
                <div>
                    <>
                      <h4>{c.name}</h4>
                      <h5>
                        {moment(c.dayString.split("T")[0]).format(
                          "DD-MM-YYYY"
                        ) +
                          " " +
                          c.hourString +
                          " hs"}
                      </h5>
                    </>
                </div>
              ))}
            </div>
          </>
        ) : null}
        {message && <h2>Usuario no encontrado</h2>}
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
