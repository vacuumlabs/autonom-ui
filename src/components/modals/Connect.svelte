<script>
	import Modal from '../modals/Modal.svelte'
	import { connectMetamask } from '../../lib/wallet'
	
</script>

<style>

	.row {
		display: flex;
		align-items: center;
		padding: 0 var(--base-padding);
		border-bottom: 1px solid var(--jet-dim);
		font-size: 120%;
		font-weight: 700;
		cursor: pointer;
		height: 74px;
	}
	.row:not(.selected):hover {
		background-color: var(--jet-dim);
	}
	.row.selected {
		background-color: var(--jet);
		cursor: default !important;
	}
	.row:last-child {
		border-bottom: none;
	}

	.row img {
		max-width: 42px;
		margin-right: 20px;
	}
	
	.note {
		line-height: 1.418;
		padding: var(--base-padding);
		border-bottom: 1px solid var(--jet-dim);
		font-size: 90%;
	}

</style>

<Modal>
	
	<div class='note'><strong>Important Note:</strong><br/>By connecting your wallet to this community built user interface to access the CAP smart contracts, you explicitly agree to CAP's <strong><a href='https://docs.cap.finance/terms-of-use' target='_blank'>Terms of Use</a></strong>. In particular, you certify that you are not a resident or citizen of Canada, the United States of America, or any other jurisdictions mentioned in the Terms.</div>

	<div class='row' on:click={() => {connectMetamask()}} data-intercept="true">
		<img src='https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg'>
		<div>MetaMask</div>
	</div>

</Modal>
