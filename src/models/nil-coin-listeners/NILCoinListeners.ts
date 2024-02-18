import * as admin from "firebase-admin";
import { LPManagerListeners, LPManagerListenersFactory } from "./contracts/LPManagerListeners";
import { NILCoinFaucetListeners, NILCoinFaucetListenersFactory } from "./contracts/NILCoinFaucetListeners";


export class NILCoinListeners {
	chainId: number;
	eventsDirectory: string;
	coinFaucetListeners?: NILCoinFaucetListeners;
	lpManagerListeners?: LPManagerListeners;

	constructor(chainId: number, eventsDirectory: string) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
	};

	async startListeners(db: admin.firestore.Firestore) {
		this.coinFaucetListeners = NILCoinFaucetListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.lpManagerListeners = LPManagerListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
	}
}

export class NILCoinListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): NILCoinListeners {
		const itemToReturn = new NILCoinListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







