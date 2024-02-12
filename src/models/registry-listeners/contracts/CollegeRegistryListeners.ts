import { CollegeAdded, CollegeChanged, TierChanged } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
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
		this.db.collection(this.eventsDirectory).doc("registry")
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
					}
				}
			});
	}

	async _handleCollegeAddedEvent(log: ethers.EventLog) {
		const event = new CollegeAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "collegeAdded", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}

	async _handleCollegeChangedEvent(log: ethers.EventLog) {
		const event = new CollegeChanged(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "collegeChanged", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}

	async _handleTierChangedEvent(log: ethers.EventLog) {
		const event = new TierChanged(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "collegeTierChanged", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}

}

export class CollegeRegistryListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): CollegeRegistryListeners {
		const itemToReturn = new CollegeRegistryListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







