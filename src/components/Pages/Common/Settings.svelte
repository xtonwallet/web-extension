<script>
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { _, locale, locales } from "svelte-i18n";

  //Stores
  import {
    settingsStore,
    currentLang,
    currentAutologout,
    currentRetrievingTransactionsPeriod,
    currentEnabledProxy,
    currentCurrency,
    CURRENCIES_LIST
  } from "../../../common/stores.js";

  import { getRate } from "../../../common/utils.js";
  import { Checkbox, Field, Input, Button } from "svelte-chota";

  //Components
  import Select from "../../Elements/Select";

  //Context
  const { switchPage } = getContext("app_functions");

  //DOM nodes
  let formObj, language, autologout, pincode, retrievingTransactionsPeriod, enableProxy, currency;
  let currentCurrencyValue, currentLanguageValue;
  let currenciesItems = [];
  let languagesItems = [];

  //Props
  onMount(() => {
    language = document.getElementById("language-input");
    language.dataset.value = $locale;
    currentLanguageValue = { value: $currentLang, label: $_($currentLang) };
    for (let i in $locales) {
      languagesItems.push({
        value: $locales[i],
        label: $_($locales[i]),
      });
    }

    autologout = document.getElementById("autologout-input");
    pincode = document.getElementById("pincode-input");
    retrievingTransactionsPeriod = document.getElementById("retrieving-transactions-period-input");
    enableProxy = document.getElementById("enable-proxy-input");

    currency = document.getElementById("currency-input");
    currency.dataset.value = $currentCurrency;
    currentCurrencyValue = { value: $currentCurrency, label: CURRENCIES_LIST[$currentCurrency] };
    for (let i in CURRENCIES_LIST) {
      currenciesItems.push({
        value: i,
        label: CURRENCIES_LIST[i],
      });
    }
  });

  const handleSubmit = async () => {
    try {
      if (formObj.checkValidity()) {
        settingsStore.setLang(language.dataset.value);
        settingsStore.setAutologout(autologout.value);
        settingsStore.setRetrievingTransactionsPeriod(retrievingTransactionsPeriod.value);
        settingsStore.setEnabledProxy(enableProxy.checked);
        settingsStore.setCurrency(currency.dataset.value);

        const currentRate = await getRate(currency.dataset.value);
        settingsStore.setRate(currentRate);

        let settingEnabledPinPad;
        if (pincode.value.length > 0 ) {
          settingEnabledPinPad = true;
          settingsStore.setEnabledPinPad(true);
          browser.runtime.sendMessage({ type: "setPincode", data: pincode.value })
        } else {
          settingEnabledPinPad = false;
          settingsStore.setEnabledPinPad(false);
        }

        // need to change storage on background
        browser.runtime
          .sendMessage({ type: "setSettings", data: {
            "setLang": language.dataset.value,
            "setAutologout": autologout.value,
            "setRetrievingTransactionsPeriod": retrievingTransactionsPeriod.value,
            "setEnabledPinPad": settingEnabledPinPad,
            "setEnabledProxy": enableProxy.checked,
            "setCurrency": currency.dataset.value,
            "setRate": currentRate,
          }})
          .then(() => {
            switchPage("AccountMain");
          }).catch((error) => {
            console.error("Error on sendMessage:" + JSON.stringify(error.message));
          });
      }
    } catch (e) {
      formObj.reportValidity();
    }
  };

  const goBack = () => {
    switchPage("AccountMain");
  };

  const pincodeKeyPress = (event) => {
    if ((event.which != 8 && isNaN(String.fromCharCode(event.which))) || event.target.value.length == 8) {
      event.preventDefault(); //stop character from entering input
    }
  };
</script>

<style>
</style>

<h6>{$_('Settings')}</h6>

<form
  id="settings-form"
  on:submit|preventDefault={() => handleSubmit()}
  target="_self"
  bind:this={formObj}
  autocomplete="off">
  <Field grouped class="not-overflowed">
    <div class="input-box-50">
      <Field label={$_('Language')}>
        <Select
          id="language-input"
          items={languagesItems}
          value={currentLanguageValue}
          placeholder={$_('Select or enter a new one') + '...'}
          noOptionsMessage={$_('No matches')}
          on:select={(event) => {language.dataset.value = event.detail.value; $locale = event.detail.value;}}
          on:clear={(event) => {language.dataset.value = ""}}
          />
      </Field>
    </div>
    <div class="input-box-50">
      <Field label={$_('Currency to display asset cost')}>
        <Select
          id="currency-input"
          items={currenciesItems}
          value={currentCurrencyValue}
          placeholder={$_('Select or enter a new one') + '...'}
          noOptionsMessage={$_('No matches')}
          on:select={(event) => {currency.dataset.value = event.detail.value}}
          on:clear={(event) => {currency.dataset.value = ""}}
          />
      </Field>
    </div>
  </Field>
  <Field grouped>
    <div class="input-box-50">
      <Field label={$_('Retrieving transactions period (in minutes)')}>
        <Input
          id="retrieving-transactions-period-input"
          type="number"
          value={$currentRetrievingTransactionsPeriod} />
      </Field>
    </div>
    <div class="input-box-50">
      <Field label={$_('Pin code (4-8 numbers)')}>
        <Input id="pincode-input" on:keypress={pincodeKeyPress} pattern="{String.raw`[0-9]{4,8}`}"/>
      </Field>
    </div>
  </Field>
  <Field grouped>
    <div class="input-box-50">
      <Field label={$_('Enable TON proxy')}>
        <Checkbox
          value="enabled"
          id="enable-proxy-input"
          checked={$currentEnabledProxy}
        />
      </Field>
    </div>
    <div class="input-box-50">
      <Field label={$_('Autologout (in minutes)')}>
        <Input id="autologout-input" type="number" value={$currentAutologout} />
      </Field>
    </div>
  </Field>
  <div class="flex-column flow-buttons">
    <Button
      form="settings-form"
      class="button__solid button__primary submit-button submit-button-text submit"
      style="margin: 0 0 1rem;"
      submit=true>
      {$_('Save settings')}
    </Button>
    <Button
      id="back"
      class="flex-row flex-center-centr button__solid button"
      style="margin: 0 0 1rem;"
      on:click={() => goBack()}>
      {$_('Back')}
    </Button>
  </div>
</form>
