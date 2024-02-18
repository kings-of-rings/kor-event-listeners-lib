import * as admin from "firebase-admin";
import { CollegeRingSeriesListeners, CollegeRingSeriesListenersFactory } from "./contracts/CollegeRingSeriesListeners";
import { ProRingSeriesListeners, ProRingSeriesListenersFactory } from "./contracts/ProRingSeriesListeners";
import { RingSeriesManagerListeners, RingSeriesManagerListenersFactory } from "./contracts/RingSeriesManagerListeners";

export class RingSeriesListeners {
	chainId: number;
	eventsDirectory: string;
	collegeListeners?: CollegeRingSeriesListeners;
	proListeners?: ProRingSeriesListeners;
	managerListeners?: RingSeriesManagerListeners;

	constructor(chainId: number, eventsDirectory: string) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
	};

	async startListeners(db: admin.firestore.Firestore) {
		this.collegeListeners = CollegeRingSeriesListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.proListeners = ProRingSeriesListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.managerListeners = RingSeriesManagerListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
	}
}

export class RingSeriesListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): RingSeriesListeners {
		const itemToReturn = new RingSeriesListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







