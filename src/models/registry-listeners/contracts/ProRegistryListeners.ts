import { ProTeamAdded, ProTeamChanged } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";
import { saveError } from "../../../utils/saveError";

const EVENTS_ABI = [
	"event TeamAdded(uint256  _teamId, string  _name, string _mascot,  string _conference, bool  _isFootball)",
	"event TeamChanged(uint256  _teamId, string  _name, string _mascot, string _conference, bool  _isFootball)"
];

export class ProRegistryListeners {
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
		this._handleTeamAddedEvent = this._handleTeamAddedEvent.bind(this);
		this._handleTeamChangedEvent = this._handleTeamChangedEvent.bind(this);

	};

	async startListeners() {
		this._setListeners();
	}

	_setListeners() {
		this.db.collection(this.eventsDirectory).doc("registry")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.contractAddress = data.pro;
					if (this.contractAddress?.length > 0) {
						this.rpcUrl = data.rpcUrl;
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.TeamAdded(), (_teamId, _name, _mascot, _conference, _isFootball, eventObject) => this._handleTeamAddedEvent(eventObject));
						this.contract.on(this.contract.filters.TeamChanged(), (_teamId, _name, _mascot, _conference, _isFootball, eventObject) => this._handleTeamChangedEvent(eventObject));
					}
				}
			});
	}

	async _handleTeamAddedEvent(log: ethers.Event) {
		const event = new ProTeamAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "proTeamAdded", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in ProRegistryListeners._handleTeamAddedEvent",
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

	async _handleTeamChangedEvent(log: ethers.Event) {
		const event = new ProTeamChanged(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "proTeamChanged", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in ProRegistryListeners._handleTeamChangedEvent",
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

export class ProRegistryListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): ProRegistryListeners {
		const itemToReturn = new ProRegistryListeners(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







