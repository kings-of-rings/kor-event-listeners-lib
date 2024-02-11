import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEthersProvider } from "../../../utils/getEthersProvider";

const EVENTS_ABI = [
	"event TokenDataSet(uint256  _tokenId,uint256  _round,uint256  _slot,uint256 _startTs,string _uri,uint16 _year,bool _isFootball)"
];

export class DraftPickNFTListeners {
	eventsDirectory: string;
	fieldName: string;
	chainId: number;
	rpcUrl: string = "";
	contractAddress: string = "";
	contract?: ethers.Contract;
	ethersProvider?: ethers.JsonRpcProvider | ethers.WebSocketProvider;

	constructor(chainId: number, eventsDirectory: string, isFootball: boolean) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
		this.fieldName = isFootball ? "draftPickNFTsFootball" : "draftPickNFTsBasketball";
};

	async startListeners(db: admin.firestore.Firestore) {
		this._setListeners(db);
	}

	_setListeners(db: admin.firestore.Firestore) {
		db.collection(this.eventsDirectory).doc("collectible")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.contractAddress = data.college;
					if (this.contractAddress?.length > 0) {
						this.rpcUrl = data.rpcUrl;
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.TokenDataSet(), this._handleTokenDataSetEvent);
					}
				}
			});
	}

	_handleTokenDataSetEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}
}

export class DraftPickNFTListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, isFootball: boolean, db: admin.firestore.Firestore): DraftPickNFTListeners {
		const itemToReturn = new DraftPickNFTListeners(chainId, eventsDirectory, isFootball);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







