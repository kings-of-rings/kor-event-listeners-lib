import { TokenDataSet } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";
import { saveError } from "../../../utils/saveError";

const EVENTS_ABI = [
	"event TokenDataSet(uint256  _tokenId,uint256  _round,uint256  _slot,uint256 _startTs,string _uri,uint16 _year,bool _isFootball)"
];

export class DraftPickNFTListeners {
	eventsDirectory: string;
	docName: string = "draftPickNftsFootball";
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
		this.docName = isFootball ? "draftPickNftsFootball" : "draftPickNftsBasketball";

		// Bind this to the event handlers
		this._handleTokenDataSetEvent = this._handleTokenDataSetEvent.bind(this);
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
						this.rpcUrl = data.listenerRpcUrl;
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.TokenDataSet(), (_tokenId, _round, _slot, _startTs, _uri, _year, _isFootball, eventObject) => this._handleTokenDataSetEvent(eventObject));
					}
				}
			});
	}

	async _handleTokenDataSetEvent(log: ethers.Event) {
		const event = new TokenDataSet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "draftPickTokenDataSet", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in DraftPickNFTListeners._handleTokenDataSetEvent",
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

export class DraftPickNFTListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, isFootball: boolean, db: admin.firestore.Firestore): DraftPickNFTListeners {
		const itemToReturn = new DraftPickNFTListeners(chainId, eventsDirectory, isFootball, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







