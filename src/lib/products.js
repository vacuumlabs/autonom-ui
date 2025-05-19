// IMPORTANT: ETH-USD should be kept in products in any deployment for two main reasons
// 1. It's default product in autonom and hardcoded in some other parts as a fallback value
// 2. Autonom supports two different collaterals (weth and usdc). We need to know price of weth in some parts. So, we need to get ETH-USD price data from price service.
export const PRODUCTS = {
	'ETH-USD': {
		polygonTickerSymbol: 'X:ETHUSD',
		hours: '24/7',
		logo: '/logos/ETH.svg',
		baseSpread: 0.0001,
		maxSlippage: 5,
		slippageExponent: 2.5,
		maxLiquidity: {
			weth: 2000,
			usdc: 8000000
		}
	},
	'AAPL-USD': {
		polygonTickerSymbol: 'AAPL',
		hours: '24/7',
		logo: '/logos/BTC.svg',
		baseSpread: 0.0001,
		maxSlippage: 5,
		slippageExponent: 2.5,
		maxLiquidity: {
			weth: 3000,
			usdc: 8000000
		}
	}
};