// Client side wallet interactions
import { ethers } from 'ethers'
import { initEventListeners } from './events'
import { hydrateData } from './data'
import { CHAINDATA } from './constants'
import { showToast, hideModal } from './utils'
import { chainId, signer, provider, address } from './stores'

const DEFAULT_CHAIN_ID = Number(process.env.DEFAULT_CHAIN_ID);
const DEFAULT_RPC_URL = process.env.DEFAULT_RPC_URL;

let _provider = new ethers.providers.JsonRpcProvider(DEFAULT_RPC_URL);
provider.set(_provider);
chainId.set(DEFAULT_CHAIN_ID);

export async function checkMetamaskSession() {
	if (window.ethereum) connectMetamask(true);
}

export async function connectMetamask(resume) {

	let metamask = window.ethereum;
	if (!metamask && !resume) return showToast('Metamask is not installed.');
	
	_provider = new ethers.providers.Web3Provider(metamask);

	let accounts;
	if (resume) {
		accounts = await _provider.send('eth_accounts');
	} else {
		accounts = await _provider.send("eth_requestAccounts", []);
		hideModal();
	}

	if (!accounts || !accounts.length) return;

	const network = await _provider.getNetwork();
	chainId.set(network.chainId);
	metamask.on('chainChanged', (_chainId) => {
		window.location.reload();
	});

	provider.set(_provider);

	if (accounts.length) {
		handleAccountsChanged();
	} else {
		hydrateData();
	}
	metamask.on('accountsChanged', handleAccountsChanged);

}

export async function switchChains() {

	let wallet = window.ethereum;

	if (!wallet) return showToast("Can't connect to wallet.");

	const hexDefaultChainId = "0x" + DEFAULT_CHAIN_ID.toString(16);
	console.log('chainIDDD: ', hexDefaultChainId);

	try {
		await wallet.request({
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: hexDefaultChainId }],
		});
	} catch (switchError) {
		// This error code indicates that the chain has not been added to MetaMask.
		if (switchError.code === 4902) {
			try {
				await wallet.request({
					method: 'wallet_addEthereumChain',
					params: [{
						chainId: hexDefaultChainId,
						chainName: [CHAINDATA[DEFAULT_CHAIN_ID]['name']],
						rpcUrls: [CHAINDATA[DEFAULT_CHAIN_ID]['rpc']],
						nativeCurrency: {
							name: 'ETH',
							symbol: 'ETH',
							decimals: 18
						},
						blockExplorerUrls: [CHAINDATA[DEFAULT_CHAIN_ID]['explorer']]
					}],
				});
			} catch (addError) {
				// handle "add" error
			}
		}
		// handle other "switch" errors
	}

}

async function handleAccountsChanged() {
	const _signer = _provider.getSigner();
	signer.set(_signer);
	const _address = await _signer.getAddress();
	address.set(_address);
	amplitude.getInstance().setUserId(_address);
	hydrateData();
	initEventListeners();
}
