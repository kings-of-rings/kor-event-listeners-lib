import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEthersProvider } from "../../../utils/getEthersProvider";

const EVENTS_ABI = [
	"event CollegeAdded(uint256 _collegeId,string _name,string _conference,string _mascot, uint16 _tier, uint16 _royalty)",
	"event CollegeChanged(uint256 _collegeId,string _name,string _conference,string _mascot, uint16 _royalty)",
	"event TierChanged(uint256 _collegeId, uint256 _tier)",
];

export class CollegeRegistryListeners {
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
		db.collection(this.eventsDirectory).doc("registry")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.contractAddress = data.college;
					if (this.contractAddress?.length > 0) {
					this.rpcUrl = data.rpcUrl;
					this.ethersProvider = getEthersProvider(this.rpcUrl);
					this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
					this.contract.on(this.contract.filters.CollegeAdded(), this._handleCollegeAddedEvent);
					this.contract.on(this.contract.filters.CollegeChanged(), this._handleCollegeChangedEvent);
					this.contract.on(this.contract.filters.TierChanged(), this._handleCollegeChangedEvent);
				}}
			});
	}

	_handleCollegeAddedEvent(log: ethers.EventLog) {
		console.log(" Added", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}

	_handleCollegeChangedEvent(log: ethers.EventLog) {
		console.log("Changed", log);
	}

	_handleTierChangedEvent(log: ethers.EventLog) {
		console.log("Tier Changed", log);
	}

}

export class CollegeRegistryListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): CollegeRegistryListeners {
		const itemToReturn = new CollegeRegistryListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







