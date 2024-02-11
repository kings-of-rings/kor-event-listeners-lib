import * as admin from "firebase-admin";
import { DraftControllerListeners, DraftControllerListenersFactory } from "./contracts/DraftControllerListeners";
import { DraftPickNFTListeners, DraftPickNFTListenersFactory } from "./contracts/DraftPickNFTListeners";

import { CollegeRegistryListeners, CollegeRegistryListenersFactory } from "../registry-listeners/contracts/CollegeRegistryListeners";

export class DraftListeners {
	chainId: number;
	eventsDirectory: string;
	draftController: DraftControllerListeners;
	draftPickNFTs: DraftPickNFTListeners;

	constructor(chainId: number, eventsDirectory: string) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
	};

	async startListeners(db: admin.firestore.Firestore) {
		this.draftController = DraftControllerListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.draftPickNFTs = DraftPickNFTListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
	}
}

export class DraftListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): DraftListeners {
		const itemToReturn = new DraftListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







