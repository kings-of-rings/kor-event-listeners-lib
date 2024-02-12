import { HighSchoolAdded, HighSchoolChanged } from "@kings-of-rings/kor-contract-event-data-models/lib";
import console from "console";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";

const EVENTS_ABI = [
	"event NewHighSchoolAdded(uint256 indexed _highSchoolId,string indexed _name,string indexed _state,string _city,string _mascot)",
	"event HighSchoolChanged(uint256 indexed _highSchoolId,string indexed _name,string indexed _state,string _city,string _mascot)"
];

export class HighSchoolRegistryListeners {
	eventsDirectory: string;
	chainId: number;
	rpcUrl: string = "";
	contractAddress: string = "";
	contract?: ethers.Contract;
	ethersProvider?: ethers.JsonRpcProvider | ethers.WebSocketProvider;
	db?: admin.firestore.Firestore;

	constructor(chainId: number, eventsDirectory: string) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
	};

	async startListeners(db: admin.firestore.Firestore) {
		this.db = db;
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

	async _handleHighSchoolAddedEvent(log: ethers.Log) {		
		const event = new HighSchoolAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "highSchoolAdded", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}

	async _handleHighSchoolChangedEvent(log: ethers.EventLog) {
		console.log("HighSchoolChanged event received");
		console.log("eventlog ", log);
		const event = new HighSchoolChanged(log, this.chainId);
		console.log("HighSchoolChanged event ", event);
		const endpoint = await getEndpoint(this.eventsDirectory, "highSchoolChanged", this.db);
		console.log("HighSchoolChanged event ", event);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}

}

export class HighSchoolRegistryListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): HighSchoolRegistryListeners {
		const itemToReturn = new HighSchoolRegistryListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







