import { BurnAuctionTimeSet, BurnBidIncreased, BurnBidPlaced } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
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
	ethersProvider?: any;
	db: admin.firestore.Firestore;

	constructor(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
		this.db = db;
		// Bind this to the event handlers
		this._handleBurnBidPlacedEvent = this._handleBurnBidPlacedEvent.bind(this);
		this._handleBurnBidIncreasedEvent = this._handleBurnBidIncreasedEvent.bind(this);
		this._handleBurnAuctionTimeSetEvent = this._handleBurnAuctionTimeSetEvent.bind(this);
		this._handleRemoveBidEvent = this._handleRemoveBidEvent.bind(this);
	};

	async startListeners() {
		this._setListeners();
	}

	_setListeners() {
		this.db.collection(this.eventsDirectory).doc("collectible")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				this.contractAddress = data.burnAuction;
				if (this.contractAddress?.length > 0) {
					this.rpcUrl = data.rpcUrl;
					this.ethersProvider = getEthersProvider(this.rpcUrl);
					this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
					this.contract.on(this.contract.filters.BurnBidPlaced(), (_bidId, _bidder, _tokenId, _increasedAmount, _totalBid, _year, _isFootball, eventObject) => this._handleBurnBidPlacedEvent(eventObject));
					this.contract.on(this.contract.filters.BurnBidIncreased(), (_bidId, _bidder, _tokenId, _bidAmount, _bidCount, _year, _isFootball, eventObject) => this._handleBurnBidIncreasedEvent(eventObject));
					this.contract.on(this.contract.filters.BurnAuctionTimeSet(), (_year, _isFootball, _start, _end, eventObject) => this._handleBurnAuctionTimeSetEvent(eventObject));
					this.contract.on(this.contract.filters.RemoveBid(), (_bidId, _bidder, _tokenId, _bidAmount, _year, _isFootball, eventObject) => this._handleRemoveBidEvent(eventObject));
				}
			});
	}

	async _handleBurnBidPlacedEvent(log: ethers.Event) {
		const event = new BurnBidPlaced(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "burnBidPlaced", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}
	async _handleBurnBidIncreasedEvent(log: ethers.Event) {
		const event = new BurnBidIncreased(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "burnBidIncreased", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}
	async _handleBurnAuctionTimeSetEvent(log: ethers.Event) {
		const event = new BurnAuctionTimeSet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "burnAuctionTimeSet", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY);
	}
	async _handleRemoveBidEvent(log: ethers.Event) {
		//console.log("Event", log);
	}
}

export class CollegeBurnAuctionListenerFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): CollegeBurnAuctionListener {
		const itemToReturn = new CollegeBurnAuctionListener(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







