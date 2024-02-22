import { Erc1155TransferSingle } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../utils/getEndpoint";
import { getEthersProvider } from '../../utils/getEthersProvider';
import { saveError } from "../../utils/saveError";
const EVENTS_ABI = [
	"event TransferSingle(address operator, address from, address to, uint256 id, uint256 value)"
];
export class ERC1155Listeners {
	chainId: number;
	eventsDirectory: string;
	rpcUrl: string = "";
	contractAddresses: string[] = [];
	ethersProvider?: any;
	db: admin.firestore.Firestore;
	isRunning: boolean = false;

	constructor(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
		this.db = db;
		// Bind this to the event handlers
		this._handleTransferSingleEvent = this._handleTransferSingleEvent.bind(this);
	};

	async startListeners() {
		this._setListeners();
	}

	_setListeners() {
		this.db.collection(this.eventsDirectory).doc("erc1155")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data && this.isRunning === false) {
					this.rpcUrl = data.listenerRpcUrl;
					this._setContractAddresses(data.contracts);
					this.ethersProvider = getEthersProvider(this.rpcUrl);
					this._setContractListeners(this.db);
					this.isRunning = true;
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

	_setContractListeners(db: admin.firestore.Firestore) {
		this.contractAddresses.forEach((address) => {
			this._setContractListener(address);
		});
	}
	_setContractListener(contractAddress: string) {
		const contract = new ethers.Contract(contractAddress, EVENTS_ABI, this.ethersProvider);
		contract.on(contract.filters.TransferSingle(), (operator, from, to, id, value, eventObject) => this._handleTransferSingleEvent(eventObject));
	}

	_handleTransferSingleEvent = async (log: ethers.Event) => {
		const event = new Erc1155TransferSingle(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "erc1155TransferSingle", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in ERC1155Listeners._handleTransferSingleEvent ",
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

export class ERC1155ListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): ERC1155Listeners {
		const itemToReturn = new ERC1155Listeners(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







