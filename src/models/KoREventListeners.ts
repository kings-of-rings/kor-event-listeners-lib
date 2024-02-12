import * as admin from "firebase-admin";
import { CollectibleSeriesListeners } from "./collectible-series-listeners/CollectibleSeriesListeners";
import { DraftListeners, DraftListenersFactory } from "./draft-listeners/DraftListeners";
import { ERC1155Listeners } from "./erc-1155-listeners/ERC1155Listeners";
import { ERC20Listeners } from "./erc-20-listeners/ERC20Listeners";
import { ERC721Listeners } from "./erc-721-listeners/ERC721Listeners";
import { NILCoinListeners, NILCoinListenersFactory } from "./nil-coin-listeners/NILCoinListeners";
import { RegistryListeners, RegistryListenersFactory } from "./registry-listeners/RegistryListeners";
import { RingSeriesListeners } from "./ring-series-listeners/RingSeriesListeners";

export class KoREventListeners {
	chainId: number;
	eventsDirectory: string;
	erc20Listeners: ERC20Listeners;
	erc721Listeners: ERC721Listeners;
	erc1155Listeners: ERC1155Listeners;
	registryListeners: RegistryListeners;
	draftListeners: DraftListeners;
	nilListeners: NILCoinListeners;
	collectibleSeriesListeners: CollectibleSeriesListeners;
	ringSeriesListeners: RingSeriesListeners;

	constructor(chainId: number, eventsDirectory: string) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
	};

	async startListeners(db: admin.firestore.Firestore) {
		this.registryListeners = RegistryListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.draftListeners = DraftListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.erc20Listeners = new ERC20Listeners(this.chainId, this.eventsDirectory, db);
		this.erc721Listeners = new ERC721Listeners(this.chainId, this.eventsDirectory, db);
		this.erc1155Listeners = new ERC1155Listeners(this.chainId, this.eventsDirectory, db);
		this.nilListeners = NILCoinListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.collectibleSeriesListeners = new CollectibleSeriesListeners(this.chainId, this.eventsDirectory);
		this.ringSeriesListeners = new RingSeriesListeners(this.chainId, this.eventsDirectory);
	}
}

export class KoREventListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): KoREventListeners {
		const itemToReturn = new KoREventListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







