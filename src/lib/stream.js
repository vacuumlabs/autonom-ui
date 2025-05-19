// Websocket (price)

import { get } from 'svelte/store'

import { prices, prices24h, productId, activeProducts } from './stores'

import { onNewPrice } from './chart'

import { setTitle, shortSymbol, showToast, hideToast } from './utils'

import { PRODUCTS } from './products'

let ws;
let h;
let subscribedProducts = {
	'ETH-USD': true
};

function heartbeat() {
	clearTimeout(h);
	h = setTimeout(() => {
		console.log('Terminating, reconnecting socket...');
		if (ws) ws.close(1000,"");
		initWebsocket();
	}, 15 * 1000);
}

setInterval(() => {
	// resubscribe if there is a diff between activeProducts and subscribedProducts
	let _activeProducts = get(activeProducts);
	// console.log('ap', _activeProducts, subscribedProducts);
	let diff = false;
	for (const p in _activeProducts) {
		if (!subscribedProducts[p]) {
			diff = true;
			break;
		}
	}
	for (const p in subscribedProducts) {
		if (!_activeProducts[p]) {
			diff = true;
			break;
		}
	}
	if (diff) {
		subscribedProducts = JSON.parse(JSON.stringify(_activeProducts));
		subscribeToProducts();
	}
}, 1000);

function subscribeToProducts() {

	let _activeProducts = get(activeProducts);

	// console.log('subscribeToProducts', _activeProducts);

	ws.send(JSON.stringify({
	    "type": "unsubscribe",
	    "channels": [
	    	"heartbeat",
	    	"ticker"
	    ]
	}));

	ws.send(JSON.stringify({
	    "type": "subscribe",
	    "product_ids": Object.keys(_activeProducts),
	    "channels": [
	    	"heartbeat",
	    	"ticker"
	    ]
	}));

}

let lastMessageReceived;
let s;

function getPrice(product_id) {
	const polygonTickerSymbol = PRODUCTS[product_id].polygonTickerSymbol;

	fetch(`https://api.polygon.io/v2/last/trade/${polygonTickerSymbol}?apiKey=${process.env.POLYGON_API_KEY}`)
	.then((res) => { return res.json() })
	.then((json) => {
		lastMessageReceived = Date.now();

		const {p: price, y: timestamp} = json.results;

		// it may lose precision but it's not important for now since the loss is less then 1 milliseconds
		const timestampMilliseconds = Math.floor(timestamp / 1_000_000);

		const currentPrices = get(prices);

		// Only update the store if the price actually changed
		if (currentPrices[product_id] !== price) {
			prices.update((x) => {
				x[product_id] = price * 1;
				return x;
			});
		}

		// update chart
		onNewPrice(price, timestampMilliseconds, product_id);

		if (product_id == get(productId)) {
			setTitle(product_id, price);
		}

	});

}

let poller;
export function initWebsocket() {

	// Poll
	clearInterval(poller);

	for (const product_id of Object.keys(PRODUCTS)) {
		getPrice(product_id);
	}

	// Poll for prices every 10 secs
	poller = setInterval(() => {
		for (const product_id of Object.keys(PRODUCTS)) {
			getPrice(product_id);
		}
	}, 10000);

// 	// Stream

// 	// console.log('initWebsocket');

// 	// Check last ticker
// 	clearInterval(s);
// 	setTimeout(() => {
// 		s = setInterval(() => {
// 			if (lastMessageReceived < Date.now() - 60 * 1000) {
// 				showToast('Price feed is stale. Try refreshing the page, checking your internet connection, or changing your VPN/proxy.', 'error', 'stream-error');
// 			} else if (!lastMessageReceived) {
// 				showToast('Price feed still connecting...', 'error', 'stream-error');
// 			} else {
// 				hideToast('stream-error');
// 			}
// 		}, 3000);
// 	}, 10 * 1000);

// 	if (ws) {
// 		try {
// 			ws.close(3335,"");
// 		} catch(e) {};
// 		ws = null;
// 		clearTimeout(h);
// 	}

// 	ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');

// 	ws.onopen = (e) => {

// 		// console.log('onopen', ws.readyState, e);

// 		if (ws.readyState != 1) return;

// 		heartbeat();

// 		subscribeToProducts();

// 	}

// 	ws.onmessage = (e) => {

// 		// return;
// 		// console.log('m', e);

// 		lastMessageReceived = Date.now();

// 		try {

// 			const message = JSON.parse(e.data);

// 			const { type, product_id, open_24h, price } = message;

// 			if (type == 'heartbeat') return heartbeat();

// 			if (!product_id || type != 'ticker') return;

// 			prices.update((x) => {
// 				x[product_id] = price * 1;
// 				return x;
// 			});

// 			prices24h.update((x) => {
// 				x[product_id] = open_24h * 1;
// 				return x;
// 			});

// 			// update chart
// 			onNewPrice(price, Date.now(), product_id);

// 			if (product_id == get(productId)) {
// 				setTitle(product_id, price);
// 			}

// 		} catch(e) {
// 			console.error(e);
// 		}

// 	}

// 	ws.onclose = (e) => {

// 		console.log('Socket closed', e.code, e);

// 		if (e.wasClean) {

// 		} else {

// 		}

// 		if (e.code != 3335) {
// 			initWebsocket();
// 		}

// 	}

// 	ws.onerror = (e) => {
// 		console.log('Websocket error', e);
// 	}

}