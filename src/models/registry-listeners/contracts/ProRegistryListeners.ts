import { ethers } from "ethers";
import * as admin from "firebase-admin";
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

	_handleTeamAddedEvent(log: ethers.EventLog) {
		console.log("High School Added", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}

	_handleTeamChangedEvent(log: ethers.EventLog) {
		console.log("High School Changed", log);
	}

}

export class ProRegistryListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): ProRegistryListeners {
		const itemToReturn = new ProRegistryListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







