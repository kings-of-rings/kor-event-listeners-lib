import { HighSchoolAdded, HighSchoolChanged } from "@kings-of-rings/kor-contract-event-data-models/lib";
import console from "console";
import { BigNumber, ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";
import { saveError } from "../../../utils/saveError";

const EVENTS_ABI = [
	"event NewHighSchoolAdded(uint256 indexed _highSchoolId, string _name, string _state, string _city, string _mascot)",
	"event HighSchoolChanged(uint256 indexed _highSchoolId, string _name, string _state, string _city, string _mascot)"
];

export class HighSchoolRegistryListeners {
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
		this._handleHighSchoolAddedEvent = this._handleHighSchoolAddedEvent.bind(this);
		this._handleHighSchoolChangedEvent = this._handleHighSchoolChangedEvent.bind(this);
	};

	startListeners() {
		this._setListeners();
	}

	_setListeners() {
		this.db.collection(this.eventsDirectory).doc("registry")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.contractAddress = data.highSchool;
					if (this.contractAddress?.length > 0) {
						this.rpcUrl = data.rpcUrl;
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.NewHighSchoolAdded(), this._handleHighSchoolAddedEvent);
						this.contract.on(this.contract.filters.HighSchoolChanged(), this._handleHighSchoolChangedEvent);
					}
				}
			});
	}


	async _handleHighSchoolAddedEvent(highSchoolId: BigNumber, name: string, state: string, city: string, mascot: string, eventObject: any) {
		const event = new HighSchoolAdded(eventObject, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "highSchoolAdded", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		console.log('HighSchoolAdded.event', event);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in HighSchoolAdded.saveData",
				"result": result.response.data,
				"endpoint": endpoint,
				"txHash": event.txHash,
				"blockNumber": event.blockNumber,
				"chainId": event.chainId,
				"contractAddress": event.contractAddress,
			}
			await saveError(errorData, this.db);
		}
	}

	async _handleHighSchoolChangedEvent(highSchoolId: BigNumber, name: string, state: string, city: string, mascot: string, eventObject: any) {
		const event = new HighSchoolChanged(eventObject, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "highSchoolChanged", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in HighSchoolAdded.saveData",
				"result": result.response.data,
				"endpoint": endpoint,
				"txHash": event.txHash,
				"blockNumber": event.blockNumber,
				"chainId": event.chainId,
				"contractAddress": event.contractAddress,
			}
			await saveError(errorData, this.db);
		}
	}
}

export class HighSchoolRegistryListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): HighSchoolRegistryListeners {
		const itemToReturn = new HighSchoolRegistryListeners(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







