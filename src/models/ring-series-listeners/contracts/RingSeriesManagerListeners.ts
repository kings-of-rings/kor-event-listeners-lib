import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEthersProvider } from "../../../utils/getEthersProvider";

const EVENTS_ABI = [
	"event AthleteRingSeriesQtySet(uint256 _athleteId, uint256 _maxQty, uint256 _athleteQty)",
	"event AthleteRingSeriesEligibilitySet(uint256 _athleteId, bool _isEligible)",
	"event RingSeriesYearAdded(uint256 _athleteId, uint16 _year)"
];

export class RingSeriesManagerListeners {
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
		db.collection(this.eventsDirectory).doc("ring")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.contractAddress = data.college; 
					if (this?.contractAddress?.length > 0) {
					this.rpcUrl = data.rpcUrl;
					this.ethersProvider = getEthersProvider(this.rpcUrl);
					this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.AthleteRingSeriesQtySet(), this._handleAthleteRingSeriesQtySetEvent);
						this.contract.on(this.contract.filters.AthleteRingSeriesEligibilitySet(), this._handleAthleteRingSeriesEligibilitySetEvent);
						this.contract.on(this.contract.filters.RingSeriesYearAdded(), this._handleRingSeriesYearAddedEvent);
					}
				}
			});
	}

	_handleAthleteRingSeriesQtySetEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}
	_handleAthleteRingSeriesEligibilitySetEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}
	_handleRingSeriesYearAddedEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}
}

export class RingSeriesManagerListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): RingSeriesManagerListeners {
		const itemToReturn = new RingSeriesManagerListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







