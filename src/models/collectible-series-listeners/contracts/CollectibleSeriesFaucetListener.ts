import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEthersProvider } from "../../../utils/getEthersProvider";

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
				if (data && data.collectibleFaucet && data.collectibleFaucet.length > 0) {
					this.contractAddress = data.collectibleFaucet;
					this.rpcUrl = data.rpcUrl;
					this.ethersProvider = getEthersProvider(this.rpcUrl);
					this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
					this.contract.on(this.contract.filters.AccessCreditsAddress(), this._handleAccessCreditsAddressEvent);
					this.contract.on(this.contract.filters.AthletePriceSet(), this._handleAthletePriceSetEvent);
					this.contract.on(this.contract.filters.CollectibleFaucetTimeSet(), this._handleCollectibleFaucetTimeSetEvent);
					this.contract.on(this.contract.filters.LevelAdded(), this._handleLevelAddedEvent);
					this.contract.on(this.contract.filters.CollectibleFaucetSale(), this._handleCollectibleFaucetSaleEvent);
				}
			});
	}

	_handleAccessCreditsAddressEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}
	_handleAthletePriceSetEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}
	_handleCollectibleFaucetTimeSetEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}
	_handleLevelAddedEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}
	_handleCollectibleFaucetSaleEvent(log: ethers.EventLog) {
		console.log("Event", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}
}

export class CollectibleSeriesFaucetListenerFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): CollectibleSeriesFaucetListener {
		const itemToReturn = new CollectibleSeriesFaucetListener(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







