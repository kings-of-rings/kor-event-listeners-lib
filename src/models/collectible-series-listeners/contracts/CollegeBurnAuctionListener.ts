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
	ethersProvider?: ethers.JsonRpcProvider | ethers.WebSocketProvider;
	db?: admin.firestore.Firestore;

	constructor(chainId: number, eventsDirectory: string) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
	};

	async startListeners(db: admin.firestore.Firestore) {
		this.db = db;
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
					this.contract.on(this.contract.filters.BurnBidPlaced(), this._handleBurnBidPlacedEvent);
					this.contract.on(this.contract.filters.BurnBidIncreased(), this._handleBurnBidIncreasedEvent);
					this.contract.on(this.contract.filters.BurnAuctionTimeSet(), this._handleBurnAuctionTimeSetEvent);
					this.contract.on(this.contract.filters.RemoveBid(), this._handleRemoveBidEvent);
				}
			});
	}

	async _handleBurnBidPlacedEvent(log: ethers.EventLog) {
		const event = new BurnBidPlaced(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "burnBidPlaced", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}
	async _handleBurnBidIncreasedEvent(log: ethers.EventLog) {
		const event = new BurnBidIncreased(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "burnBidIncreased", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}
	async _handleBurnAuctionTimeSetEvent(log: ethers.EventLog) {
		const event = new BurnAuctionTimeSet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "burnAuctionTimeSet", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY);
	}
	async _handleRemoveBidEvent(log: ethers.EventLog) {
		//console.log("Event", log);
	}
}

export class CollegeBurnAuctionListenerFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): CollegeBurnAuctionListener {
		const itemToReturn = new CollegeBurnAuctionListener(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







