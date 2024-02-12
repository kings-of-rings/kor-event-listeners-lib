import { FaucetTargetPrice, TokenFaucetSale } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";

const EVENTS_ABI = [
	"event FaucetTargetPrice(uint256 _price)",
	"event TokenFaucetSale(uint256 _saleId, address _buyer, uint256 _qty, uint256 _totalCost)"
];

export class NILCoinFaucetListeners {
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
		this._handleFaucetTargetPriceEvent = this._handleFaucetTargetPriceEvent.bind(this);
		this._handleTokenFaucetSaleEvent = this._handleTokenFaucetSaleEvent.bind(this);

	};

	async startListeners() {
		this._setListeners();
	}

	_setListeners() {
		this.db.collection(this.eventsDirectory).doc("nil")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.contractAddress = data.nilCoinFaucet;
					if (this.contractAddress?.length > 0) {
						this.rpcUrl = data.rpcUrl;
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.FaucetTargetPrice(), this._handleFaucetTargetPriceEvent);
						this.contract.on(this.contract.filters.TokenFaucetSale(), this._handleTokenFaucetSaleEvent);
					}
				}
			});
	}

	async _handleFaucetTargetPriceEvent(log: ethers.Event) {
		const event = new FaucetTargetPrice(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "nilFaucetTargetPrice", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}
	async _handleTokenFaucetSaleEvent(log: ethers.Event) {
		const event = new TokenFaucetSale(log);
		const endpoint = await getEndpoint(this.eventsDirectory, "tokenFaucetSale", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}
}

export class NILCoinFaucetListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): NILCoinFaucetListeners {
		const itemToReturn = new NILCoinFaucetListeners(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







