<script>
	import { onMount } from 'svelte'

	import Button from './layout/Button.svelte'

	import { CIRCLE_ICON } from '../lib/icons'

	import { checkMetamaskSession, switchChains } from '../lib/wallet'

	import { address, wrongNetwork, currentPage } from '../lib/stores'

	import { shortAddress, showModal } from '../lib/utils'

	import {CHAINDATA} from '../lib/constants'

	onMount(async () => {
		await checkMetamaskSession();
	});

	// TODO (autonom): Find another solution when we support multiple L2 chains
	const DEFAULT_CHAIN_ID = Number(process.env.DEFAULT_CHAIN_ID);
	const CHAIN_NAME = CHAINDATA[DEFAULT_CHAIN_ID]?.name;

</script>

<style>

	.wallet {
		display: flex;
		align-items: center;
	}

	.address {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		text-align: right;
		white-space: nowrap;
	}

	.address :global(svg) {
		fill:  var(--green);
		height: 10px;
		margin-right: 8px;
	}

	.wrong-network {
		color: var(--orange);
		padding-right: var(--base-padding);
		white-space: nowrap;
		cursor: pointer;
	}

	@media (max-width: 600px) {
		.wrong-network {
			display: none;
		}
	}

</style>

<div class='wallet'>

	{#if $address && $wrongNetwork}
	<div class='wrong-network' on:click={() => {switchChains()}}>Switch to {CHAIN_NAME}</div>
	{/if}

	{#if $address}
		<div class='address'>
			{@html CIRCLE_ICON}
			{shortAddress($address)}
		</div>
	{:else}
		{#if $currentPage != 'home'}
		<Button small={true} onClick={() => {showModal('Connect')}} label={`Connect`} />
		{/if}
	{/if}

</div>