import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEthersProvider } from "../../../utils/getEthersProvider";

const EVENTS_ABI = [
	"event DraftControllerAdded(uint16  _year, address  _address, bool  _isFootball)",
	"event RingSeriesTokenContractAdded(uint16  _year, address  _address)",
	"event CollectibleSeriesFaucetContractAdded(uint16  _year, address  _address, bool  _isFootball)",
	"event CollectibleSeriesTokenContractAdded(uint16  _year, address  _address)"
];

export class DirectoryListeners {
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
					this.contractAddress = data.directory;
					if (this.contractAddress?.length > 0) {
					this.rpcUrl = data.rpcUrl;
					this.ethersProvider = getEthersProvider(this.rpcUrl);
					this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
					this.contract.on(this.contract.filters.DraftControllerAdded(), this._handleDraftControllerAddedEvent);
					this.contract.on(this.contract.filters.RingSeriesTokenContractAdded(), this._handleRingSeriesTokenContractAddedEvent);
					this.contract.on(this.contract.filters.CollectibleSeriesFaucetContractAdded(), this._handleCollectibleSeriesFaucetContractAddedEvent);
					this.contract.on(this.contract.filters.CollectibleSeriesTokenContractAdded(), this._handleCollectibleSeriesTokenContractAddedEvent);
				}}
			});
	}

	_handleDraftControllerAddedEvent(log: ethers.EventLog) {
		console.log("Event ", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}

	_handleRingSeriesTokenContractAddedEvent(log: ethers.EventLog) {
		console.log("Event ", log);
	}
	_handleCollectibleSeriesFaucetContractAddedEvent(log: ethers.EventLog) {
		console.log("Event ", log);
	}
	_handleCollectibleSeriesTokenContractAddedEvent(log: ethers.EventLog) {
		console.log("Event ", log);
	}
}

export class DirectoryListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): DirectoryListeners {
		const itemToReturn = new DirectoryListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







