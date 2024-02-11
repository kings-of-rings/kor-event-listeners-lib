import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEthersProvider } from "../../../utils/getEthersProvider";

const EVENTS_ABI = [
	"event ActiveYearAdded(uint256  _athleteId, uint16  _year)",
	"event IsSignedChanged(uint256  _athleteId, bool  _isSigned)",
	"event AthleteAdded(uint256  _athleteId,bool  _isFootball,string  _displayName,string _lastName,string _middleName,string _firstName)",
	"event AthleteNameChanged(uint256  _athleteId,string  _displayName,string  _lastName,string _middleName,string _firstName)",
	"event AthleteCollegeChanged(uint256  _athleteId,uint256  _collegeId,uint256  _jerseyNumber,string _position)",
	"event AthleteHighSchoolChanged(uint256  _athleteId,uint256 _highSchoolId,uint256  _jerseyNumber,string _position,uint16 _year)",
	"event AthleteProTeamChanged(uint256  _athleteId,uint256  _proTeamId,uint256  _jerseyNumber,string _position)"
];

export class AthleteRegistryListeners {
	eventsDirectory: string;
	chainId: number;
	rpcUrl: string = "";
	contractAddress: string = "";
	contract?: ethers.Contract;
	ethersProvider?: ethers.JsonRpcProvider | ethers.WebSocketProvider;

	constructor(chainId: number, eventsDirectory: string) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
	};

	async startListeners(db: admin.firestore.Firestore) {
		this._setListeners(db);
	}

	_setListeners(db: admin.firestore.Firestore) {
		db.collection(this.eventsDirectory).doc("registry")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					console.log("AthleteRegistryListeners", data);
					this.contractAddress = data.highSchool;
					if (this.contractAddress?.length > 0) {
					this.rpcUrl = data.rpcUrl;
					this.ethersProvider = getEthersProvider(this.rpcUrl);
					this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
					this.contract.on(this.contract.filters.ActiveYearAdded(), this._handleActiveYearAddedEvent);
					this.contract.on(this.contract.filters.IsSignedChanged(), this._handleIsSignedChangedEvent);
					this.contract.on(this.contract.filters.AthleteAdded(), this._handleAthleteAddedEvent);
					this.contract.on(this.contract.filters.AthleteNameChanged(), this._handleAthleteNameChangedEvent);
					this.contract.on(this.contract.filters.AthleteCollegeChanged(), this._handleAthleteCollegeChangedEvent);
					this.contract.on(this.contract.filters.AthleteHighSchoolChanged(), this._handleAthleteHighSchoolChangedEvent);
					this.contract.on(this.contract.filters.AthleteProTeamChanged(), this._handleAthleteProTeamChangedEvent);
				}}
			});
	}

	_handleActiveYearAddedEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}

	_handleIsSignedChangedEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}

	_handleAthleteAddedEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}

	_handleAthleteNameChangedEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}

	_handleAthleteCollegeChangedEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}

	_handleAthleteHighSchoolChangedEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}

	_handleAthleteProTeamChangedEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}

	_handleEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}

}

export class AthleteRegistryListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): AthleteRegistryListeners {
		const itemToReturn = new AthleteRegistryListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







