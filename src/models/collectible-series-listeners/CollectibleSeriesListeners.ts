import * as admin from "firebase-admin";
import { CollectibleSeriesFaucetListener, CollectibleSeriesFaucetListenerFactory } from "./contracts/CollectibleSeriesFaucetListener";
import { CollectibleSeriesNFTListener, CollectibleSeriesNFTListenerFactory } from "./contracts/CollectibleSeriesNFTListener";
import { CollegeBurnAuctionListener, CollegeBurnAuctionListenerFactory } from "./contracts/CollegeBurnAuctionListener";

export class CollectibleSeriesListeners {
	chainId: number;
	eventsDirectory: string;
	nftListeners: CollectibleSeriesNFTListener;
	faucetListeners: CollectibleSeriesFaucetListener;
	burnAuctionListeners: CollegeBurnAuctionListener;

	constructor(chainId: number, eventsDirectory: string) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
	};

	async startListeners(db: admin.firestore.Firestore) {
		this.nftListeners = CollectibleSeriesNFTListenerFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.faucetListeners = CollectibleSeriesFaucetListenerFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.burnAuctionListeners = CollegeBurnAuctionListenerFactory.startListeners(this.chainId, this.eventsDirectory, db);
	}
}

export class CollectibleSeriesListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): CollectibleSeriesListeners {
		const itemToReturn = new CollectibleSeriesListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







