import * as admin from "firebase-admin";
import { AthletePaymentManagerListeners, AthletePaymentManagerListenersFactory } from "./contracts/AthletePaymentManagerListeners";
import { AthleteRegistryListeners, AthleteRegistryListenersFactory } from "./contracts/AthleteRegistryListeners";
import { CollegeRegistryListeners, CollegeRegistryListenersFactory } from "./contracts/CollegeRegistryListeners";
import { DirectoryListeners, DirectoryListenersFactory } from "./contracts/DirectoryListeners";
import { ProRegistryListeners, ProRegistryListenersFactory } from "./contracts/ProRegistryListeners";

export class RegistryListeners {
	chainId: number;
	eventsDirectory: string;
	athleteRegistry?: AthleteRegistryListeners;
	collegeRegistry?: CollegeRegistryListeners;
	directory?: DirectoryListeners;
	proRegistry?: ProRegistryListeners;
	paymentManager?: AthletePaymentManagerListeners;


	constructor(chainId: number, eventsDirectory: string) {
		this.chainId = chainId;
		this.eventsDirectory = eventsDirectory;
	};

	async startListeners(db: admin.firestore.Firestore) {
		this.athleteRegistry = AthleteRegistryListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.collegeRegistry = CollegeRegistryListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.directory = DirectoryListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.proRegistry = ProRegistryListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
		this.paymentManager = AthletePaymentManagerListenersFactory.startListeners(this.chainId, this.eventsDirectory, db);
	}
}

export class RegistryListenersFactory {
	static startListeners(chainId: number, eventsDirectory: string, db: admin.firestore.Firestore): RegistryListeners {
		const itemToReturn = new RegistryListeners(chainId, eventsDirectory);
		itemToReturn.startListeners(db);
		return itemToReturn;
	}
}







