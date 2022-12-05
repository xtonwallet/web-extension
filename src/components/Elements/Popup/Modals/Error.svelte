<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  export let modalData = {};
</script>

<style lang="scss">
  .error {
    p {
      word-break: break-word;
      overflow-y: auto;
      max-height: 35rem;
    }
  }
</style>

<div class="error">
  <h6 class="text-warning"> {$_("Error")} </h6>
  <p> {$_(modalData.message)} </p>
</div>
