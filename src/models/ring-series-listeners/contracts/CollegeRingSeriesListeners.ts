import { TokenUriSet } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";

const EVENTS_ABI = [
	"event TokenUriSet(uint256 _tokenId, string _uri)"
];

export class CollegeRingSeriesListeners {
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
		this.db.collection(this.eventsDirectory).doc("ring")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.contractAddress = data.college;
					if (this?.contractAddress?.length > 0) {
						this.rpcUrl = data.rpcUrl;
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.TokenUriSet(), this._handleTokenUriSetEvent);
					}
				}
			});
	}

	async _handleTokenUriSetEvent(log: ethers.EventLog) {
		const event = new TokenUriSet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "tokenUriSet", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}
}

export class CollegeRingSeriesListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): CollegeRingSeriesListeners {
		const itemToReturn = new CollegeRingSeriesListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







