import { AthleteRingSeriesEligibilitySet, AthleteRingSeriesQtySet, RingSeriesYearAdded } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
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
	ethersProvider?: any;
	db: admin.firestore.Firestore;

	constructor(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
		this.db = db;
		// Bind this to the event handlers
		this._handleAthleteRingSeriesQtySetEvent = this._handleAthleteRingSeriesQtySetEvent.bind(this);
		this._handleAthleteRingSeriesEligibilitySetEvent = this._handleAthleteRingSeriesEligibilitySetEvent.bind(this);
		this._handleRingSeriesYearAddedEvent = this._handleRingSeriesYearAddedEvent.bind(this);
	};

	async startListeners() {
		this._setListeners();
	}

	_setListeners() {
		this.db.collection(this.eventsDirectory).doc("ring")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.contractAddress = data.college;
					if (this?.contractAddress?.length > 0) {
						this.rpcUrl = data.rpcUrl;
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.AthleteRingSeriesQtySet(), (_athleteId, _maxQty, _athleteQty, eventObject) => this._handleAthleteRingSeriesQtySetEvent(eventObject));
						this.contract.on(this.contract.filters.AthleteRingSeriesEligibilitySet(), (_athleteId, _isEligible, eventObject) => this._handleAthleteRingSeriesEligibilitySetEvent(eventObject));
						this.contract.on(this.contract.filters.RingSeriesYearAdded(), (_athleteId, _year, eventObject) => this._handleRingSeriesYearAddedEvent(eventObject));
					}
				}
			});
	}

	async _handleAthleteRingSeriesQtySetEvent(log: ethers.Event) {
		const event = new AthleteRingSeriesQtySet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athleteRingSeriesQtySet", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY);
	}
	async _handleAthleteRingSeriesEligibilitySetEvent(log: ethers.Event) {
		const event = new AthleteRingSeriesEligibilitySet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athleteRingSeriesEligibilitySet", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY);
	}

	async _handleRingSeriesYearAddedEvent(log: ethers.Event) {
		const event = new RingSeriesYearAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "ringSeriesYearAdded", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY);
	}
}

export class RingSeriesManagerListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): RingSeriesManagerListeners {
		const itemToReturn = new RingSeriesManagerListeners(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







