import { Erc20Transfer } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../utils/getEndpoint";
import { getEthersProvider } from '../../utils/getEthersProvider';
import { saveError } from "../../utils/saveError";
const EVENTS_ABI = [
	"event Transfer(address from, address to, uint256 value)"
];
export class ERC20Listeners {
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
		this.db.collection(this.eventsDirectory).doc("erc20")
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
		contract.on(contract.filters.Transfer(), (from, to, value, eventObject) => this._handleTransferEvent(eventObject));
	}
	_handleTransferEvent = async (log: ethers.Event) => {
		const event = new Erc20Transfer(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "erc20Transfer", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in ERC20Listeners._handleTransferEvent",
				"result": result.response.data,
				"endpoint": endpoint,
				"txHash": log.transactionHash,
				"blockNumber": log.blockNumber,
				"chainId": this.chainId,
				"contractAddress": log.address,
			}
			await saveError(errorData, this.db);
		}
	}

}

export class ERC20ListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): ERC20Listeners {
		const itemToReturn = new ERC20Listeners(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







