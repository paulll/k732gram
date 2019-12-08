export const bindChatInputForm = (callback) => {
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