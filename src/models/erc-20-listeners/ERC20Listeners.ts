import { Erc20Transfer } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../utils/getEndpoint";
import { getEthersProvider } from '../../utils/getEthersProvider';
const EVENTS_ABI = [
	"event Transfer(address from, address to, uint256 value)"
];
export class ERC20Listeners {
	chainId: number;
	eventsDirectory: string;
	rpcUrl: string = "";
	contractAddresses: string[] = [];
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
		this.db.collection(this.eventsDirectory).doc("erc20")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.rpcUrl = data.rpcUrl;
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
		contract.on(contract.filters.Transfer(), this._handleTransferEvent);
	}
	_handleTransferEvent = async (log: ethers.Log) => {
		const event = new Erc20Transfer(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "erc20Transfer", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}

}

export class ERC20ListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): ERC20Listeners {
		const itemToReturn = new ERC20Listeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







