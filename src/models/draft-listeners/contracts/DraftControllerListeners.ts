import { ClaimingRequirementsSet, DraftBidIncreased, DraftBidPlaced, DraftPickClaimed, DraftResultsFinalized, DraftStakeClaimed, DraftTimeSet } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";
import { saveError } from "../../../utils/saveError";

const EVENTS_ABI = [
	"event DraftPickClaimed(address indexed _claimingAddress,uint256 indexed _tokenId,uint256 indexed _draftBidId,uint256 _year,bool _isFootball)",
	"event DraftResultsFinalized(bool _resultsFinal, uint256 _year, bool _isFootball)",
	"event DraftTimeSet(uint256 _startTs, uint256 _endTs, uint256 _year, bool _isFootball)",
	"event DraftStakeClaimed(uint256 indexed _bidId,uint256 indexed _year,address indexed _claimingAddress,uint256 _amount,bool _isFootball)",
	"event DraftBidPlaced(uint256 indexed _bidId,address indexed _bidder,uint256 indexed _duration,uint256 _amount,uint256 _points,uint256 _year,bool _isFootball)",
	"event DraftBidIncreased(uint256 indexed _bidId,address indexed _bidder,uint256 indexed _duration,uint256 _amountAdded,uint256 _points,uint256 _year,bool _isFootball)",
	"event ClaimingRequirementsSet(uint256 indexed _tokenId,uint256 indexed _year,bool indexed _isFootball, uint256 _amount)"
];

export class DraftControllerListeners {
	eventsDirectory: string;
	fieldName: string;
	chainId: number;
	rpcUrl: string = "";
	contractAddress: string = "";
	contract?: ethers.Contract;
	ethersProvider?: any;
	db: admin.firestore.Firestore;

	constructor(chainId: number, eventsDirectory: string, isFootball: boolean, db: admin.firestore.Firestore) {
		console.log("DraftControllerListeners.constructor", chainId, eventsDirectory, isFootball);
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
		this.fieldName = isFootball ? "draftControllerFootball" : "draftControllerBasketball";

		this.db = db;
		// Bind this to the event handlers
		this._handleDraftPickClaimedEvent = this._handleDraftPickClaimedEvent.bind(this);
		this._handleDraftResultsFinalizedEvent = this._handleDraftResultsFinalizedEvent.bind(this);
		this._handleDraftTimeSetEvent = this._handleDraftTimeSetEvent.bind(this);
		this._handleDraftStakeClaimedEvent = this._handleDraftStakeClaimedEvent.bind(this);
		this._handleDraftBidPlacedEvent = this._handleDraftBidPlacedEvent.bind(this);
		this._handleDraftBidIncreasedEvent = this._handleDraftBidIncreasedEvent.bind(this);
		this._handleClaimingRequirementsSetEvent = this._handleClaimingRequirementsSetEvent.bind(this);

	};

	async startListeners() {
		this._setListeners();
	}

	_setListeners() {
		this.db.collection(this.eventsDirectory).doc("collectible")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.contractAddress = data[this.fieldName];
					if (this.contractAddress?.length > 0) {
						this.rpcUrl = data.rpcUrl;
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.DraftPickClaimed(), ( _claimingAddress,  _tokenId,  _draftBidId, _year, _isFootball, eventObject)=> this._handleDraftPickClaimedEvent(eventObject));
						this.contract.on(this.contract.filters.DraftResultsFinalized(), (_resultsFinal, _year, _isFootball, eventObject) => this._handleDraftResultsFinalizedEvent(eventObject));
						this.contract.on(this.contract.filters.DraftTimeSet(), (_startTs, _endTs, _year, _isFootball, eventObject) => this._handleDraftTimeSetEvent(eventObject));
						this.contract.on(this.contract.filters.DraftStakeClaimed(), ( _bidId,  _year,  _claimingAddress, _amount, _isFootball, eventObject) => this._handleDraftStakeClaimedEvent(eventObject));
						this.contract.on(this.contract.filters.DraftBidPlaced(), ( _bidId,  _bidder,  _duration, _amount, _points, _year, _isFootball, eventObject) => this._handleDraftBidPlacedEvent(eventObject));
						this.contract.on(this.contract.filters.DraftBidIncreased(), ( _bidId,  _bidder,  _duration, _amountAdded, _points, _year, _isFootball, eventObject) => this._handleDraftBidIncreasedEvent(eventObject));
						this.contract.on(this.contract.filters.ClaimingRequirementsSet(), ( _tokenId,  _year,  _isFootball, _amount, eventObject) => this._handleClaimingRequirementsSetEvent(eventObject));
					}
				}
			});
	}

	async _handleDraftPickClaimedEvent(log: ethers.Event) {
		const event = new DraftPickClaimed(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "draftPickClaimed", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in DraftPickClaimed.saveData",
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

	async _handleDraftResultsFinalizedEvent(log: ethers.Event) {
		const event = new DraftResultsFinalized(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "draftResultsFinalized", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in DraftResultsFinalized.saveData",
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

	async _handleDraftTimeSetEvent(log: ethers.Event) {
		const event = new DraftTimeSet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "draftTimeSet", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in DraftTimeSet.saveData",
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
	async _handleDraftStakeClaimedEvent(log: ethers.Event) {
		const event = new DraftStakeClaimed(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "draftStakeClaimed", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in DraftStakeClaimed.saveData",
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
	async _handleDraftBidPlacedEvent(log: ethers.Event) {
		const event = new DraftBidPlaced(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "draftBidPlaced", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in DraftBidPlaced.saveData",
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
	async _handleDraftBidIncreasedEvent(log: ethers.Event) {
		const event = new DraftBidIncreased(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "draftBidIncreased", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in DraftBidIncreased.saveData",
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
	async _handleClaimingRequirementsSetEvent(log: ethers.Event) {
		const event = new ClaimingRequirementsSet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "claimingRequirementsSet", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in ClaimingRequirementsSet.saveData",
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

export class DraftControllerListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, isFootball: boolean, db: admin.firestore.Firestore): DraftControllerListeners {
		const itemToReturn = new DraftControllerListeners(chainId, eventsDirectory, isFootball, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







