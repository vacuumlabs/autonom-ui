import { get } from 'svelte/store'

import { product, positions, chartResolution, chartLoading } from './stores'

let candles = []; // current candle set

// In ms
let start;
let end;

let chart;
let candlestickSeries;

let isLoadingCandles = false;

// how much history to load for each resolution (in ms)
const lookbacks = {
	60: 300 * 60 * 1000,
	300: 24 * 60 * 60 * 1000,
	900: 48 * 60 * 60 * 1000,
	3600: 12 * 24 * 60 * 60 * 1000,
	21600: 6 * 12 * 24 * 60 * 60 * 1000,
	86400: 24 * 12 * 24 * 60 * 60 * 1000,
};

let sidebarWidth = 300;

export function initChart() {

	let script = document.createElement("script");
	// IMPORTANT: Do not change the package version as there are some breaking changes
	script.setAttribute("src", "https://unpkg.com/lightweight-charts@^4/dist/lightweight-charts.standalone.production.js");
	document.body.appendChild(script);

	script.addEventListener("load", scriptLoaded, false);

	async function scriptLoaded() {

		let chartElem = document.getElementById('chart');
		let tradingRowElem = document.getElementById('trade');

		// mobile
		if (tradingRowElem.offsetWidth <= 600) sidebarWidth = 0;
		
		let chartDivWidth = tradingRowElem.offsetWidth - sidebarWidth;
		let chartDivHeight = chartElem.offsetHeight;

		chart = LightweightCharts.createChart(chartElem, { width: chartDivWidth, height: chartDivHeight });

		window.onresize = () => {
			chartDivWidth = tradingRowElem.offsetWidth - sidebarWidth;
			chartDivHeight = chartElem.offsetHeight;
			// console.log('px', window.devicePixelRatio, window.screen.availWidth, document.documentElement.clientWidth);
			// console.log('chartDivWidth', chartDivWidth, chartDivHeight);
			chart.resize(chartDivWidth, chartDivHeight);
		};

		chart.applyOptions({
			layout: {
			    background: {
			        type: LightweightCharts.ColorType.Solid,
			        color: '#1A1A1A',
			    },
			    textColor: '#707070'
			},
			grid: {
		        vertLines: {
		            color: '#292929',
		            style: 1,
		            visible: true,
		        },
		        horzLines: {
		            color: '#292929',
		            style: 1,
		            visible: true,
		        },
		    },
			timeScale: {
				timeVisible: true
			},
			crosshair: {
				mode: 0,
				vertLine: {
					width: 0.5,
					labelBackgroundColor: '#3D3D3D'
				},
				horzLine: {
					width: 0.5,
					labelBackgroundColor: '#3D3D3D'
				}
			}
		});

		candlestickSeries = chart.addCandlestickSeries({
			upColor: '#00C805',
		    downColor: '#FF5000',
		    wickUpColor: '#00C805',
		    wickDownColor: '#FF5000',
		});

		async function onVisibleLogicalRangeChanged(newVisibleLogicalRange) {
			//console.log('lvc', newVisibleLogicalRange);
		    // returns bars info in current visible range
		    const barsInfo = candlestickSeries.barsInLogicalRange(newVisibleLogicalRange);
		    //console.log(barsInfo);
		    if (barsInfo !== null && barsInfo.barsBefore < 5) {
	            // try to load additional historical data and prepend it to the series data
	            // use setData with additional data prepended
	            if (isLoadingCandles) return;
	            const resolution = get(chartResolution);
	            // console.log('load left resolution', resolution);
	            // console.log('load additional data to the left');
	            isLoadingCandles = true;
	            await loadCandles(resolution, start - lookbacks[resolution], end - lookbacks[resolution], true);
	            isLoadingCandles = false;
	        }
		}

		function onVisibleTimeRangeChanged(newVisibleTimeRange) {
			//console.log('vc', newVisibleTimeRange);
		}

		chart.timeScale().subscribeVisibleTimeRangeChange(onVisibleTimeRangeChanged);

		chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChanged);

		loadPositionLines();

		applyWatermark();

	}

}

// timezone corrected time in seconds
function correctedTime(time) {
	const timezoneOffsetMinutes = new Date().getTimezoneOffset();
	//console.log('timezoneOffsetMinutes', timezoneOffsetMinutes);
	return time-(timezoneOffsetMinutes*60)
}

export function applyWatermark() {
	const _product = get(product).symbol;
	if (!_product) return;
	chart && chart.applyOptions({
	    watermark: {
	        color: '#292929',
	        visible: true,
	        text: _product,
	        fontSize: 48,
	        horzAlign: 'center',
	        vertAlign: 'center',
	    },
	});
}

export async function setResolution(_resolution) {
	chartResolution.set(_resolution);
	localStorage.setItem('chartResolution', _resolution);
	chartLoading.set(true);
	await loadCandles(_resolution);
	chartLoading.set(false);
}

export async function loadCandles(_resolution, _start, _end, prepend, productOverride) {

	_resolution = get(chartResolution);

	// console.log('called loadCandles', _resolution, _start, _end, prepend);

	let _product = productOverride || get(product).symbol;

	// console.log('candlestickSeries', Boolean(candlestickSeries));
	// console.log('_product', _product);

	if (!candlestickSeries || !_product) {
		// try again
		// console.log('attempting chart again...');
		setTimeout(() => {
			loadCandles(_resolution, _start, _end, false, !_product ? 'ETH-USD' : false);
		}, 2000);
		return;
	}

	_resolution = get(chartResolution);

	//console.log('_product', _product);
	//console.log('resolution', _resolution, lookbacks[_resolution]);

	if (!_start || !_end) { // test
		_start = Date.now() - lookbacks[_resolution];
		_end = Date.now();
	}

	start = _start;
	end = _end;

	// console.log('start, end', start, end, new Date(start).toString(), new Date(end).toString());

	const url_start = Math.floor(start / 1000);
	const url_end = Math.floor(end / 1000);

	// TODO: update this based on the used backend, we're using mock price provider which expects in minutes
	const resolution_mins = Number(_resolution) / 60; 

	const response = await fetch(`http://localhost:3000/products/${_product}/candles?granularity=${resolution_mins}m&start=${url_start}&end=${url_end}`);
	const json = await response.json();

	if (!json || !Array.isArray(json)) {
		return console.log('json invalid', json);
	}

	if (prepend) {
		// prepend candles to existing set
		let prepend_set = [];
		for (const item of json) {
			// TODO: This is temporary solution to fix duplicate data as the backend includes both start time and end time while returning data
			const candleTime = correctedTime(item[0]);
			if (candles.length && candleTime === candles[0].time) continue; // Skip duplicate
			prepend_set.push({
				time: correctedTime(item[0]),
				open: item[1],
				high: item[2],
				low: item[3],
				close: item[4]
			});
		}
		// If backend returns prices sorted by decreasing timestamp, apply reverse function
		// prepend_set.reverse();
		candles = prepend_set.concat(candles);
	} else {
		candles = [];
		for (const item of json) {
			// TODO: This is temporary solution to fix duplicate data as the backend includes both start time and end time while returning data
			const candleTime = correctedTime(item[0]);
			if (candles.length && candleTime === candles[0].time) continue; // Skip duplicate
			candles.push({
				time: correctedTime(item[0]),
				open: item[1],
				high: item[2],
				low: item[3],
				close: item[4]
			});
		}
		// If backend returns prices sorted by decreasing timestamp, apply reverse function
		// candles.reverse();
	}

	//console.log('data', data);

	// set data
	candlestickSeries.setData(candles);

	//chart.timeScale().fitContent();

}

export function onNewPrice(price, timestamp, _product) {
	// add data point to current candle set
	// use update with time = last time for this resolution
	// get last data point to update ohlc values based on given data point

	//candlestickSeries.update({ time: '2019-01-01', open: 60.71, high: 60.71, low: 53.39, close: 59.29 });

	const symbol = get(product).symbol;

	if (_product != symbol) return;

	let lastCandle = candles[candles.length - 1];

	if (!lastCandle) return;

	timestamp = correctedTime(timestamp/1000);

	const resolution = Number(get(chartResolution));

	if (timestamp >= lastCandle.time + resolution) {
		// new candle
		let candle = {
			time: parseInt(resolution * parseInt(timestamp/resolution)),
			open: price,
			high: price,
			low: price,
			close: price
		}
		candles.push(candle);
		candlestickSeries.update(candle);
	} else {
		// update existing candle
		if (lastCandle.low > price) lastCandle.low = price;
		if (lastCandle.high < price) lastCandle.high = price;
		lastCandle.close = price;

		candles[candles.length - 1] = lastCandle;
		candlestickSeries.update(lastCandle);
	}

}

let pricelines = [];

export function loadPositionLines() {

	return; // disabled for now
	
	//console.log('loadPositionLines');

	if (!candlestickSeries) {
		//console.log('nope2');
		setTimeout(loadPositionLines, 2000);
		return;
	}

	clearPositionLines();

	const _positions = get(positions);

	//console.log('_positions', _positions);

	for (const _pos of _positions) {

		//if (!_pos.price) continue;

		pricelines.push(
			candlestickSeries.createPriceLine({
			    price: _pos.price * 1 + 4280,
			    color: 'green',
			    lineWidth: 2,
			    lineStyle: LightweightCharts.LineStyle.Dotted,
			    axisLabelVisible: true,
			    title: _pos.amount,
			})
		);

	}

}

function clearPositionLines() {
	for (const priceline of pricelines) {
		candlestickSeries.removePriceLine(priceline);
	}
	pricelines = [];
}
