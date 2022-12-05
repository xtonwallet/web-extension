<script>
  import { onMount, getContext } from "svelte";
  import { _ } from "svelte-i18n";

  //Components
  import { Button, Field, Input } from "svelte-chota";

  import {
    generateQRcode,
    toNano,
  } from "../../../../common/utils.js";

  import "../../../../common/fileSaver.js";

  export let modalData = {};

  let qrCode;
  onMount(() => {
    qrCode = generateQRcode(document.getElementById("qrcode"), modalData.data);
    qrCode.resize(250, 250);
  });

  //Context
  const { closeModal } = getContext("app_functions");

  const cancelModal = () => {
    closeModal();
  };

  const saveAsImage = () => {
    document.querySelector("#qrcode canvas").toBlob(function(blob) {
      saveAs(blob, "XTON_wallet_QRcode.png");
    });
  };

  const regenerate = async () => {
    const amount = document.getElementById("amount").value;
    const message = document.getElementById("message").value;
    await qrCode.makeCode(modalData.data + "?amount=" + toNano(amount) + "&text=" + message);
    await qrCode.resize(250, 250);
  };
</script>

<style lang="scss">

</style>

<div class="flex-column">
  <p class="header">
    {$_('QR code')}
  </p>
  <div class="flex-row flex-center-center">
    <div id="qrcode"></div>
  </div>
  <div class="flex-row flex-center-center">
    <Field label={$_('Amount')}>
      <Input id="amount" number on:keyup={(event) => regenerate()} />
    </Field>
    <Field label={$_('Message')}>
      <Input id="message" on:keyup={(event) => regenerate()} />
    </Field>
  </div>
  <div class="flex-row flow-buttons">
    <Button
      id="save-as-image-btn"
      class="button__solid button__primary"
      on:click={() => saveAsImage()}>
      {$_('Save')}
    </Button>
    <Button
      id="cancel-btn"
      class="button__solid button__secondary"
      on:click={() => cancelModal()}>
      {$_('Close')}
    </Button>
  </div>
</div>
