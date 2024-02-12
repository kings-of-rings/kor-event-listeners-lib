import { TokenDataSet } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
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
	ethersProvider?: any;
	db: admin.firestore.Firestore;

	constructor(chainId: number, eventsDirectory: string, isFootball: boolean, db: admin.firestore.Firestore) {
		this.chainId = chainId;
		this.db = db;
		this.eventsDirectory = eventsDirectory;
		this.fieldName = isFootball ? "draftPickNFTsFootball" : "draftPickNFTsBasketball";
		// Bind this to the event handlers
		this._handleTokenDataSetEvent = this._handleTokenDataSetEvent.bind(this);
	};

	async startListeners() {
		this._setListeners();
	}

	_setListeners() {
		this.db.collection(this.eventsDirectory).doc("collectible")
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

	async _handleTokenDataSetEvent(log: ethers.Event) {
		const event = new TokenDataSet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "draftPickTokenDataSet", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY);

	}
}

export class DraftPickNFTListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, isFootball: boolean, db: admin.firestore.Firestore): DraftPickNFTListeners {
		const itemToReturn = new DraftPickNFTListeners(chainId, eventsDirectory, isFootball, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







