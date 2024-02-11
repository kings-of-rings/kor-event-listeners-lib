import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEthersProvider } from '../../utils/getEthersProvider';
const EVENTS_ABI = [
	"event TransferSingle(address operator, address from, address to, uint256 id, uint256 value)"
];
export class ERC1155Listeners {
	chainId: number;
	eventsDirectory: string;
	rpcUrl: string = "";
	contractAddresses: string[] = [];
	ethersProvider?: ethers.JsonRpcProvider | ethers.WebSocketProvider;
	constructor(chainId: number, eventsDirectory: string) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
	};

	async startListeners(db: admin.firestore.Firestore) {
		this._setListeners(db);
	}

	_setListeners(db: admin.firestore.Firestore) {
		db.collection(this.eventsDirectory).doc("erc1155")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.rpcUrl = data.rpcUrl;
					this._setContractAddresses(data.contracts);
					this.ethersProvider = getEthersProvider(this.rpcUrl);
					this._setContractListeners(db);
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
			this._setContractListener(address, db);
		});
	}
	_setContractListener(contractAddress: string, db: admin.firestore.Firestore) {
		const contract = new ethers.Contract(contractAddress, EVENTS_ABI, this.ethersProvider);
		contract.on(contract.filters.TransferSingle(), this._handleTransferSingleEvent);
	}

	_handleTransferSingleEvent = async (log: ethers.Log) => {
		console.log("TransferSingle event", log);
	}

}

export class ERC1155ListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): ERC1155Listeners {
		const itemToReturn = new ERC1155Listeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







