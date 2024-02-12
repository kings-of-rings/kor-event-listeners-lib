import { ProTeamAdded, ProTeamChanged } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";

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
					this.contractAddress = data.pro;
					if (this.contractAddress?.length > 0) {
						this.rpcUrl = data.rpcUrl;
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.TeamAdded(), this._handleTeamAddedEvent);
						this.contract.on(this.contract.filters.TeamChanged(), this._handleTeamChangedEvent);
					}
				}
			});
	}

	async _handleTeamAddedEvent(log: ethers.EventLog) {
		const event = new ProTeamAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "proTeamAdded", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}

	async _handleTeamChangedEvent(log: ethers.EventLog) {
		const event = new ProTeamChanged(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "proTeamChanged", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}

}

export class ProRegistryListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): ProRegistryListeners {
		const itemToReturn = new ProRegistryListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







