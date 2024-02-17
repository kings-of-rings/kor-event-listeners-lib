import { FaucetTargetPrice, TokenFaucetSale } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";
import { saveError } from "../../../utils/saveError";

const EVENTS_ABI = [
	"event FaucetTargetPrice(uint256 _price)",
	"event TokenFaucetSale(uint256 indexed _saleId, address indexed _buyer, uint256 _qty, uint256 _totalCost)"
];

export class NILCoinFaucetListeners {
	eventsDirectory: string;
	docName: string = "nilCoinFaucet";
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
		this._handleFaucetTargetPriceEvent = this._handleFaucetTargetPriceEvent.bind(this);
		this._handleTokenFaucetSaleEvent = this._handleTokenFaucetSaleEvent.bind(this);

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
					this.rpcUrl = data.rpcUrl;
					const paused = data.paused;
					if (paused) {
						if (this.contract) {
							this.contract.removeAllListeners();
						}
						return;
					} else {
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.FaucetTargetPrice(), (_price, eventObject) => this._handleFaucetTargetPriceEvent(eventObject));
						this.contract.on(this.contract.filters.TokenFaucetSale(), (_saleId, _buyer, _qty, _totalCost, eventObject) => this._handleTokenFaucetSaleEvent(eventObject));
					}
				}
			});
	}

	async _handleFaucetTargetPriceEvent(log: ethers.Event) {
		const event = new FaucetTargetPrice(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "nilFaucetTargetPrice", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in NILCoinFaucetListeners._handleFaucetTargetPriceEvent",
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
	async _handleTokenFaucetSaleEvent(log: ethers.Event) {
		const event = new TokenFaucetSale(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "tokenFaucetSale", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in NILCoinFaucetListeners._handleTokenFaucetSaleEvent",
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

export class NILCoinFaucetListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): NILCoinFaucetListeners {
		const itemToReturn = new NILCoinFaucetListeners(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







