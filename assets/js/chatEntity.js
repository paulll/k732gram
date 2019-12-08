import {centrifugo} from './centrifugo';
import {call} from './api';
import {bindChatInputForm} from './bindChatInputForm';
import {createChatHistoryElement} from './chatHistoryElement';
import {createChatListElement} from './chatListElement';
import {editChatMembers} from './chatMembers';

export const createChatEntity = async (self, chat) => {
	const chatList = document.getElementById('chat-list');
	const chatStatus = document.getElementById('chat-status');
	
	const sentMessageByText = new Map;
	const listBinding = createChatListElement(chat.id, chat.title);
	const histBinding = createChatHistoryElement(self, chat.id, chat.title);
	const messages = [];

	const addMessage = (message) => {
		messages.push(message);

		// todo: compare with last message date
		chatList.insertBefore(listBinding.element, chatList.firstChild.nextSibling);
		
		if (message.author.id == self.id) {
			const msgBinding = sentMessageByText.get(message.text);
			if (msgBinding) {
				histBinding.setMid(msgBinding, message.id);
				msgBinding.markDelivered();
			} else {
				const msgBinding = histBinding.addMessage(false, message);
				msgBinding.markDelivered();	
			}
		} else {
			const msgBinding = histBinding.addMessage(true, message);
			msgBinding.markDelivered();
		}

		listBinding.setPreview(...histBinding.getPreview());
	}

	for (let msg of (await call('/api/getChatHistory', {id: chat.id})).reverse())
		addMessage(msg);

	centrifugo.subscribe(`$chat-${chat.id}`, async (msg) => {
		const event = msg.data.data;
		const type = msg.data.type;
		if (type == 'newMessage') {
			addMessage(event);
			if (histBinding.isActive()) {
				await call('/api/markAsRead', {
					chat: chat.id,
					id: event.id
				});
			}
		}
		if (type == 'readMessage') 
			for (let id of event.ids)
				histBinding.markMessageReadBy(id, event.by);
	});

	listBinding.setPreview(...histBinding.getPreview());
	chatList.appendChild(listBinding.element);

	listBinding.onclick(async () => {
		listBinding.select();
		histBinding.select();
		histBinding.setStatus(chat.users.length);

		chatStatus.onclick = async () => {
			editChatMembers(chat);
		}

		bindChatInputForm(async (text) => {
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
			id: messages[messages.length - 1].id
		});
	});
}
