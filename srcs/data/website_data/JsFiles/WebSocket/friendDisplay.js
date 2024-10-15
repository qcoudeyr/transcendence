import { getWebsocket } from "./websocket-open.js";

export function getFriendList()
{
	let socket = getWebsocket();
	socket.send(JSON.stringify(
		{
			'type': 'friend_list',
		}));
}