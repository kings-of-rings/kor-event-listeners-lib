import { ethers } from "ethers";
import * as admin from "firebase-admin";
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
	ethersProvider?: ethers.JsonRpcProvider | ethers.WebSocketProvider;

	constructor(chainId: number, eventsDirectory: string) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
	};

	async startListeners(db: admin.firestore.Firestore) {
		this._setListeners(db);
	}

	_setListeners(db: admin.firestore.Firestore) {
		db.collection(this.eventsDirectory).doc("nil")
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
				}}
			});
	}

	_handleFaucetTargetPriceEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}
	_handleTokenFaucetSaleEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}
}

export class NILCoinFaucetListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): NILCoinFaucetListeners {
		const itemToReturn = new NILCoinFaucetListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







