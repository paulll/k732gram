import {createChatEntity} from './chatEntity';
import {connect} from './centrifugo';
import {call} from './api';

const initSelfUser = async () => {
	const self = await call('/api/getSelf');
	const currentUserEl = document.getElementById('currentuser');
	currentUserEl.textContent = self.username;
	currentUserEl.onclick = () => {
		document.location.href = '..';
	}
	return self;
}

const initChats = async (self) => {
	const chats = await call('/api/getChats');
	const promises = [];
	for (let chat of chats)
		promises.push(createChatEntity(self, chat))
	await Promise.all(promises);
}

const bindCreateChat = (self) => {
	const btnCreateChat = document.getElementById('create-chat');
	const chatNameWrap = document.getElementById('chat-name-input-wrap');
	btnCreateChat.onclick = async () => {
		chatNameWrap.classList.add('active');
		chatNameWrap.firstChild.focus();

		const listener = async (e) => {
			if (event.keyCode == 27 || event.keyCode == 13) {
				chatNameWrap.classList.remove('active');
				document.removeEventListener('keydown', listener);
			}
			if (event.keyCode == 13) {
				const chat = await call('/api/createChat', {title: chatNameWrap.firstChild.value});
				await createChatEntity(self, chat);
			}
		}

		document.addEventListener('keydown', listener);
	}
}

// main
(async () => {
	// init centrifugo
	const centPromise = connect();

	// get self
	const self = await initSelfUser();

	// create-chat
	bindCreateChat(self);

	// init chats
	await Promise.all([
		initChats(self),
		centPromise,
	]);

	// readby-list
	const readbyList = document.getElementById('readby-list');
	document.body.onmousemove = (e) => {
		readbyList.style.transform = `translate3d(${e.pageX}px, ${e.pageY}px, 0) translateY(-100%) translate(2px, -2px)`;
	}
})();

