import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEthersProvider } from "../../../utils/getEthersProvider";

const EVENTS_ABI = [
	"event BurnBidIncreased(uint256 _bidId,address _bidder,uint256 _tokenId,uint256 _increasedAmount,uint256 _totalBid, uint16 _year,bool _isFootball)",
	"event BurnBidPlaced(uint256 _bidId,address _bidder,uint256 _tokenId,uint256 _bidAmount,uint256 _bidCount,uint16 _year,bool _isFootball)",
	"event BurnAuctionTimeSet(uint16 _year, bool _isFootball, uint256 _start, uint256 _end)",
	"event RemoveBid(uint256 _bidId,address _bidder,uint256 _tokenId,uint256 _bidAmount,uint256 _year,bool _isFootball)"
];

export class CollegeBurnAuctionListener {
	eventsDirectory: string;
	chainId: number;
	rpcUrl: string = "";
	contractAddress: string = "";
	contract?: ethers.Contract;
	ethersProvider?: ethers.JsonRpcProvider | ethers.WebSocketProvider;

	constructor(chainId: number, eventsDirectory: string) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
	};

	async startListeners(db: admin.firestore.Firestore) {
		this._setListeners(db);
	}

	_setListeners(db: admin.firestore.Firestore) {
		db.collection(this.eventsDirectory).doc("collectible")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				this.contractAddress = data.burnAuction;
				if (this.contractAddress.length > 0) {
					this.rpcUrl = data.rpcUrl;
					this.ethersProvider = getEthersProvider(this.rpcUrl);
					this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
					this.contract.on(this.contract.filters.BurnBidPlaced(), this._handleBurnBidPlacedEvent);
					this.contract.on(this.contract.filters.BurnBidIncreased(), this._handleBurnBidIncreasedEvent);
					this.contract.on(this.contract.filters.BurnAuctionTimeSet(), this._handleBurnAuctionTimeSetEvent);
					this.contract.on(this.contract.filters.RemoveBid(), this._handleRemoveBidEvent);
				}
			});
	}

	_handleBurnBidPlacedEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}
	_handleBurnBidIncreasedEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}
	_handleBurnAuctionTimeSetEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}
	_handleRemoveBidEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}
}

export class CollegeBurnAuctionListenerFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): CollegeBurnAuctionListener {
		const itemToReturn = new CollegeBurnAuctionListener(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







