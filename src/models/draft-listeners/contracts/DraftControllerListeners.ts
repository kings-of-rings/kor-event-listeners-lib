import { ClaimingRequirementsSet, DraftBidIncreased, DraftBidPlaced, DraftPickClaimed, DraftResultsFinalized, DraftStakeClaimed, DraftTimeSet } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";

const EVENTS_ABI = [
	"event DraftPickClaimed(address  _claimingAddress,uint256  _tokenId,uint256  _draftBidId,uint256 _year,bool _isFootball)",
	"event DraftResultsFinalized(bool _resultsFinal, uint256 _year, bool _isFootball)",
	"event DraftTimeSet(uint256 _startTs, uint256 _endTs, uint256 _year, bool _isFootball)",
	"event DraftStakeClaimed(uint256  _bidId,uint256  _year,address  _claimingAddress,uint256 _amount,bool _isFootball)",
	"event DraftBidPlaced(uint256  _bidId,address  _bidder,uint256  _duration,uint256 _amount,uint256 _points,uint256 _year,bool _isFootball)",
	"event DraftBidIncreased(uint256  _bidId,address  _bidder,uint256  _duration,uint256 _amountAdded,uint256 _points,uint256 _year,bool _isFootball)",
	"event ClaimingRequirementsSet(uint256  _tokenId,uint256  _year,bool  _isFootball, uint256 _amount)"
];

export class DraftControllerListeners {
	eventsDirectory: string;
	fieldName: string;
	chainId: number;
	rpcUrl: string = "";
	contractAddress: string = "";
	contract?: ethers.Contract;
	ethersProvider?: any;
	db?: admin.firestore.Firestore;

	constructor(chainId: number, eventsDirectory: string, isFootball: boolean) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
		this.fieldName = isFootball ? "draftControllerFootball" : "draftControllerBasketball";
	};

	async startListeners(db: admin.firestore.Firestore) {
		this.db = db;
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
						this.contract.on(this.contract.filters.DraftPickClaimed(), this._handleDraftPickClaimedEvent);
						this.contract.on(this.contract.filters.DraftResultsFinalized(), this._handleDraftResultsFinalizedEvent);
						this.contract.on(this.contract.filters.DraftTimeSet(), this._handleDraftTimeSetEvent);
						this.contract.on(this.contract.filters.DraftStakeClaimed(), this._handleDraftStakeClaimedEvent);
						this.contract.on(this.contract.filters.DraftBidPlaced(), this._handleDraftBidPlacedEvent);
						this.contract.on(this.contract.filters.DraftBidIncreased(), this._handleDraftBidIncreasedEvent);
						this.contract.on(this.contract.filters.ClaimingRequirementsSet(), this._handleClaimingRequirementsSetEvent);
					}
				}
			});
	}

	async _handleDraftPickClaimedEvent(log: ethers.EventLog) {
		const event = new DraftPickClaimed(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "draftPickClaimed", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY);
	}

	async _handleDraftResultsFinalizedEvent(log: ethers.EventLog) {
		const event = new DraftResultsFinalized(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "draftResultsFinalized", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY);
	}

	async _handleDraftTimeSetEvent(log: ethers.EventLog) {
		const event = new DraftTimeSet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "draftTimeSet", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}
	async _handleDraftStakeClaimedEvent(log: ethers.EventLog) {
		const event = new DraftStakeClaimed(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "draftStakeClaimed", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY);
	}
	async _handleDraftBidPlacedEvent(log: ethers.EventLog) {
		const event = new DraftBidPlaced(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "draftBidPlaced", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}
	async _handleDraftBidIncreasedEvent(log: ethers.EventLog) {
		const event = new DraftBidIncreased(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "draftBidIncreased", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}
	async _handleClaimingRequirementsSetEvent(log: ethers.EventLog) {
		const event = new ClaimingRequirementsSet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "claimingRequirementsSet", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY);
	}
}

export class DraftControllerListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, isFootball: boolean, db: admin.firestore.Firestore): DraftControllerListeners {
		const itemToReturn = new DraftControllerListeners(chainId, eventsDirectory, isFootball);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







