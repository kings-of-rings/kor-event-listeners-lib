import { AthletePaymentDisbursed, AthletePaymentReceived } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";
import { saveError } from "../../../utils/saveError";

const EVENTS_ABI = [
	"event PaymentReceived(uint256 indexed _paymentId,uint256 indexed _athleteId,address indexed _paymentToken,uint256 _amount,uint256 _balance)",
	"event PaymentDisbursed(uint256 indexed _disbursementId,uint256 indexed _athleteId,address indexed _paymentToken,address _disbursementAddress,uint256 _amount)",
];

export class AthletePaymentManagerListeners {
	eventsDirectory: string;
	docName: string = "athletePaymentManager";
	chainId: number;
	rpcUrl: string = "";
	contractAddress: string = "";
	contract?: ethers.Contract;
	ethersProvider?: any;
	db: admin.firestore.Firestore;
	isRunning: boolean = false;

	constructor(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
		this.db = db;
		// Bind this to the event handlers
		this._handleAthletePaymentReceivedEvent = this._handleAthletePaymentReceivedEvent.bind(this);
		this._handleAthletePaymentDisbursedEvent = this._handleAthletePaymentDisbursedEvent.bind(this);
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
						this.isRunning = false;

						return;
					} else if (!this.isRunning) {
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.PaymentReceived(), (_paymentId, _athleteId, _paymentToken, _amount, _balance, eventObject) => this._handleAthletePaymentReceivedEvent(eventObject));
						this.contract.on(this.contract.filters.PaymentDisbursed(), (_disbursementId, _athleteId, _paymentToken, _disbursementAddress, _amount, eventObject) => this._handleAthletePaymentDisbursedEvent(eventObject));
						this.isRunning = true;
					}
				}
			});
	}

	async _handleAthletePaymentReceivedEvent(log: ethers.Event) {
		const event = new AthletePaymentReceived(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athletePaymentReceived", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in AthletePaymentReceived.saveData",
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

	async _handleAthletePaymentDisbursedEvent(log: ethers.Event) {
		const event = new AthletePaymentDisbursed(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athletePaymentDisbursed", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in AthletePaymentDisbursed.saveData",
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

export class AthletePaymentManagerListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): AthletePaymentManagerListeners {
		const itemToReturn = new AthletePaymentManagerListeners(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







