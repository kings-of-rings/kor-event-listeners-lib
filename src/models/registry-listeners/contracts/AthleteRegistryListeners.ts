import { AthleteActiveYearAdded, AthleteAdded, AthleteCollegeChanged, AthleteIsSignedChanged, AthleteNameChanged, AthleteProTeamChanged } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";
import { saveError } from "../../../utils/saveError";

const EVENTS_ABI = [
	"event ActiveYearAdded(uint256 indexed _athleteId, uint16 indexed _year)",
	"event IsSignedChanged(uint256 indexed _athleteId, bool indexed _isSigned)",
	"event AthleteAdded(uint256 indexed _athleteId, bool indexed _isFootball, string _displayName, string _lastName, string _middleName, string _firstName)",
	"event AthleteNameChanged(uint256 indexed _athleteId,string _displayName,string _lastName,string _middleName,string _firstName)",
	"event AthleteCollegeChanged(uint256 indexed _athleteId,uint256 indexed _collegeId,uint256 indexed _jerseyNumber,uint16 _position)",
	"event AthleteProTeamChanged(uint256 indexed _athleteId,uint256 indexed _proTeamId,uint256 indexed _jerseyNumber,uint16 _position)"
];

export class AthleteRegistryListeners {
	eventsDirectory: string;
	chainId: number;
	rpcUrl: string = "";
	contractAddress: string = "";
	contract?: ethers.Contract;
	ethersProvider?: any;
	db: admin.firestore.Firestore;

	constructor(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore) {
		console.log('AthleteRegistryListeners');
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
		this.db = db;
		// Bind this to the event handlers
		this._handleActiveYearAddedEvent = this._handleActiveYearAddedEvent.bind(this);
		this._handleIsSignedChangedEvent = this._handleIsSignedChangedEvent.bind(this);
		this._handleAthleteAddedEvent = this._handleAthleteAddedEvent.bind(this);
		this._handleAthleteNameChangedEvent = this._handleAthleteNameChangedEvent.bind(this);
		this._handleAthleteCollegeChangedEvent = this._handleAthleteCollegeChangedEvent.bind(this);
		this._handleAthleteProTeamChangedEvent = this._handleAthleteProTeamChangedEvent.bind(this);
	};

	async startListeners() {
		this._setListeners();
	}

	_setListeners() {
		this.db.collection(this.eventsDirectory).doc("registry")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.contractAddress = data.athlete;
					if (this.contractAddress?.length > 0) {
						this.rpcUrl = data.rpcUrl;
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.ActiveYearAdded(), (_athleteId, _year, eventObject) => this._handleActiveYearAddedEvent(eventObject));
						this.contract.on(this.contract.filters.IsSignedChanged(), (_athleteId, _isSigned, eventObject) => this._handleIsSignedChangedEvent(eventObject));
						this.contract.on(this.contract.filters.AthleteAdded(), (_athleteId, _isFootball, _displayName, _lastName, _middleName, _firstName, eventObject) => this._handleAthleteAddedEvent(eventObject));
						this.contract.on(this.contract.filters.AthleteNameChanged(), (_athleteId, _displayName, _lastName, _middleName, _firstName, eventObject) => this._handleAthleteNameChangedEvent(eventObject));
						this.contract.on(this.contract.filters.AthleteCollegeChanged(), (_athleteId, _collegeId, _jerseyNumber, _position, eventObject) => this._handleAthleteCollegeChangedEvent(eventObject));
						this.contract.on(this.contract.filters.AthleteProTeamChanged(), (_athleteId, _proTeamId, _jerseyNumber, _position, eventObject) => this._handleAthleteProTeamChangedEvent(eventObject));
					}
				}
			});
	}

	async _handleActiveYearAddedEvent(log: ethers.Event) {
		const event = new AthleteActiveYearAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athleteActiveYearAdded", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in AthleteActiveYearAdded.saveData",
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

	async _handleIsSignedChangedEvent(log: ethers.Event) {
		const event = new AthleteIsSignedChanged(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athleteIsSignedChanged", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in AthleteIsSignedChanged.saveData",
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

	async _handleAthleteAddedEvent(log: ethers.Event) {
		console.log('AthleteAdded ', log);
		const event = new AthleteAdded(log, this.chainId);
		console.log('eventevent ', event);
		const endpoint = await getEndpoint(this.eventsDirectory, "athleteAdded", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in	_handleAthleteAddedEvent.saveData",
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

	async _handleAthleteNameChangedEvent(log: ethers.Event) {
		const event = new AthleteNameChanged(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athleteNameChanged", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in AthleteNameChanged.saveData",
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

	async _handleAthleteCollegeChangedEvent(log: ethers.Event) {
		console.log('Athlete College Changed ', log);
		const event = new AthleteCollegeChanged(log, this.chainId);
		console.log('event ', event);
		const endpoint = await getEndpoint(this.eventsDirectory, "athleteCollegeChanged", this.db);
		console.log('endpoint ', endpoint);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		console.log('result ', result);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in AthleteCollegeChanged.saveData",
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


	async _handleAthleteProTeamChangedEvent(log: ethers.Event) {
		const event = new AthleteProTeamChanged(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athleteProTeamChanged", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in AthleteProTeamChanged.saveData",
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

export class AthleteRegistryListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): AthleteRegistryListeners {
		const itemToReturn = new AthleteRegistryListeners(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







