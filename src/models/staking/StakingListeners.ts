import * as admin from "firebase-admin";
import { TeamStakingListeners, TeamStakingListenersFactory } from "./contracts/TeamStakingListeners";

export class StakingListeners {
	chainId: number;
	eventsDirectory: string;
	teamStakingCurrent: TeamStakingListeners;
	nattyStakingCurrent: TeamStakingListeners;
	teamStakingPrevious: TeamStakingListeners;
	nattyStakingPrevious: TeamStakingListeners;

	constructor(chainId: number, eventsDirectory: string) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
	};

	async startListeners(db: admin.firestore.Firestore) {
		this.teamStakingCurrent = TeamStakingListenersFactory.startListeners(this.chainId, this.eventsDirectory, false, true, db);
		this.nattyStakingCurrent = TeamStakingListenersFactory.startListeners(this.chainId, this.eventsDirectory, true, true, db);
		this.teamStakingPrevious = TeamStakingListenersFactory.startListeners(this.chainId, this.eventsDirectory, false, false, db);
		this.nattyStakingPrevious = TeamStakingListenersFactory.startListeners(this.chainId, this.eventsDirectory, true, false, db);
	}
}

export class StakingListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): StakingListeners {
		const itemToReturn = new StakingListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







