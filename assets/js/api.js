const delay = t => new Promise(f => setTimeout(f, t));

export const call = async (method, params=null) => {
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