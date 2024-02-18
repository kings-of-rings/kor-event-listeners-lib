import * as admin from "firebase-admin";
import { CollectibleSeriesFaucetListener, CollectibleSeriesFaucetListenerFactory } from "./contracts/CollectibleSeriesFaucetListener";
import { CollectibleSeriesNFTListener, CollectibleSeriesNFTListenerFactory } from "./contracts/CollectibleSeriesNFTListener";
import { CollegeBurnAuctionListener, CollegeBurnAuctionListenerFactory } from "./contracts/CollegeBurnAuctionListener";

export class CollectibleSeriesListeners {
	chainId: number;
	eventsDirectory: string;
	nftListeners?: CollectibleSeriesNFTListener;
	basketballFaucetListeners?: CollectibleSeriesFaucetListener;
	footballFaucetListeners?: CollectibleSeriesFaucetListener;
	basketballBurnAuctionListeners?: CollegeBurnAuctionListener;
	footballBurnAuctionListeners?: CollegeBurnAuctionListener;

	constructor(chainId: number, eventsDirectory: string) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
	};

	async startListeners(db: admin.firestore.Firestore) {
		this.nftListeners = CollectibleSeriesNFTListenerFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.basketballFaucetListeners = CollectibleSeriesFaucetListenerFactory.startListeners(this.chainId, this.eventsDirectory, false, db);
		this.footballFaucetListeners = CollectibleSeriesFaucetListenerFactory.startListeners(this.chainId, this.eventsDirectory, true, db);

		this.basketballBurnAuctionListeners = CollegeBurnAuctionListenerFactory.startListeners(this.chainId, this.eventsDirectory, false, db);
		this.footballBurnAuctionListeners = CollegeBurnAuctionListenerFactory.startListeners(this.chainId, this.eventsDirectory, true, db);
	}
}

export class CollectibleSeriesListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): CollectibleSeriesListeners {
		const itemToReturn = new CollectibleSeriesListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







