<script>
	import Modal from '../modals/Modal.svelte'
	import Button from '../layout/Button.svelte'

	import { switchChains } from '../../lib/wallet'

	import {CHAINDATA} from '../../lib/constants'

	// TODO (autonom): Find another solution when we support multiple L2 chains
	const DEFAULT_CHAIN_ID = Number(process.env.DEFAULT_CHAIN_ID);
	const CHAIN_NAME = CHAINDATA[DEFAULT_CHAIN_ID]?.name;
</script>

<style>

	.note {
		padding: var(--base-padding);
		line-height: 1.618;
	}

</style>

<Modal title='Invalid Network' showHeader={true} showCancel={true}>

	<div class='note'>
		Select {CHAIN_NAME} as your wallet's network to trade or pool on CAP.
	</div>

	<Button wrap={true} onClick={() => {switchChains()}} label={`Switch to ${CHAIN_NAME}`} />

</Modal>