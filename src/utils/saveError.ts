
import * as admin from "firebase-admin";

export const saveError = async (errorData: any, db: admin.firestore.Firestore): Promise<unknown> => {
	const txHash: string = errorData.txHash;
	const errorRef = db.collection("errors").doc(txHash);
	return errorRef.set(errorData);
}