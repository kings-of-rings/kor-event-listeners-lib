import { AccessCreditsAddressSet, AthletePriceSet, CollectibleFaucetSale, CollectibleFaucetTimeSet, FaucetLevelAdded } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";
import { saveError } from "../../../utils/saveError";

const EVENTS_ABI = [
	"event AccessCreditsAddress(uint16 _year, bool _isFootball, address _accessCreditsAddress)",
	"event AthletePriceSet(uint256 _athleteId, uint16 _year, uint256 _price)",
	"event CollectibleFaucetTimeSet(uint256 _open, uint256 _freeAgency, uint256 _close, uint16 _year, bool _isFootball)",
	"event LevelAdded(uint256 _level,uint256 _levelEnds, uint256 _qtyAllowed,uint256 _increasePercentage,uint16 _year,bool _isFootball)",
	"event CollectibleFaucetSale(uint256 _saleId,uint256 _athleteId,address _buyer,uint256 _qty,uint256 _totalCost,uint16 _year,bool _isFootball)"
];

export class CollectibleSeriesFaucetListener {
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
		// Bind this to the event handlers
		this._handleAccessCreditsAddressEvent = this._handleAccessCreditsAddressEvent.bind(this);
		this._handleAthletePriceSetEvent = this._handleAthletePriceSetEvent.bind(this);
		this._handleCollectibleFaucetTimeSetEvent = this._handleCollectibleFaucetTimeSetEvent.bind(this);
		this._handleLevelAddedEvent = this._handleLevelAddedEvent.bind(this);
		this._handleCollectibleFaucetSaleEvent = this._handleCollectibleFaucetSaleEvent.bind(this);
	};

	async startListeners() {
		this._setListeners();
	}

	_setListeners() {
		this.db.collection(this.eventsDirectory).doc("collectible")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data && data.collectibleFaucet && data?.collectibleFaucet?.length > 0) {
					this.contractAddress = data.collectibleFaucet;
					this.rpcUrl = data.rpcUrl;
					this.ethersProvider = getEthersProvider(this.rpcUrl);
					this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
					this.contract.on(this.contract.filters.AccessCreditsAddress(), (_year, _isFootball, _address, eventObject) => this._handleAccessCreditsAddressEvent(eventObject));
					this.contract.on(this.contract.filters.AthletePriceSet(), (_athleteId, _year, _price, eventObject) => this._handleAthletePriceSetEvent(eventObject));
					this.contract.on(this.contract.filters.CollectibleFaucetTimeSet(), (_open, _freeAgency, _close, _year, _isFootball, eventObject) => this._handleCollectibleFaucetTimeSetEvent(eventObject));
					this.contract.on(this.contract.filters.LevelAdded(), (_level, _levelEnds, _qtyAllowed, _increasePercentage, _year, _isFootball, eventObject) => this._handleLevelAddedEvent(eventObject));
					this.contract.on(this.contract.filters.CollectibleFaucetSale(), (_saleId, _athleteId, _buyer, _qty, _totalCost, _year, _isFootball, eventObject) => this._handleCollectibleFaucetSaleEvent(eventObject));
				}
			});
	}

	async _handleAccessCreditsAddressEvent(log: ethers.Event) {
		const event = new AccessCreditsAddressSet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "accessCreditsAddress", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in AccessCreditsAddressSet.saveData",
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
	async _handleAthletePriceSetEvent(log: ethers.Event) {
		const event = new AthletePriceSet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athletePriceSet", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in AthletePriceSet",
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
	async _handleCollectibleFaucetTimeSetEvent(log: ethers.Event) {
		const event = new CollectibleFaucetTimeSet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "collectibleFaucetTimeSet", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in CollectibleFaucetTimeSet.saveData",
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
	async _handleLevelAddedEvent(log: ethers.Event) {
		const event = new FaucetLevelAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "faucetLevelAdded", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in FaucetLevelAdded.saveData",
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
	async _handleCollectibleFaucetSaleEvent(log: ethers.Event) {
		const event = new CollectibleFaucetSale(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "faucetSale", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in CollectibleFaucetSale.saveData",
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
}

export class CollectibleSeriesFaucetListenerFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): CollectibleSeriesFaucetListener {
		const itemToReturn = new CollectibleSeriesFaucetListener(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







