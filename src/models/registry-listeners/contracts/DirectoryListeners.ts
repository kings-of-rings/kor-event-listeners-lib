import { CollectibleSeriesFaucetContractAdded, CollectibleSeriesTokenContractAdded, DraftControllerAdded, RingSeriesTokenContractAdded } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";

const EVENTS_ABI = [
	"event DraftControllerAdded(uint16  _year, address  _address, bool  _isFootball)",
	"event RingSeriesTokenContractAdded(uint16  _year, address  _address)",
	"event CollectibleSeriesFaucetContractAdded(uint16  _year, address  _address, bool  _isFootball)",
	"event CollectibleSeriesTokenContractAdded(uint16  _year, address  _address)"
];

export class DirectoryListeners {
	eventsDirectory: string;
	chainId: number;
	rpcUrl: string = "";
	contractAddress: string = "";
	contract?: ethers.Contract;
	ethersProvider?: any;
	db: admin.firestore.Firestore;

	constructor(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore) {
		this.db = db;
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
		this.db = db;
		// Bind this to the event handlers
		this._handleDraftControllerAddedEvent = this._handleDraftControllerAddedEvent.bind(this);
		this._handleRingSeriesTokenContractAddedEvent = this._handleRingSeriesTokenContractAddedEvent.bind(this);
		this._handleCollectibleSeriesFaucetContractAddedEvent = this._handleCollectibleSeriesFaucetContractAddedEvent.bind(this);
		this._handleCollectibleSeriesTokenContractAddedEvent = this._handleCollectibleSeriesTokenContractAddedEvent.bind(this);

	};

	async startListeners() {
		this._setListeners();
	}

	_setListeners() {
		this.db.collection(this.eventsDirectory).doc("registry")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.contractAddress = data.directory;
					if (this.contractAddress?.length > 0) {
						this.rpcUrl = data.rpcUrl;
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.DraftControllerAdded(), (_year, _address, _isFootball, eventObject) => this._handleDraftControllerAddedEvent(eventObject));
						this.contract.on(this.contract.filters.RingSeriesTokenContractAdded(), (_year, address, eventObject) => this._handleRingSeriesTokenContractAddedEvent(eventObject));
						this.contract.on(this.contract.filters.CollectibleSeriesFaucetContractAdded(), (_year, _address, _isFootball, eventObject) => this._handleCollectibleSeriesFaucetContractAddedEvent(eventObject));
						this.contract.on(this.contract.filters.CollectibleSeriesTokenContractAdded(), (_year, _address, eventObject) => this._handleCollectibleSeriesTokenContractAddedEvent(eventObject));
					}
				}
			});
	}

	async _handleDraftControllerAddedEvent(log: ethers.Event) {
		const event = new DraftControllerAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "draftControllerAdded", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY);
	}

	async _handleRingSeriesTokenContractAddedEvent(log: ethers.Event) {
		const event = new RingSeriesTokenContractAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "ringSeriesTokenContractAdded", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY);
		const dataToSave = {
			address: event.address,
			lastBlockPolled: log.blockNumber
		}
		const ref = this.db.collection(this.eventsDirectory).doc("erc1155").collection('contracts').doc(event.address.toLowerCase());
		await ref.set(dataToSave);
	}
	async _handleCollectibleSeriesFaucetContractAddedEvent(log: ethers.Event) {
		const event = new CollectibleSeriesFaucetContractAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "collectibleSeriesFaucetContractAdded", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY);
	}
	async _handleCollectibleSeriesTokenContractAddedEvent(log: ethers.Event) {
		const event = new CollectibleSeriesTokenContractAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "collectibleSeriesTokenContractAdded", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY);
		const dataToSave = {
			address: event.address,
			lastBlockPolled: log.blockNumber
		}
		const ref = this.db.collection(this.eventsDirectory).doc("erc1155").collection('contracts').doc(event.address.toLowerCase());
		await ref.set(dataToSave);
	}
}

export class DirectoryListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): DirectoryListeners {
		const itemToReturn = new DirectoryListeners(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







