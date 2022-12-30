<script>
  import { onMount, getContext } from "svelte";
  import { _ } from "svelte-i18n";

  //Components
  import { Button, Field, Input, Icon } from "svelte-chota";

  import {
    copyToClipboard,
    toNano,
  } from "../../../../common/utils.js";

  export let modalData = {};

  let link;
  onMount(() => {
    link = modalData.data;
  });

  //Context
  const { closeModal } = getContext("app_functions");

  const cancelModal = () => {
    closeModal();
  };

  const regenerate = () => {
    const amount = document.getElementById("amount").value;
    const message = document.getElementById("message").value;
    link = modalData.data + "?amount=" + toNano(amount) + "&text=" + message;
  };

  const copyLink = (event) => {
    copyToClipboard(link);
    const element = event.currentTarget;
    element.classList.toggle("fade-half");
    setTimeout(() => {
      element.classList.toggle("fade-half");
    }, 1000);
  };

  import {
    mdiFacebook,
    mdiTwitter,
    mdiLinkedin,
    mdiXing,
    mdiVk,
    mdiReddit,
    mdiWhatsapp,
    mdiSkype,
    mdiTelegram,
    mdiFacebookMessenger,
    mdiClipboard
  } from "@mdi/js";

  const icons = {
    "facebook": mdiFacebook,
    "twitter": mdiTwitter,
    "linkedin": mdiLinkedin,
    "xing": mdiXing,
    "vk": mdiVk,
    "reddit": mdiReddit,
    "whatsapp": mdiWhatsapp,
    "skype": mdiSkype,
    "telegram": mdiTelegram,
    "facebookMessenger": mdiFacebookMessenger
  };

  const openLink = (url) => {
    url = url.replace('{{TEMPLATE_TEXT}}', $_("Send from XTON wallet"));
    url = url.replace('{{TEMPLATE_URL}}', link);
    url = url.replace('{{TEMPLATE_IMAGE}}', "https://xtonwallet.com/images/big_logo.png");
    window.open(url, "_blank");
  }

  const shareList = [
      {name: "facebook", url: 'http://www.facebook.com/sharer.php?s=100&&p[summary]={{TEMPLATE_TEXT}}&p[url]={{TEMPLATE_URL}}&p[images][0]={{TEMPLATE_IMAGE}}'},
      {name: "twitter", url: 'https://twitter.com/share?url={{TEMPLATE_URL}}&text={{TEMPLATE_TEXT}}'},
      {name: "linkedin", url: 'https://www.linkedin.com/cws/share?url={{TEMPLATE_URL}}'},
      {name: "xing", url: 'https://www.xing.com/social_plugins/share?url={{TEMPLATE_URL}}'},
      {name: "vk", url: 'http://vk.com/share.php?url={{TEMPLATE_URL}}&description={{TEMPLATE_TEXT}}&image={{TEMPLATE_IMAGE}}'},
      {name: "reddit", url: 'http://www.reddit.com/submit?url={{TEMPLATE_URL}}&title={{TEMPLATE_TEXT}}'},
      {name: "whatsapp", url: 'whatsapp://send?text={{TEMPLATE_URL}} {{TEMPLATE_TEXT}}'},
      {name: "skype", url: 'skype:?chat&topic={{TEMPLATE_URL}} {{TEMPLATE_TEXT}}'},
      {name: "telegram", url: 'tg://msg?text={{TEMPLATE_URL}} {{TEMPLATE_TEXT}}'},
      {name: "facebookMessenger", url: 'fb-messenger://share?link={{TEMPLATE_URL}}'}
  ];
</script>

<style lang="scss">
  .social-box {
    display: flex;
    justify-content: space-between;
    width: 225px;
    margin-left: auto;
    align-items: center;
    flex-wrap: wrap;
    margin-right: auto;
    margin-bottom: 3rem;
    margin-top: 1rem;
    div {
      cursor: pointer;
      color: var(--color-primary);
    }
  }
</style>

<div class="flex-column">
  <p class="header">
    {$_('Send the link')}
  </p>
  <div class="flex-row flex-center-center">
    <Field gapless>
      <Input id="link" readonly value={link}/>
      <Button on:click={(e) => copyLink(e)} outline title="{$_('Copy')}">
        <Icon src="{mdiClipboard}" size="1"/>
      </Button>
    </Field>
  </div>
  <div class="flex-row flex-center-center">
    <Field label={$_('Amount')}>
      <Input id="amount" number on:keyup={(event) => regenerate()} />
    </Field>
    <Field label={$_('Message')}>
      <Input id="message" on:keyup={(event) => regenerate()} />
    </Field>
  </div>

  <div class="social-box">
    {#each shareList as item}
      <div on:click={() => openLink(item.url)} on:keyup={() => openLink(item.url)}>
        <Icon src="{icons[item.name]}" size="2"/>
      </div>
    {/each}
  </div>

  <div class="flex-row flow-buttons">
    <Button
      id="cancel-btn"
      class="button__solid button__secondary"
      on:click={() => cancelModal()}>
      {$_('Close')}
    </Button>
  </div>
</div>
