<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  export let modalData = {};
</script>

<style>
</style>

<div class="success">
  <h6 class="text-success"> {$_("Success")} </h6>
  <p> {$_(modalData.message)} </p>
</div>
