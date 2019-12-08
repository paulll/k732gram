import moment from "moment";

export const createMessageElement = (incoming, message) => {
	if (message.type == 'userLeft' || message.type == 'userJoined')
		return createInfoMessageElement(incoming, message);
	return createRegularMessageElement(incoming, message);
}

const createInfoMessageElement = (incoming, message) => {
	const root = document.createElement('div');
	root.className = 'message info';
	root.textContent = (message.type == 'userLeft') 
		? `@${message.author.username} покинул чат`
		: `@${message.author.username} присоединился к чату`;
	
	return {
		element: root,
		message,
		incoming,
		markNotLast: () => root.classList.remove('last'),
		markDelivered: () => {}
	}
}

const createRegularMessageElement = (incoming, message) => {
	const root = document.createElement('div');
	const body = document.createElement('div');
	const capt = document.createElement('div');
	const meta = document.createElement('div');
	const date = document.createElement('div');

	meta.appendChild(date);
	if (!incoming) {
		const readstate = document.createElement('div');
		const readbyList = document.getElementById('readby-list');
		readstate.className = 'readstate';
		meta.appendChild(readstate);

		readstate.onmouseenter = () => {
			readbyList.innerHTML = '';
			for (let user of message.read) {
				const line = document.createElement('div');
				line.textContent = `@${user.username}`;
				readbyList.appendChild(line);
			}
			if (message.read.length)
				readbyList.style.opacity = '1';
		}

		readstate.onmouseleave = () => {
			readbyList.style.opacity = '0';
		}
	}

	root.className = `message last ${incoming ? 'incoming' : 'outgoing'}`;
	body.className = `body ${message.type}`;
	meta.className = 'meta';
	date.className = 'date';
	capt.className = 'capt';

	capt.textContent = message.text;
	date.textContent = moment(message.date).format('LT');
	
	body.appendChild(capt);
	body.appendChild(meta);
	root.appendChild(body);

	return {
		element: root,
		message,
		incoming,
		markNotLast: () => root.classList.remove('last'),
		markDelivered: () => meta.lastChild.classList.add('delivered')
	}
}