import Centrifuge from "centrifuge";
import {call} from "./api";

export const centrifugo = new Centrifuge(`ws://${document.location.host}/connection/websocket`, {
	subscribeEndpoint: '/api/getSubscription'
});

export const connect = async () => {
	const centrifugoToken = await call('/api/getCentrifugoToken');
	centrifugo.setToken(centrifugoToken);
	centrifugo.connect();
}

centrifugo.on('connect', () => {
	document.getElementById('app-online-status').textContent = 'online';
});
centrifugo.on('disconnect', () => {
	document.getElementById('app-online-status').textContent = 'offline';
});

