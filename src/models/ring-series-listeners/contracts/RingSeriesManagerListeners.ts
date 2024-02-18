import { AthleteRingSeriesEligibilitySet, AthleteRingSeriesQtySet, RingSeriesYearAdded } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";
import { saveError } from "../../../utils/saveError";
const EVENTS_ABI = [
	"event AthleteRingSeriesQtySet(uint256 indexed _athleteId, uint256 _maxQty, uint256 _athleteQty)",
	"event AthleteRingSeriesEligibilitySet(uint256 indexed _athleteId, bool _isEligible)",
	"event RingSeriesYearAdded(uint256 indexed _athleteId, uint16 indexed _year)"
];
export class RingSeriesManagerListeners {
	eventsDirectory: string;
	docName: string = "ringSeriesManager";
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
		this.db.collection(this.eventsDirectory).doc("pollers").collection("contracts").doc(this.docName)
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data && data.contractAddress && data?.contractAddress?.length > 0) {
					this.contractAddress = data.contractAddress;
					this.rpcUrl = data.listenerRpcUrl;
					const paused = data.paused;
					if (paused) {
						if (this.contract) {
							this.contract.removeAllListeners();
						}
						return;
					} else {
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
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in RingSeriesManagerListeners._handleAthleteRingSeriesQtySetEvent",
				"result": result.response.data,
				"endpoint": endpoint,
				"txHash": log.transactionHash,
				"blockNumber": log.blockNumber,
				"chainId": this.chainId,
				"contractAddress": log.address,
			}
			await saveError(errorData, this.db);
		}
	}
	async _handleAthleteRingSeriesEligibilitySetEvent(log: ethers.Event) {
		const event = new AthleteRingSeriesEligibilitySet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athleteRingSeriesEligibilitySet", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in RingSeriesManagerListeners._handleAthleteRingSeriesEligibilitySetEvent",
				"result": result.response.data,
				"endpoint": endpoint,
				"txHash": log.transactionHash,
				"blockNumber": log.blockNumber,
				"chainId": this.chainId,
				"contractAddress": log.address,
			}
			await saveError(errorData, this.db);
		}
	}

	async _handleRingSeriesYearAddedEvent(log: ethers.Event) {
		const event = new RingSeriesYearAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "ringSeriesYearAdded", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in RingSeriesManagerListeners._handleRingSeriesYearAddedEvent",
				"result": result.response.data,
				"endpoint": endpoint,
				"txHash": log.transactionHash,
				"blockNumber": log.blockNumber,
				"chainId": this.chainId,
				"contractAddress": log.address,
			}
			await saveError(errorData, this.db);
		}
	}
}

export class RingSeriesManagerListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): RingSeriesManagerListeners {
		const itemToReturn = new RingSeriesManagerListeners(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







