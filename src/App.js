import './App.css';
import { useState, useEffect } from 'react';
import UserService from './services/UserService';
import useCodebarScanner from './hooks/useCodebar';
import moment from 'moment';
import logoPulso from './img/logo1024.png';
import Loader from "react-loader-spinner";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import EntranceService from './services/EntranceService';

function App() {
	const [user, setUser] = useState(null);
	const [bills, setBills] = useState([]);
	const [classes, setClasses] = useState([]);
	const [plan, setPlan] = useState(null);
	const [message, setMessage] = useState(null);
	const [loader, setLoader] = useState(false);
	const codebar = useCodebarScanner();
	const [isDue, setIsDue] = useState(false)

	const findUser = async (userCode) => {
		userCode = userCode.substring(1);

		setLoader(true);
		const user = await UserService.find({
			where: {
				codebarId: userCode
			}
		});

		if (user.data[0]) {
			setUser(user.data[0]);
			findUserBills(user.data[0].id);
			findUserClasses(user.data[0].id);
			findUserLastPlan(user.data[0].id);
			createEntrance(user.data[0].id);
			setMessage(null);
		} else {
			setUser(null);
			setBills([]);
			setClasses([]);
			setPlan(null);
			setMessage("Usuario no encontrado");
		}
		setLoader(false);
	};

	const findUserBills = async (userId) => {
		const bills = await UserService.getBills(userId, { limit: 4, order: ['date ASC'] });
		for(var i=0; i < bills.data.length; i++){
			if(bills.data[i].isDue === true){
				setIsDue(true)
				break
			}
		}
		setBills(bills.data);
	};

	const findUserClasses = async (userId) => {
		const classes = await UserService.getClasses(userId);
		const filterClasses = classes.data.filter(classe => classe.date > new Date().toISOString());
		setClasses(filterClasses);
	};

	const findUserLastPlan = async (userId) => {
		const lastPlan = await UserService.getPlan(userId);
		setPlan(lastPlan.data[lastPlan.data.length - 1]);
	};

	const createEntrance = (userId) => {
		EntranceService.create({ userId, start: moment(new Date()).subtract(3, "hours").toISOString() });
	};

	useEffect(() => {
		if (codebar) {
			findUser(codebar);
		};
	}, [codebar]);

	return (
		<div className="App">
			<div style={{ display: 'flex', justifyContent: 'space-between', background: '#441B3E' }}>
				<img src={logoPulso} style={{ width: 50, height: 'auto', margin: 10 }} /><h1 style={{ margin: 0, marginTop: 15, color: 'white' }}>CONTROL DE INGRESO</h1><span />
			</div>
			<header className="App-header">
				<div style={{ display: "flex", justifyContent: 'flex-start', alignItems: 'center' }}>
					<div style={{ marginRight: 20 }}>
						{
							user ? (
								<div style={{ display: "flex", width: 600, justifyContent: "space-evenly" }}>
									<h3 style={{ color: "orange", letterSpacing: 3, background: '#441B3E', padding: 5, borderTopLeftRadius: 10, border: '3px solid black', borderRight: 0 }}>{user.firstName.toUpperCase() + " " + user.lastName.toUpperCase()}</h3>
									<h3 style={{ letterSpacing: 3, padding: 5, borderTopRightRadius: 10, border: '3px solid black', background: 'orange' }}>DNI {user.dni}</h3>
								</div>
							) : (
								<p>Por favor, deslice la tarjeta</p>
							)
						}
						{
							plan && (
								<>
									<h4 style={{ color: "black", letterSpacing: 3, border: '3px solid black', background: 'white', marginTop: -33, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, padding: 8, borderTop: 0, width: 578 }}>{plan.name.toUpperCase()}</h4>

								</>
							)
						}
					</div>
					<div style={{ marginRight: 20 }}> { isDue ? '🔴' : '🟢'}</div>
				</div>
				{
					bills.length ? (
						<>
							<h4 style={{ color: "orange", textDecoration: "underline", border: '5px solid #441B3E', borderBottom: 0, marginBottom: 0, padding: 5, background: '#441B3E', borderRadius: 5, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>Últimas facturas</h4>
							<div style={{ display: "flex", flexWrap: "wrap", width: "100%", justifyContent: "space-evenly", border: '5px solid #441B3E' }}>
								{
									bills.map(b => (
										<div style={{ color: b.isDue ? "red" : "green" }}>
											<h4>{b.name}</h4>
											<h5>Emitida: {moment(b.created.split("T")[0]).format("DD-MM-YYYY")}</h5>
											<h5>{b.isDue ? "Venció:" : "Vence:"} {moment(b.dueOn.split("T")[0]).format("DD-MM-YYYY")}</h5>
											<h6>{b.isDue ? "Adeuda" : "Abonada"}</h6>
										</div>
									))
								}
							</div>
						</>
					) : null
				}
				{
					classes.length ? (
						<>
							<h4 style={{ color: "orange", textDecoration: "underline", border: '5px solid #441B3E', borderBottom: 0, marginBottom: 0, padding: 5, background: '#441B3E', borderRadius: 5, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>Próximas clases</h4>
							<div style={{ display: "flex", flexWrap: "wrap", width: "100%", justifyContent: "space-evenly", border: '5px solid #441B3E' }}>
								{
									classes.map(c => (
										<div>
											{c.date < new Date().toISOString ?
												<>
													<h4>{c.name}</h4>
													<h5>{moment(c.dayString.split("T")[0]).format("DD-MM-YYYY") + " " + c.hourString + " hs"}</h5>
												</>
												: null}
										</div>
									))
								}
							</div>
						</>
					) : null
				}
				{
					message && <h2>Usuario no encontrado</h2>

				}
				{
					loader && (
						<Loader
							type="Oval"
							color="orange"
							height={200}
							width={200}
							style={{ position: "absolute", margin: "auto", height: "auto", top: "40%" }}
						/>
					)
				}
			</header>
		</div>
	);
}

export default App;
