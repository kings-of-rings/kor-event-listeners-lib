import { TeamStakeAdded, TeamStakeClaimed, TeamStakingTimeSet } from "@kings-of-rings/kor-contract-event-data-models/lib";
import { ethers } from "ethers";
import * as admin from "firebase-admin";
import { getEndpoint } from "../../../utils/getEndpoint";
import { getEthersProvider } from "../../../utils/getEthersProvider";
import { saveError } from "../../../utils/saveError";

const EVENTS_ABI = [
	"event StakeAdded(uint256 indexed _stakeId,address indexed _staker,uint256 indexed _collegeId,uint256 _amount,uint16 _year,bool _isNatty,bool _increase)",
	"event StakeClaimed(uint256 indexed _stakeId,address indexed _staker,uint256 indexed _collegeId,uint256 _amount,uint16 _year,bool _isNatty)",
	"event StakingTimeSet(uint256 _stakingOpens,uint256 _stakingCloses,uint256 _claimableTs,uint16 _year,bool _isNatty)"
];

export class TeamStakingListeners {
	eventsDirectory: string;
	fieldName: string;
	chainId: number;
	rpcUrl: string = "";
	contractAddress: string = "";
	contract?: ethers.Contract;
	ethersProvider?: any;
	db: admin.firestore.Firestore;

	constructor(chainId: number, eventsDirectory: string, isNatty: boolean, isCurrentYear: boolean, db: admin.firestore.Firestore) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
		const prefix = isNatty ? "natty" : "team";
		const suffix = isCurrentYear ? "Current" : "Previous";
		this.fieldName = `${prefix}Staking${suffix}`;

		this.db = db;
		// Bind this to the event handlers
		this._handleStakeAddedEvent = this._handleStakeAddedEvent.bind(this);
		this._handleStakeClaimedEvent = this._handleStakeClaimedEvent.bind(this);
		this._handleStakingTimeSetEvent = this._handleStakingTimeSetEvent.bind(this);
	};

	async startListeners() {
		this._setListeners();
	}

	_setListeners() {
		this.db.collection(this.eventsDirectory).doc("nil")
			.onSnapshot((doc) => {
				const data: Record<string, any> | undefined = doc.data();
				if (data) {
					this.contractAddress = data[this.fieldName];
					if (this.contractAddress?.length > 0) {
						this.rpcUrl = data.rpcUrl;
						this.ethersProvider = getEthersProvider(this.rpcUrl);
						this.contract = new ethers.Contract(this.contractAddress, EVENTS_ABI, this.ethersProvider);
						this.contract.on(this.contract.filters.StakeAdded(), (_stakeId, _staker, _collegeId, _amount, _year, _isNatty, _increase, eventObject) => this._handleStakeAddedEvent(eventObject));
						this.contract.on(this.contract.filters.StakeClaimed(), (_stakeId, _staker, _collegeId, _amount, _year, _isNatty, eventObject) => this._handleStakeClaimedEvent(eventObject));
						this.contract.on(this.contract.filters.StakingTimeSet(), (_stakingOpens, _stakingCloses, _claimableTs, _year, _isNatty, eventObject) => this._handleStakingTimeSetEvent(eventObject));
					}
				}
			});
	}

	async _handleStakeAddedEvent(log: ethers.Event) {
		const event = new TeamStakeAdded(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "teamStakeAdded", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey, this.ethersProvider);
		
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in HandleStakeAddedEvent.saveData",
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

	async _handleStakeClaimedEvent(log: ethers.Event) {
		const event = new TeamStakeClaimed(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "teamStakeClaimed", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in HandleStakeClaimedEvent.saveData",
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

	async _handleStakingTimeSetEvent(log: ethers.Event) {
		const event = new TeamStakingTimeSet(log, this.chainId);
		const endpoint = await getEndpoint(this.eventsDirectory, "teamStakeTimeSet", this.db);
		const apiKey = process.env.LAMBDA_API_KEY ? process.env.LAMBDA_API_KEY : "";
		const result: any = await event.saveData(endpoint, apiKey);
		if (result.status === undefined) {
			const errorData = {
				"error": "Error in HandleStakingTimeSetEvent.saveData",
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

export class TeamStakingListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, isNatty: boolean, isCurrentYear: boolean, db: admin.firestore.Firestore): TeamStakingListeners {
		const itemToReturn = new TeamStakingListeners(chainId, eventsDirectory, isNatty, isCurrentYear, db);
		itemToReturn.startListeners();
		return itemToReturn;
	}
}







