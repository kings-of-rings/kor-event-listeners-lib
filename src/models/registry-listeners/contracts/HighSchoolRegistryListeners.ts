import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEthersProvider } from "../../../utils/getEthersProvider";

const EVENTS_ABI = [
	"event NewHighSchoolAdded(uint256 _highSchoolId,string _name,string _state,string _city,string _mascot)",
	"event HighSchoolChanged(uint256 _highSchoolId,string _name,string _state,string _city,string _mascot)"
];

export class HighSchoolRegistryListeners {
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
					this.contractAddress = data.highSchool;
					if (this.contractAddress?.length > 0) {
					this.rpcUrl = data.rpcUrl;
					this.ethersProvider = getEthersProvider(this.rpcUrl);
					this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
					this.contract.on(this.contract.filters.NewHighSchoolAdded(), this._handleHighSchoolAddedEvent);
					this.contract.on(this.contract.filters.HighSchoolChanged(), this._handleHighSchoolChangedEvent);
				}}
			});
	}

	_handleHighSchoolAddedEvent(log: ethers.EventLog) {
		console.log("High School Added", log);
		//await SaveShuffleRequestEventFactory.fromEthersEvent(this.chainId, log, db, this.ethersProvider);
	}

	_handleHighSchoolChangedEvent(log: ethers.EventLog) {
		console.log("High School Changed", log);
	}

}

export class HighSchoolRegistryListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): HighSchoolRegistryListeners {
		const itemToReturn = new HighSchoolRegistryListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







