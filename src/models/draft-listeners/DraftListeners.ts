import * as admin from "firebase-admin";
import { DraftControllerListeners, DraftControllerListenersFactory } from "./contracts/DraftControllerListeners";
import { DraftPickNFTListeners, DraftPickNFTListenersFactory } from "./contracts/DraftPickNFTListeners";

import { CollegeRegistryListeners, CollegeRegistryListenersFactory } from "../registry-listeners/contracts/CollegeRegistryListeners";

export class DraftListeners {
	chainId: number;
	eventsDirectory: string;
	draftControllerBasketball: DraftControllerListeners;
	draftPickNFTsBasketball: DraftPickNFTListeners;
	draftControllerFootball: DraftControllerListeners;
	draftPickNFTsFootball: DraftPickNFTListeners;

	constructor(chainId: number, eventsDirectory: string) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
	};

	async startListeners(db: admin.firestore.Firestore) {
		this.draftControllerBasketball = DraftControllerListenersFactory.startListeners(this.chainId, this.eventsDirectory, false, db);
		this.draftPickNFTsBasketball = DraftPickNFTListenersFactory.startListeners(this.chainId, this.eventsDirectory, false, db);
		this.draftControllerFootball = DraftControllerListenersFactory.startListeners(this.chainId, this.eventsDirectory, true, db);
		this.draftPickNFTsFootball = DraftPickNFTListenersFactory.startListeners(this.chainId, this.eventsDirectory, true, db);
	}
}

export class DraftListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): DraftListeners {
		const itemToReturn = new DraftListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







