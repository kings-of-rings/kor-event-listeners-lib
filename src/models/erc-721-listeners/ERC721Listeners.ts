import { Erc20Transfer } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../utils/getEndpoint";
import { getEthersProvider } from '../../utils/getEthersProvider';
const EVENTS_ABI = [
	"event Transfer(address from, address to, uint256 tokenId)"
];
export class ERC721Listeners {
	chainId: number;
	eventsDirectory: string;
	rpcUrl: string = "";
	contractAddresses: string[] = [];
	ethersProvider?: any;
	db: admin.firestore.Firestore;
	constructor(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
		this.db = db;
		// Bind this to the event handlers
		this._handleTransferEvent = this._handleTransferEvent.bind(this);

	};

	async startListeners() {
		this._setListeners();
	}

	_setListeners() {
		this.db.collection(this.eventsDirectory).doc("erc721")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.rpcUrl = data.listenerRpcUrl;
					this._setContractAddresses(data.contracts);
					this.ethersProvider = getEthersProvider(this.rpcUrl);
					this._setContractListeners();
				}
			});

	}

	_setContractAddresses(contracts: Record<string, string>[]) {
		const addresses: string[] = [];
		contracts.forEach((contract) => {
			addresses.push(contract.address);
		});
		this.contractAddresses = addresses;
	}

	_setContractListeners() {
		this.contractAddresses.forEach((address) => {
			this._setContractListener(address);
		});
	}
	_setContractListener(contractAddress: string) {
		const contract = new ethers.Contract(contractAddress, EVENTS_ABI, this.ethersProvider);
		contract.on(contract.filters.Transfer(), (from, to, tokenId, eventObject) => this._handleTransferEvent(eventObject));
	}

	_handleTransferEvent = async (log: ethers.Event) => {
		//const event = new Erc721Transfer(log, this.chainId);
		//const endpoint = await getEndpoint(this.eventsDirectory, "erc721Transfer", this.db);
		//event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}

}

export class ERC721ListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): ERC721Listeners {
		const itemToReturn = new ERC721Listeners(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







