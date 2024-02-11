import { ethers } from "ethers";
import * as admin from "firebase-admin";
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
	ethersProvider?: ethers.JsonRpcProvider | ethers.WebSocketProvider;

	constructor(chainId: number, eventsDirectory: string, isFootball: boolean) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
		this.fieldName = isFootball ? "draftControllerFootball" : "draftControllerBasketball";
	};

	async startListeners(db: admin.firestore.Firestore) {
		this._setListeners(db);
	}

	_setListeners(db: admin.firestore.Firestore) {
		db.collection(this.eventsDirectory).doc("collectible")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.contractAddress = data[this.fieldName];
					if (this.contractAddress.length > 0) {
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

	_handleDraftPickClaimedEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}

	_handleDraftResultsFinalizedEvent(log: ethers.EventLog) {
		console.log("Event", log);
	}

	_handleDraftTimeSetEvent(log: ethers.EventLog) {
		console.log("Event", log);
	}
	_handleDraftStakeClaimedEvent(log: ethers.EventLog) {
		console.log("Event", log);
	}
	_handleDraftBidPlacedEvent(log: ethers.EventLog) {
		console.log("Event", log);
	}
	_handleDraftBidIncreasedEvent(log: ethers.EventLog) {
		console.log("Event", log);
	}
	_handleClaimingRequirementsSetEvent(log: ethers.EventLog) {
		console.log("Event", log);
	}
}

export class DraftControllerListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, isFootball: boolean, db: admin.firestore.Firestore): DraftControllerListeners {
		const itemToReturn = new DraftControllerListeners(chainId, eventsDirectory, isFootball);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







