import { ethers } from "ethers"


export const getEthersProvider = (rpcURL: string): any => {
	if (rpcURL.startsWith("wss")) {
		return new ethers.WebSocketProvider(rpcURL);
	} else {
		return new ethers.JsonRpcProvider(rpcURL);
	}
}