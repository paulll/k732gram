import diff from "fast-array-diff";

import {call} from './api';

const chatMembersView = document.getElementById('chat-members-wrap');
const chatMembersInput = document.getElementById('chat-member-input');
const chatMembersList = document.getElementById('chat-member-list');

export const focusChatMembersView = () => {
	chatMembersInput.focus();
};

export const closeChatMembersView = () => {
	chatMembersView.classList.remove('active');
	chatMembersInput.blur();
};

export const editChatMembers = async (chat) => {
	chatMembersView.classList.add('active');
	chatMembersInput.focus();

	// clear list
	while (chatMembersList.firstChild)
		chatMembersList.removeChild(chatMembersList.firstChild);

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
			if (chat.id < 0)
				return false;
			closeChatMembersView();
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