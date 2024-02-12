import { CollegeAdded, CollegeChanged, TierChanged } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";
import { saveError } from "../../../utils/saveError";

const EVENTS_ABI = [
	"event CollegeAdded(uint256 _collegeId,string _name,string _conference,string _mascot, uint16 _tier, uint16 _royalty)",
	"event CollegeChanged(uint256 _collegeId,string _name,string _conference,string _mascot, uint16 _royalty)",
	"event TierChanged(uint256 _collegeId, uint256 _tier)",
];

export class CollegeRegistryListeners {
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
		this._handleCollegeAddedEvent = this._handleCollegeAddedEvent.bind(this);
		this._handleCollegeChangedEvent = this._handleCollegeChangedEvent.bind(this);
		this._handleTierChangedEvent = this._handleTierChangedEvent.bind(this);

	};

	async startListeners() {
		this._setListeners();
	}

	_setListeners() {
		this.db.collection(this.eventsDirectory).doc("registry")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.contractAddress = data.college;
					if (this.contractAddress?.length > 0) {
						this.rpcUrl = data.rpcUrl;
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.CollegeAdded(), (_collegeId, _name, _conference, _mascot, _tier, _royalty, eventObject) => this._handleCollegeAddedEvent(eventObject));
						this.contract.on(this.contract.filters.CollegeChanged(), (_collegeId, _name, _conference, _mascot, _royalty, eventObject) => this._handleCollegeChangedEvent(eventObject));
						this.contract.on(this.contract.filters.TierChanged(), (_collegeId, _tier, eventObject) => this._handleCollegeChangedEvent(eventObject));
					}
				}
			});
	}

	async _handleCollegeAddedEvent(log: ethers.Event) {
		const event = new CollegeAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "collegeAdded", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in CollegeRegistryListeners._handleCollegeAddedEvent",
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

	async _handleCollegeChangedEvent(log: ethers.Event) {
		const event = new CollegeChanged(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "collegeChanged", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in CollegeRegistryListeners._handleCollegeChangedEvent",
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

	async _handleTierChangedEvent(log: ethers.Event) {
		const event = new TierChanged(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "collegeTierChanged", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in CollegeRegistryListeners._handleTierChangedEvent",
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

export class CollegeRegistryListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): CollegeRegistryListeners {
		const itemToReturn = new CollegeRegistryListeners(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







