<script>
	import { _ } from 'svelte-i18n';
//Components
	import MenuItem  from './MenuItem.svelte';

//Props
export let menuItems;
export let heading;
</script>

<style>
	.box {
	  display: flex;
	  flex-direction: column;
	  background: var(--color-black);
	  box-shadow: var(--box-shadow-2);
	  -webkit-box-shadow: var(--box-shadow-2);
	  -moz-box-shadow: var(--box-shadow-2);
	  border-radius: 4px;
	  margin-bottom: 7px;
		padding: 0px 1rem;
		padding-bottom: 1rem;
	}

	.header {
	  display: none;
	}

	@media (min-width: 900px) {
    .header{
      display: flex;
      flex-direction: row;
      align-content: center;
      margin-left: 31px;
    }
	}
</style>

<div class="box">
  <div class="header">
    <h3> {$_(heading)} </h3>
  </div>
  {#each menuItems as menuItem}
    {#if menuItem.show}
      <MenuItem {menuItem}/>
    {/if}
  {/each}
</div>
