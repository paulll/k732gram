import Centrifuge from "centrifuge";
import moment from "moment";
import diff from "fast-array-diff";

const delay = t => new Promise(f => setTimeout(f, t));


const call = async (method, params=null) => {
	const data = new URLSearchParams();
	for (const k of Object.keys(params || {}))
	    data.append(k, params[k]);

	const form = !params ? {} : {
		method: 'post',
		body: data,
		headers: {
			'X-CSRFToken': getCookie('csrftoken')
		}
	}

	const retry = async (retries=0) => {
		try {
			const chatsResponse = await fetch(method, {credentials: 'include', ...form});
			return await chatsResponse.json();
		} catch (e) {
			if (!retries)
				throw e;
			await delay(3000);
			return await retry(--retries);
		} 
	}

	return await retry();
}

const createChatMessage = (incoming, msg) => {
	if (msg.type == 'userLeft' || msg.type == 'userJoined') {
		const root = document.createElement('div');
		root.className = 'message info';
		root.textContent = (msg.type == 'userLeft') 
			? `@${msg.author.username} покинул чат`
			: `@${msg.author.username} присоединился к чату`;
		return {
			element: root,
			message: msg,
			incoming,
			markNotLast: () => root.classList.remove('last'),
			markDelivered: () => {}
		}
	}

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
			for (let user of msg.read) {
				const line = document.createElement('div');
				line.textContent = `@${user.username}`;
				readbyList.appendChild(line);
			}
			if (msg.read.length)
				readbyList.style.opacity = '1';
		}

		readstate.onmouseleave = () => {
			readbyList.style.opacity = '0';
		}
	}

	root.className = `message last ${incoming ? 'incoming' : 'outgoing'}`;
	body.className = `body ${msg.type}`;
	meta.className = 'meta';
	date.className = 'date';
	capt.className = 'capt';

	capt.textContent = msg.text;
	date.textContent = moment(msg.date).format('LT');
	
	body.appendChild(capt);
	body.appendChild(meta);
	root.appendChild(body);

	return {
		element: root,
		message: msg,
		incoming,
		markNotLast: () => root.classList.remove('last'),
		markDelivered: () => meta.lastChild.classList.add('delivered')
	}
};

const createChatListEntry = (id, title) => {
	const root = document.createElement('div');
	const head = document.createElement('div');
	const icon = document.createElement('span');
	const name = document.createElement('span');
	const preview = document.createElement('div');
	const previewAuthor = document.createElement('span');
	const previewText = document.createElement('span');

	root.id = `chatlist-chat-${id}`;

	root.className = 'entry';
	head.className = 'head';
	icon.className = 'icon';
	name.className = 'name';
	preview.className = 'preview';
	previewAuthor.className = 'preview-author';
	previewText.className = 'preview-text';

	icon.textContent = '#';
	name.textContent = title;

	head.appendChild(icon);
	head.appendChild(name);

	preview.appendChild(previewAuthor);
	preview.appendChild(previewText);

	root.appendChild(head);
	root.appendChild(preview);

	return {
		element: root,
		setPreview: (author, text) => {
			previewAuthor.textContent = author;
			previewText.textContent = text;
		},
		onclick: (fn) => root.onclick = fn,
		select: () => {
			const current = document.querySelector('#chat-list .entry.selected');
			if (current) current.classList.remove('selected');
			root.classList.add('selected');
		}
	}
}

const createChatHistory = (self, id, title) => {
	const chatTitle = document.getElementById('chat-title');
	const chatStatus = document.getElementById('chat-status');
	const history = document.createElement('div');
	const historyStart = document.getElementById('history-start').outerHTML;
	const historyContainer = document.getElementById('chat-body');


	// unread delim
	const unreadMsg = document.createElement('div');
	unreadMsg.className = 'message info unread';
	unreadMsg.textContent = 'непрочитанные сообщения';

	const messages = new Map;
	const messagesList = [];

	history.id = 'history';
	history.innerHTML = historyStart;
	let lastMembersAmount = '██';

	const msgBlank = {markNotLast(){}};
	const lastMessageBySide = {
		true: msgBlank,
		false: msgBlank
	};

	let lastMessageWasIncoming = false;
	

	return {
		select: () => {
			chatTitle.textContent = `#${title}`;
			chatStatus.textContent = `${lastMembersAmount} участника(ов)`;
			historyContainer.removeChild(historyContainer.firstChild);
			historyContainer.appendChild(history);

			if (unreadMsg.parentNode)
				history.removeChild(unreadMsg);

			let firstUnread = messagesList.find(x => !x.message.read.some(y => y.id == self.id));
			if (firstUnread) 
				history.insertBefore(unreadMsg, firstUnread.element);
		},
		addMessage: (incoming, msg) => {
			const message = createChatMessage(incoming, msg);
			if (lastMessageWasIncoming == incoming)
				lastMessageBySide[incoming].markNotLast()
			else
				lastMessageBySide[lastMessageWasIncoming] = msgBlank;
			lastMessageWasIncoming = incoming;
			lastMessageBySide[incoming] = message;
			history.appendChild(message.element);

			messages.set(msg.id, message);
			messagesList.push(message);
			return message;
		},
		setStatus: (membersAmount) => {
			chatStatus.textContent = `${lastMembersAmount = membersAmount} участника(ов)`;
		},
		getPreview: () => {
			const msg = lastMessageBySide[lastMessageWasIncoming];
			return [
				!lastMessageWasIncoming ? 'Вы' : 
					msg.message ? msg.message.author.username : '',
				msg.message ? msg.message.text : ''	
			]
		},
		isActive: () => !!history.parentNode,
		markMessageReadBy: (mid, by) => {
			const message = messages.get(mid);
			if (!message) return;
			if (message.message.read.some(x=>x.id == by.id)) return;
			message.message.read.push(by);
		}
	}
}

const bindForm = (callback) => {
	const form = document.getElementById('form');
	form.onkeydown = e => {
		if (e.keyCode == 13 && !e.shiftKey) {
			setTimeout(() => {
				const val = form.value.trim();
				if (!val == '') {
					callback(val);
				}
				form.value = '';
			}, 0);
		}
	}
}


const createChat = async (self, centrifugo, chat) => {
	const chatList = document.getElementById('chat-list');
	const chatStatus = document.getElementById('chat-status');
	const chatMembersView = document.getElementById('chat-members-wrap');
	const chatMembersInput = document.getElementById('chat-member-input');
	const chatMembersList = document.getElementById('chat-member-list');
	const sentMessageByText = new Map;

	const listBinding = createChatListEntry(chat.id, chat.title);
	const histBinding = createChatHistory(self, chat.id, chat.title);

	const lastMessages = await call('/api/getChatHistory', {id: chat.id});
	for (let msg of lastMessages.reverse()) {
		chatList.insertBefore(listBinding.element, chatList.firstChild.nextSibling);
		const msgBinding = histBinding.addMessage(msg.author.id != self.id, msg)
		msgBinding.markDelivered();
	}

	centrifugo.subscribe(`$chat-${chat.id}`, async (msg) => {
		const event = msg.data.data;
		const type = msg.data.type;
		if (type == 'newMessage') {
			chatList.insertBefore(listBinding.element, chatList.firstChild.nextSibling);
			if (event.author.id == self.id) {
				const msgBinding = sentMessageByText.get(event.text);
				if (msgBinding) {
					msgBinding.markDelivered();
				} else {
					const msgBinding = histBinding.addMessage(false, event);
					msgBinding.markDelivered();	
				}
			} else {
				const msgBinding = histBinding.addMessage(true, event);
				msgBinding.markDelivered();
			}
			listBinding.setPreview(...histBinding.getPreview());
			if (histBinding.isActive()) {
				await call('/api/markAsRead', {
					chat: chat.id,
					id: event.id
				});
			}
		}
		if (type == 'readMessage') {
			for (let id of event.ids)
				histBinding.markMessageReadBy(id, event.by);
		}
	});

	listBinding.setPreview(...histBinding.getPreview());
	chatList.appendChild(listBinding.element);

	listBinding.onclick(async () => {
		listBinding.select();
		histBinding.select();
		histBinding.setStatus(chat.users.length);

		chatStatus.onclick = async () => {
			chatMembersView.classList.add('active');
			chatMembersInput.focus();

			const chatMembers = new Set(chat.users.map(x=>x.id));
			const allUsers = await call('/api/getUsers');
			let lastUsers = [];

			const displayUsers = (userList) => {
				const changes = diff.getPatch(lastUsers, userList);
				lastUsers = userList;

				for (let change of changes) {
					if (change.type == 'remove') 
						for (let user of change.items)
							chatMembersList.removeChild(document.getElementById(`chat-member-list-u${user.id}`));
					else if (change.type == 'add') {
						for (let user of change.items) {
							const userEl = document.createElement('div');
							userEl.id = `chat-member-list-u${user.id}`;
							userEl.textContent = user.username;
							userEl.className = chatMembers.has(user.id) ? 'member' : '';
							chatMembersList.appendChild(userEl);

							userEl.onclick = () => {
								userEl.classList.toggle('member');
								if (chatMembers.has(user.id))
									chatMembers.delete(user.id)
								else 
									chatMembers.add(user.id);
							}
						}
					}
				}
			}

			displayUsers(allUsers);
			chatMembersInput.onkeydown = async (event) => {
				if (event.keyCode == 27 || event.keyCode == 13) {
					chatMembersView.classList.remove('active');
					chatMembersInput.blur();
				}
				if (event.keyCode == 13) { // enter
					const added = allUsers.filter(x=>chatMembers.has(x.id) && !chat.users.some(y => y.id == x.id));
					const removed = chat.users.filter(x => !chatMembers.has(x.id));
					chatMembersList.innerHTML = '';
					for (let {id} of added)
						await call('/api/addChatMember', {chat: chat.id, id});
					for (let {id} of removed)
						await call('/api/rmChatMember', {chat: chat.id, id});

					chat.users = allUsers.filter(x=>chatMembers.has(x.id));
				}
				setTimeout(() => {
					displayUsers(allUsers.filter(x => x.username.startsWith(chatMembersInput.value)));
				}, 5);
			}
		}

		bindForm(async (text) => {
			const d = new Date;
			const pad = (x) => ("0" + x).substr(-2); 
			chatList.insertBefore(listBinding.element, chatList.firstChild.nextSibling)
			const msgBinding = histBinding.addMessage(false, {
				text, 
				type: 'text', 
				date: Date.now(),
				read: [],
			});
			sentMessageByText.set(text, msgBinding);
			await call('/api/sendText', {
				text,
				type: 'text',
				chat: chat.id
			});
		});

		// mark last message as read
		await call('/api/markAsRead', {
			chat: chat.id,
			id: lastMessages[lastMessages.length - 1].id
		});
	});
}

// debug! todo
window.call = call;


// main
(async () => {
	
	// @todo parallel requests
	const chats = await call('/api/getChats');
	const chatList = document.getElementById('chat-list');
	const centrifugoToken = await call('/api/getCentrifugoToken');
	const self = await call('/api/getSelf');
	
	const centrifugo = new Centrifuge(`ws://${document.location.host}/connection/websocket`, {
		subscribeEndpoint: '/api/getSubscription'
	});
	centrifugo.setToken(centrifugoToken);
	
	window.centrifugo = centrifugo;

	//chatList.innerHTML = '';
	const promises = [];
	for (let chat of chats)
		promises.push(createChat(self, centrifugo, chat))
	await Promise.all(promises);


	centrifugo.connect();
	centrifugo.on('connect', () => {
		document.getElementById('app-online-status').textContent = 'online';
	});
	centrifugo.on('disconnect', () => {
		document.getElementById('app-online-status').textContent = 'offline';
	});

	// mark user
	const currentUserEl = document.getElementById('currentuser');
	currentUserEl.textContent = self.username;
	currentUserEl.onclick = () => {
		document.location.href = '..';
	}

	// create-chat
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
				await createChat(self, centrifugo, chat);
			}
		}

		document.addEventListener('keydown', listener);
	}

	// readby-list
	const readbyList = document.getElementById('readby-list');
	document.body.onmousemove = (e) => {
		readbyList.style.transform = `translate3d(${e.pageX}px, ${e.pageY}px, 0) translateY(-100%) translate(2px, -2px)`;
	}
})();

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}