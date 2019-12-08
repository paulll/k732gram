import {createMessageElement} from './messageElement';

export const createChatHistoryElement = (self, id, title) => {
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
			const message = createMessageElement(incoming, msg);
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
		},
		setMid: (messageBinding, mid) => {
			messages.set(mid, messageBinding);
			messageBinding.message.id = mid;
		}
	}
}