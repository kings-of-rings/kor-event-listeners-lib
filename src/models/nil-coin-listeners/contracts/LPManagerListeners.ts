import { NilAddLiquidityProcedure } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";
import { saveError } from "../../../utils/saveError";

const EVENTS_ABI = [
	"event NilAddLiquidityProcedure(uint256 _id, uint256 _stableLpAmount, uint256 _nilAmountBurned)"
];

export class LPManagerListeners {
	eventsDirectory: string;
	docName: string = "lpManager";
	chainId: number;
	rpcUrl: string = "";
	contractAddress: string = "";
	contract?: ethers.Contract;
	ethersProvider?: any;
	db: admin.firestore.Firestore;

	constructor(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
		this.db = db;
		// Bind this to the event handlers
		this._handleNilAddLiquidityProcedureEvent = this._handleNilAddLiquidityProcedureEvent.bind(this);

	};

	async startListeners() {
		this._setListeners();
	}

	_setListeners() {
		this.db.collection(this.eventsDirectory).doc("pollers").collection("contracts").doc(this.docName)
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data && data.contractAddress && data?.contractAddress?.length > 0) {
					this.contractAddress = data.contractAddress;
					this.rpcUrl = data.listenerRpcUrl;
					const paused = data.paused;
					if (paused) {
						if (this.contract) {
							this.contract.removeAllListeners();
						}
						return;
					} else {
						this.rpcUrl = data.listenerRpcUrl;
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.NilAddLiquidityProcedure(), (_id, _stableLpAmount, _nilAmountBurned, eventObject) => this._handleNilAddLiquidityProcedureEvent(eventObject));
					}
				}
			});
	}

	async _handleNilAddLiquidityProcedureEvent(log: ethers.Event) {
		const event = new NilAddLiquidityProcedure(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "nilLiquidityProcedure", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in LPManagerListeners._handleNilAddLiquidityProcedureEvent",
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

export class LPManagerListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): LPManagerListeners {
		const itemToReturn = new LPManagerListeners(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







