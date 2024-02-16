import * as admin from "firebase-admin";
import { CollectibleSeriesListeners, CollectibleSeriesListenersFactory } from "./collectible-series-listeners/CollectibleSeriesListeners";
import { DraftListeners, DraftListenersFactory } from "./draft-listeners/DraftListeners";
import { ERC1155Listeners, ERC1155ListenersFactory } from "./erc-1155-listeners/ERC1155Listeners";
import { ERC20Listeners, ERC20ListenersFactory } from "./erc-20-listeners/ERC20Listeners";
import { ERC721Listeners, ERC721ListenersFactory } from "./erc-721-listeners/ERC721Listeners";
import { NILCoinListeners, NILCoinListenersFactory } from "./nil-coin-listeners/NILCoinListeners";
import { RegistryListeners, RegistryListenersFactory } from "./registry-listeners/RegistryListeners";
import { RingSeriesListeners, RingSeriesListenersFactory } from "./ring-series-listeners/RingSeriesListeners";
import { StakingListeners, StakingListenersFactory } from "./staking/StakingListeners";

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
	stakingListeners: StakingListeners;

	constructor(chainId: number, eventsDirectory: string) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
	};

	async startListeners(db: admin.firestore.Firestore) {
		this.registryListeners = RegistryListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.draftListeners = DraftListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.erc20Listeners = ERC20ListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.erc721Listeners = ERC721ListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.erc1155Listeners = ERC1155ListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.nilListeners = NILCoinListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.collectibleSeriesListeners = CollectibleSeriesListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.ringSeriesListeners = RingSeriesListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.stakingListeners = StakingListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
	}
}

export class KoREventListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): KoREventListeners {
		const itemToReturn = new KoREventListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







