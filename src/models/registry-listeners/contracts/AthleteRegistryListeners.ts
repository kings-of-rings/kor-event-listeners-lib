import { AthleteActiveYearAdded, AthleteAdded, AthleteCollegeChanged, AthleteHighSchoolChanged, AthleteIsSignedChanged, AthleteNameChanged, AthleteProTeamChanged } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";

const EVENTS_ABI = [
	"event ActiveYearAdded(uint256  _athleteId, uint16  _year)",
	"event IsSignedChanged(uint256  _athleteId, bool  _isSigned)",
	"event AthleteAdded(uint256  _athleteId,bool  _isFootball,string  _displayName,string _lastName,string _middleName,string _firstName)",
	"event AthleteNameChanged(uint256  _athleteId,string  _displayName,string  _lastName,string _middleName,string _firstName)",
	"event AthleteCollegeChanged(uint256  _athleteId,uint256  _collegeId,uint256  _jerseyNumber,string _position)",
	"event AthleteHighSchoolChanged(uint256  _athleteId,uint256 _highSchoolId,uint256  _jerseyNumber,string _position,uint16 _year)",
	"event AthleteProTeamChanged(uint256  _athleteId,uint256  _proTeamId,uint256  _jerseyNumber,string _position)"
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
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
		this.db = db;
		// Bind this to the event handlers
		this._handleActiveYearAddedEvent = this._handleActiveYearAddedEvent.bind(this);
		this._handleIsSignedChangedEvent = this._handleIsSignedChangedEvent.bind(this);
		this._handleAthleteAddedEvent = this._handleAthleteAddedEvent.bind(this);
		this._handleAthleteNameChangedEvent = this._handleAthleteNameChangedEvent.bind(this);
		this._handleAthleteCollegeChangedEvent = this._handleAthleteCollegeChangedEvent.bind(this);
		this._handleAthleteHighSchoolChangedEvent = this._handleAthleteHighSchoolChangedEvent.bind(this);
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
					console.log("AthleteRegistryListeners", data);
					this.contractAddress = data.highSchool;
					if (this.contractAddress?.length > 0) {
						this.rpcUrl = data.rpcUrl;
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.ActiveYearAdded(), this._handleActiveYearAddedEvent);
						this.contract.on(this.contract.filters.IsSignedChanged(), this._handleIsSignedChangedEvent);
						this.contract.on(this.contract.filters.AthleteAdded(), this._handleAthleteAddedEvent);
						this.contract.on(this.contract.filters.AthleteNameChanged(), this._handleAthleteNameChangedEvent);
						this.contract.on(this.contract.filters.AthleteCollegeChanged(), this._handleAthleteCollegeChangedEvent);
						this.contract.on(this.contract.filters.AthleteHighSchoolChanged(), this._handleAthleteHighSchoolChangedEvent);
						this.contract.on(this.contract.filters.AthleteProTeamChanged(), this._handleAthleteProTeamChangedEvent);
					}
				}
			});
	}

	async _handleActiveYearAddedEvent(log: ethers.Event) {
		const event = new AthleteActiveYearAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athleteActiveYearAdded", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}

	async _handleIsSignedChangedEvent(log: ethers.Event) {
		const event = new AthleteIsSignedChanged(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athleteIsSignedChanged", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}

	async _handleAthleteAddedEvent(log: ethers.Event) {
		const event = new AthleteAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athleteAdded", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}

	async _handleAthleteNameChangedEvent(log: ethers.Event) {
		const event = new AthleteNameChanged(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athleteNameChanged", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}

	async _handleAthleteCollegeChangedEvent(log: ethers.Event) {
		const event = new AthleteCollegeChanged(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athleteCollegeChanged", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}

	async _handleAthleteHighSchoolChangedEvent(log: ethers.Event) {
		const event = new AthleteHighSchoolChanged(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athleteHighSchoolChanged", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}

	async _handleAthleteProTeamChangedEvent(log: ethers.Event) {
		const event = new AthleteProTeamChanged(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "athleteProTeamChanged", this.db);
		event.saveData(endpoint, process.env.LAMBDA_API_KEY, this.ethersProvider);
	}
}

export class AthleteRegistryListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): AthleteRegistryListeners {
		const itemToReturn = new AthleteRegistryListeners(chainId, eventsDirectory, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







