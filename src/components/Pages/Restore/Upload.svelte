<script>
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { Button } from "svelte-chota";
  import { _ } from "svelte-i18n";

  //Stores
  import { steps } from "../../../common/stores.js";

  //Context
  const { setFile, nextPage } = getContext("functions");

  //Props
  export let restore = false;

  let disabledButton = true;
  let fileName;
  $: dragover = "";

  onMount(() => {
    if (restore) {
      steps.update((current) => {
        current.currentStep = 2;
        return current;
      });
    } else {
      steps.set({
        currentStep: 1,
        stepList: [
          { number: 1, name: "Upload", desc: "Keystore file" },
          { number: 2, name: "Password", desc: "For keystore" },
          { number: 3, name: "Decide", desc: "Select accounts" },
          { number: 4, name: "Complete", desc: "Return to wallet" },
        ],
      });
    }
  });

  const openPicker = () => {
    let element = document.getElementById("filePicker");
    element.click();
  };

  const handleFileEvent = (ev) => {
    let file;
    ev.preventDefault();

    if (ev.target.files) {
      file = ev.target.files[0];
    } else if (ev.dataTransfer.items) {
      ev.dataTransfer.items[0].kind === "file"
        ? (file = ev.dataTransfer.items[0].getAsFile())
        : null;
    } else if (ev.dataTransfer.files) {
      ev.dataTransfer.files[0].kind === "file"
        ? (file = ev.dataTransfer.files[0].getAsFile())
        : null;
    }
    if (file) {
      if (file.name.includes(".keystore")) {
        setFile(file);
        fileName = file.name;
        disabledButton = false;
      } else {
        dragover = false;
      }
    }
  };

  const handleDragover = (e) => {
    if (!dragover) dragover = true;
  };

  const handleDragleave = (e) => {
    if (dragover) dragover = false;
  };
</script>

<style>
  .caption-box {
    display: inline;
    margin: 16px 0 20px 0;
  }

  .caption-box.text-caption {
    text-align: left;
  }
  span {
    cursor: pointer;
  }

  .dropzone {
    border: dashed 2px var(--font-secondary);
    height: 96px;
    margin-bottom: 50px;
    justify-items: center;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .dragover {
    background-color: var(--primary-color);
    word-break: break-all;
    padding: 0 10px;
  }
</style>

<div class="flex-row flow-page" in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column flow-content-left">
    <h6>{$_("Restore accounts")}</h6>

    <div class="flow-text-box text-body1">
      {$_("To restore your accounts, please upload the keystore file created during your backup.")}
    </div>

    <div class="caption-box text-caption">
      <span class="text-accent" on:click={() => openPicker()}>{$_("Click here to choose a file")}</span>
      {$_("or drag and drop your file below.")}
    </div>

    <div
      class={`dropzone flex-column ${dragover}`}
      class:dragover
      on:dragover|preventDefault={(e) => handleDragover(e)}
      on:dragleave|preventDefault={(e) => handleDragleave(e)}
      on:drop={(ev) => handleFileEvent(ev)}>
      {fileName ? fileName : $_("Drop file here")}
    </div>

    <input
      id="filePicker"
      type="file"
      accept=".keystore"
      on:change={(ev) => handleFileEvent(ev)} />

    <div class="flex-column flow-buttons">
      <Button
        id="confirm-keystore-btn"
        class={`button__solid ${ !disabledButton ? "button__primary" : ""}`}
        disabled={disabledButton}
        on:click={() => nextPage()}>
        {$_("Confirm keystore")}
      </Button>
    </div>
  </div>
  <div class="flex-column flow-content-right" />
</div>
