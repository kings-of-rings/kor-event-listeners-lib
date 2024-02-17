import { CollectibleSeriesFaucetContractAdded, CollectibleSeriesTokenContractAdded, DraftControllerAdded, RingSeriesTokenContractAdded } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";
import { saveError } from "../../../utils/saveError";

const EVENTS_ABI = [
	"event DraftControllerAdded(uint16 indexed _year, address indexed _address, bool indexed _isFootball)",
	"event RingSeriesTokenContractAdded(uint16 indexed _year, address indexed _address)",
	"event CollectibleSeriesFaucetContractAdded(uint16 indexed _year, address indexed _address, bool indexed _isFootball)",
	"event CollectibleSeriesTokenContractAdded(uint16 indexed _year, address indexed _address)"
];

export class DirectoryListeners {
	eventsDirectory: string;
	docName: string = "korDirectory";
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
		this.db.collection(this.eventsDirectory).doc("pollers").collection("contracts").doc(this.docName)
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data && data.contractAddress && data?.contractAddress?.length > 0) {
					this.contractAddress = data.contractAddress;
					this.rpcUrl = data.rpcUrl;
					const paused = data.paused;
					if (paused) {
						if (this.contract) {
							this.contract.removeAllListeners();
						}
						return;
					} else {
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
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in DirectoryListeners._handleDraftControllerAddedEvent",
				"result": result.response.data,
				"endpoint": endpoint,
				"txHash": log.transactionHash,
				"blockNumber": log.blockNumber,
				"chainId": this.chainId,
				"contractAddress": log.address,
			}
			await saveError(errorData, this.db);
		}
	}

	async _handleRingSeriesTokenContractAddedEvent(log: ethers.Event) {
		const event = new RingSeriesTokenContractAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "ringSeriesTokenContractAdded", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in DirectoryListeners._handleRingSeriesTokenContractAddedEvent",
				"result": result.response.data,
				"endpoint": endpoint,
				"txHash": log.transactionHash,
				"blockNumber": log.blockNumber,
				"chainId": this.chainId,
				"contractAddress": log.address,
			}
			await saveError(errorData, this.db);
		}




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
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in DirectoryListeners._handleCollectibleSeriesFaucetContractAddedEvent",
				"result": result.response.data,
				"endpoint": endpoint,
				"txHash": log.transactionHash,
				"blockNumber": log.blockNumber,
				"chainId": this.chainId,
				"contractAddress": log.address,
			}
			await saveError(errorData, this.db);
		}
	}
	async _handleCollectibleSeriesTokenContractAddedEvent(log: ethers.Event) {
		const event = new CollectibleSeriesTokenContractAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "collectibleSeriesTokenContractAdded", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in _handleCollectibleSeriesTokenContractAddedEvent.saveData",
				"result": result.response.data,
				"endpoint": endpoint,
				"txHash": log.transactionHash,
				"blockNumber": log.blockNumber,
				"chainId": this.chainId,
				"contractAddress": log.address,
			}
			await saveError(errorData, this.db);
		}
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







