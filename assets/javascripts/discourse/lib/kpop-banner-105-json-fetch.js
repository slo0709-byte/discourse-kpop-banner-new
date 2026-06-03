const jsonRequestPromises = new Map();

export async function fetchJsonWithDedup(url) {
	const promiseKey = `json:${url}`;
	if (jsonRequestPromises.has(promiseKey)) {
		return jsonRequestPromises.get(promiseKey);
	}

	const promise = (async () => {
		const resp = await fetch(url, {
			headers: { accept: "application/json" },
			cache: "no-store",
		});
		if (!resp.ok) {
			return null;
		}
		return resp.json();
	})()
		.catch(() => null)
		.finally(() => {
			jsonRequestPromises.delete(promiseKey);
		});

	jsonRequestPromises.set(promiseKey, promise);
	return promise;
}
