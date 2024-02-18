import { TokenUriSet } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";
import { saveError } from "../../../utils/saveError";

const EVENTS_ABI = [
	"event TokenUriSet(uint256 _tokenId, string _uri)"
];

export class CollectibleSeriesNFTListener {
	eventsDirectory: string;
	docName: string = "collectibleSeriesNfts";
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
		this._handleTokenUriSetEvent = this._handleTokenUriSetEvent.bind(this);
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
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.TokenUriSet(), (_tokenId, _uri, eventObject) => this._handleTokenUriSetEvent(eventObject));
					}
				}
			});
	}

	async _handleTokenUriSetEvent(log: ethers.Event) {
		const event = new TokenUriSet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "tokenUriSet", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in CollectibleSeriesNFTListener._handleTokenUriSetEvent",
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

export class CollectibleSeriesNFTListenerFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): CollectibleSeriesNFTListener {
		const itemToReturn = new CollectibleSeriesNFTListener(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







