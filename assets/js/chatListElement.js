export const createChatListElement = (id, title) => {
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