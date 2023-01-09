<style global lang="scss">
  @import "./chota.min.css";

  /* cyrillic-ext from https://fonts.gstatic.com/s/mulish/v12/1Ptyg83HX_SGhgqO0yLcmjzUAuWexZNR8aqvG4w-.woff2*/
  @font-face {
    font-family: 'Mulish';
    font-style: normal;
    font-weight: 400;
    src: url(./assets/fonts/1Ptyg83HX_SGhgqO0yLcmjzUAuWexZNR8aqvG4w-.woff2) format('woff2');
    unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
  }
  /* cyrillic from https://fonts.gstatic.com/s/mulish/v12/1Ptyg83HX_SGhgqO0yLcmjzUAuWexZNR8aOvG4w-.woff2*/
  @font-face {
    font-family: 'Mulish';
    font-style: normal;
    font-weight: 400;
    src: url(./assets/fonts/1Ptyg83HX_SGhgqO0yLcmjzUAuWexZNR8aOvG4w-.woff2) format('woff2');
    unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
  }
  /* vietnamese https://fonts.gstatic.com/s/mulish/v12/1Ptyg83HX_SGhgqO0yLcmjzUAuWexZNR8aivG4w-.woff2*/
  @font-face {
    font-family: 'Mulish';
    font-style: normal;
    font-weight: 400;
    src: url(./assets/fonts/1Ptyg83HX_SGhgqO0yLcmjzUAuWexZNR8aivG4w-.woff2) format('woff2');
    unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB;
  }
  /* latin-ext from https://fonts.gstatic.com/s/mulish/v12/1Ptyg83HX_SGhgqO0yLcmjzUAuWexZNR8amvG4w-.woff2 */
  @font-face {
    font-family: 'Mulish';
    font-style: normal;
    font-weight: 400;
    src: url(./assets/fonts/1Ptyg83HX_SGhgqO0yLcmjzUAuWexZNR8amvG4w-.woff2) format('woff2');
    unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
  }
  /* latin from https://fonts.gstatic.com/s/mulish/v12/1Ptyg83HX_SGhgqO0yLcmjzUAuWexZNR8aevGw.woff2*/
  @font-face {
    font-family: 'Mulish';
    font-style: normal;
    font-weight: 400;
    src: url(./assets/fonts/1Ptyg83HX_SGhgqO0yLcmjzUAuWexZNR8aevGw.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }

  html,
  body,
  input {
    height: 100%;
    font-family: "Mulish", sans-serif;
  }

  :root {
    /**
     * Main UI Colors
    **/
    --color-primary: #0088CC;
    --color-primary-2: #2c7bb7;
    --color-lightGrey: #545252;
    --color-grey: #e8e7e7; /*inverted because the defaut is dark theme*/
    --color-grey-2: #e8e7e7; /*inverted because the defaut is dark theme*/
    --color-darkGrey: #dadada; /*inverted because the defaut is dark theme*/
    --color-warning: orange;
    --color-error: #d43939;
    --color-success: #31ce31;
    --color-accent: #4fb8ff;
    --color-secondary: #303030;
    --color-overlay: #fff;
    --bg-color: #232328;
    --grid-maxWidth: 120rem;
    --grid-gutter: 2rem;
    --font-size: 1.6rem;
    --font-color: #e0e0e0;
    --font-family-sans: "Mulish", -apple-system, BlinkMacSystemFont, Avenir,
      "Avenir Next", "Segoe UI", "Oxygen", "Ubuntu", "Cantarell",
      "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
    --font-family-mono: "Mulish", monaco, "Consolas", "Lucida Console",
      monospace;

    --bg-secondary: #8a8787;
    --bg-secondary-hover: #676464;
    --bg-semi-transparent: #0000007a;
    --bg-transparent: transparent;

    --font-color-dim: #ffffff8a;
    --font-color-inverse: #e0e0e0;
    --font-secondary: #c7c7c7;

    --divider-light: #3d3d3d;
    --divider-dark: #353535;

    --outline: #676767;
    --color-white: #121212; /*inverted because the defaut is dark theme*/
    --color-black: #fff; /*inverted because the defaut is dark theme*/

    /**
     * Buttons
    **/
    --button-outlined-background: #2479b9;
    --componet-disabled: brightness(50%);

    --box-shadow-color-1: #0823303d;
    --box-shadow-color-2: #08233029;
    --box-shadow-1: 0px 0px 1px var(--box-shadow-color-1),
      0px 1px 4px var(--box-shadow-color-2);
    --box-shadow-2: 0px 1px 2px var(--box-shadow-color-1),
      0px 2px 6px var(--box-shadow-color-2);
    --box-shadow-3: 0px 2px 4px var(--box-shadow-color-1),
      0px 4px 8px var(--box-shadow-color-2);
    --box-shadow-4: 0px 1px 48px rgba(0, 0, 0, 0.12),
      0px 16px 32px rgba(0, 0, 0, 0.12), 0px 12px 24px rgba(0, 0, 0, 0.12);

    --input-outline: var(--color-darkGrey);
  }

  body {
    background-color: var(--bg-color);
    margin: 0;
    min-height: unset;
    display: flex;
    color: var(--font-color);
  }

  .light {
    --color-primary: #07A0EC;
    --color-primary-2: #6dbaf5;
    --color-secondary: #303030;
    --color-overlay: #fff;
    --color-accent: #4fb8ff;

    --color-lightGrey: #d7d7d7;
    --color-grey: #383838;
    --color-grey-2: #383838;
    --color-darkGrey: #4a4a4a;

    --bg-color: #F7F9FB;
    --bg-secondary: #ada8a8;
    --bg-secondary-hover: #0e0505;

    --font-color: #373737;
    --font-color-dim: #929292;
    --font-color-inverse: #e0e0e0;
    --font-secondary-lighter: #cacaca;
    --font-secondary: #250e0e;

    --divider-light: #e4e4e4;
    --divider-dark: #b5b5b5;

    --outline: #676767;

    --color-warning: orange;
    --color-black: #121212;
    --color-white: #ffffff;
    --color-success: #31ce31;

    --componet-disabled: brightness(150%);
  }

  a,
  a:-webkit-any-link:active,
  a:-webkit-any-link:focus,
  a:-webkit-any-link:visited,
  a:-webkit-any-link:hover {
    text-decoration: none;
  }

  #filePicker {
    display: none;
  }

  .flex {
    display: flex;
  }

  .flex-column {
    display: flex;
    flex-direction: column;
  }

  .flex-grow-1 {
    flex-grow: 1;
  }

  .flex-row {
    display: flex;
    flex-direction: row;
  }

  .flex-align-center {
    align-items: center;
  }

  .flex-just-center {
    justify-content: center;
  }

  .flex-just-end {
    justify-content: flex-end;
  }

  .flex-center-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flex-center-end {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .text-black {
    color: var(--color-black);
  }

  .text-white {
    color: var(--color-white);
  }

  .text-primary-color {
    color: var(--color-primary);
  }

  .text-warning {
    color: var(--color-warning);
  }

  .text-red {
    color: var(--color-error);
  }

  .text-error {
    color: var(--color-error);
  }

  .text-green {
    color: var(--color-success);
  }

  .text-accent {
    color: var(--color-accent);
  }

  .text-primary {
    color: var(--font-color);
  }

  .text-primary-dim {
    color: var(--font-color-dim);
  }

  .text-secondary {
    color: var(--font-secondary);
  }

  .text-overlay {
    color: var(--color-overlay);
  }

  .text-bold {
    font-weight: bold;
  }

  .text-link {
    color: var(--font-color);
    text-decoration: underline;
    cursor: pointer;
  }

  .text-link:hover {
    color: var(--color-accent);
  }

  .text-link:visited {
    color: var(--font-color);
    text-decoration: underline;
    outline: none;
  }

  .text-link:visited:hover {
    color: var(--color-accent);
  }

  .text-link-secondary {
    color: var(--color-overlay);
    cursor: pointer;
  }

  .text-link-secondary:hover {
    color: var(--color-accent);
  }

  .text-link-secondary:visited {
    color: var(--color-overlay);
    outline: none;
  }

  .text-opacity-1 {
    opacity: 0.75;
  }

  .weight-100 {
    font-weight: 100;
  }

  .weight-200 {
    font-weight: 200;
  }

  .weight-300 {
    font-weight: 300;
  }

  .weight-400 {
    font-weight: 400;
  }

  .weight-500 {
    font-weight: 500;
  }
  .weight-600 {
    font-weight: 600;
  }
  .weight-700 {
    font-weight: 700;
  }
  .weight-800 {
    font-weight: 800;
  }

  .mt-1 {
    margin-top: 1rem;
  }

  .mtb-1 {
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
  .mt-half {
    margin-top: 0.5rem;
  }

  .mtb-half {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .mt-quarter {
    margin-top: 1rem;
  }

  .mtb-quarter {
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
  }

  .fill-font-primary {
    fill: var(--font-color);
  }

  .fill-font-secondary {
    fill: var(--font-secondary);
  }

  .fill-success {
    fill: var(--color-success);
  }

  .fill-error {
    fill: var(--color-error);
  }

  .fill-warning {
    fill: var(--color-warning);
  }

  .fill-accent {
    fill: var(--color-accent);
  }

  .fill-black {
    fill: var(--color-black);
  }

  .text-title,
  h1 {
    font-style: normal;
    font-weight: normal;
    font-size: 45px;
    letter-spacing: 0.25px;
  }

  h2 {
    font-style: normal;
    font-weight: normal;
    font-size: 25px;
    letter-spacing: 0.25px;
    margin: 1rem 0 2rem;
  }

  h3 {
    font-style: normal;
    font-weight: 500;
    font-size: 18px;
    letter-spacing: 0.44px;
  }

  .text-body1 {
    font-style: normal;
    font-size: 16px;
    letter-spacing: 0.44px;
  }

  .text-body2,
  h4 {
    font-style: normal;
    font-size: 14px;
    letter-spacing: 0.25px;
  }
  .text-body3,
  h5 {
    font-style: normal;
    font-size: 12px;
    letter-spacing: 0.44px;
  }

  .text-huge {
    font-style: normal;
    font-size: 55px;
    letter-spacing: 0.25px;
  }

  h6 {
    font-style: normal;
    font-size: 22px;
    letter-spacing: 0.25px;
    margin: 1rem 0 2rem;
  }

  .text-subtitle1 {
    font-style: normal;
    font-size: 10px;
    letter-spacing: 0.25px;
  }

  .text-subtitle2 {
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    letter-spacing: 0.1px;
  }

  .text-subtitle3 {
    font-style: normal;
    font-size: 16px;
    letter-spacing: 0.44px;
  }

  .text-caption {
    font-style: normal;
    font-size: 12px;
    letter-spacing: 0.4px;
    text-align: center;
  }

  .text-caption2 {
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    letter-spacing: 0.15px;
  }

  .text-button {
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    letter-spacing: 0.75px;
    text-transform: uppercase;
    background: transparent;
  }

  .box-shadow-1 {
    box-shadow: var(--box-shadow-1);
  }

  button {
    position: relative;
    font-size: 10px;
    margin: 2px;
    padding: 3px;
    cursor: pointer;
    border: unset;
    box-shadow: var(--box-shadow-1);
  }

  button:active {
    top: 1px;
  }

  button:focus {
    outline: none;
  }

  .button__solid {
    display: flex;
    align-items: center;
    text-align: center;
    justify-content: center;
    background-color: unset;
    border: unset;
    background: var(--bg-secondary);
    color: var(--color-overlay);
    box-shadow: 0px 1px 8px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.12),
      0px 1px 2px rgba(0, 0, 0, 0.16);
    border-radius: 4px;
  }

  button.button__solid:not(:disabled):hover {
    background: var(--bg-secondary-hover);
  }

  button.button__solid:disabled {
    filter: brightness(60%);
  }

  input.submit-button:not(:disabled):hover {
    filter: brightness(125%);
  }
  input.submit-button:disabled {
    filter: brightness(80%);
  }

  .button__solid.button__primary {
    background-color: var(--color-primary);
  }
  .button__solid.button__primary:not(:disabled):hover {
    background-color: var(--color-primary-2);
  }

  .button__solid.button__secondary {
    background-color: var(--color-secondary);
  }

  .button__solid.button__accent {
    background-color: var(--color-accent);
  }

  .button__solid.button__success {
    background-color: var(--color-success);
  }

  .button__solid.button__warning {
    background-color: var(--color-warning);
  }

  .button__red {
    color: var(--color-overlay);
  }

  .button__solid.button__red {
    background-color: var(--color-error);
  }

  .buttonGroup__left {
    box-shadow: unset;
    border-radius: 5px 0 0 5px;
  }

  .buttonGroup__left:focus {
    z-index: 1;
  }

  .buttonGroup__right {
    box-shadow: unset;
    border-radius: 0 5px 5px 0;
  }
  .buttonGroup__right:focus {
    z-index: 1;
  }

  .buttonGroup__center {
    box-shadow: unset;
    border-radius: 0;
    border-left: 1px solid var(--font-color-dim);
    border-right: 1px solid var(--font-color-dim);
  }
  .buttonGroup__center:focus {
    z-index: 1;
  }

  .button__text {
    display: flex;
    align-items: center;
    text-align: center;
    justify-content: center;
    background-color: unset;
    border: unset;
    background: var(--bg-color);
    color: var(--font-secondary);
    box-shadow: none;
  }

  .button__icon {
    background-color: unset;
    border: unset;
    box-shadow: unset;
    -webkit-box-shadow: unset;
    -moz-box-shadow: unset;
    background: transparent;
    padding: 0;
    margin: 0;
  }

  .button__outlined {
    position: relative;
    display: flex;
    align-items: center;
    background-color: unset;
    border: unset;
    border: 1px solid var(--font-color);
    background-color: var(--color-grey);
    border-radius: 4px;
    color: var(--font-color);
    padding: 13px 8px 13px 12px;
  }

  .button__outlined::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .button__outlined:hover:before {
    background-color: var(--font-color);
    filter: opacity(20%);
  }

  .button__outlined.button__primary:hover:before {
    background-color: var(--color-primary);
    filter: opacity(20%);
  }

  .button__outlined.button__primary:hover {
    border: 1px solid var(--color-primary);
  }

  .button__outlined.button__secondary:hover:before {
    background-color: var(--color-secondary);
    filter: opacity(20%);
  }

  .button__outlined.button__secondary:hover {
    border: 1px solid var(--color-secondary);
  }

  .button__outlined.button__overlay {
    background: var(--button-outlined-background);
    color: var(--color-overlay);
    border: 1px solid var(--color-overlay);
  }

  .button__outlined.button__overlay:hover:before {
    background-color: var(--color-overlay);
    filter: opacity(20%);
  }

  .button__outlined.button__overlay:hover {
    border: 1px solid var(--color-overlay);
  }

  .button__outlined.button__accent:hover:before {
    background-color: var(--color-accent);
    filter: opacity(20%);
  }

  .button__outlined.button__accent:hover {
    border: 1px solid var(--color-accent);
  }

  .button__outlined.button__success:hover:before {
    background-color: var(--color-success);
    filter: opacity(20%);
  }

  .button__outlined.button__success:hover {
    border: 1px solid var(--color-success);
  }

  .button__outlined.button__warning:hover:before {
    background-color: var(--color-warning);
    filter: opacity(20%);
  }

  .button__outlined.button__warning:hover {
    border: 1px solid var(--color-warning);
  }

  .button__outlined.button__warning:hover:before {
    background-color: var(--color-error);
    filter: opacity(20%);
  }

  .button__outlined.button__warning:hover {
    border: 1px solid var(--color-error);
  }

  .details-button {
    color: var(--font-color-dim);
    padding: 2px 6px;
    background: var(--color-lightGrey);
    border-radius: 16px;
  }

  .upload-button {
    color: var(--font-color);
    padding: 2px 6px;
    background: var(--color-lightGrey);
    border-radius: 16px;
  }

  .upload-button:hover {
    color: var(--color-primary);
  }

  .row-box:hover .details-button {
    color: var(--font-color);
    background: var(--color-primary);
  }

  .button__small {
    border: 1px solid transparent;
    background: var(--color-lightGrey);
    color: var(--font-color);
    border-radius: 99px;
    padding: 0;
  }

  .button__small:hover {
    border: 1px solid var(--color-accent);
    background: var(--bg-secondary-hover);
    color: var(--color-accent);
  }

  .button__small:hover path {
    fill: var(--color-accent);
  }

  .button__small.button__primary:not(:disabled):hover {
    filter: brightness(120%);
    background-color: var(--color-primary);
  }

  .button__small.button__primary {
    color: var(--color-overlay);
    background-color: var(--color-primary);
  }

  .reorder-button {
    margin: 0 1px;
    width: 18px;
    height: 18px;
  }

  .run-button {
    padding: 2px 5px 3px;
    margin: 0 0 0 10px;
  }

  .submit-button {
    height: 42px;
    padding: 13px 16px;
    cursor: pointer;
  }

  .submit-button-text {
    font-weight: 500;
    font-size: 14px;
    line-height: 16px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.75px;
    text-transform: uppercase;
  }

  .hero-rec {
    position: relative;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    border-radius: 4px;
    margin-bottom: 18px;
    padding: 40px;
    background-size: cover;
    background-repeat: no-repeat;
    color: var(--color-white);
  }

  .hero-rec.popup {
    width: 100%;
    padding: 1rem;
    line-height: 0.9;
    margin: 0;
    border-radius: 0;
  }

  .hero-rec.popup h3 {
    margin: 0 0 1rem 0;
  }

  .hero-rec.popup > .dapp-name {
    align-items: center;
  }

  .hero-rec.popup > .dapp-name > img {
    width: 25px;
    margin-right: 10px;
  }

  .error {
    color: var(--color-error);
  }

  .clickable {
    cursor: pointer;
  }

  .no-margin {
    margin: 0;
  }

  .no-top-margin {
    margin-top: 0px;
  }

  .no-bottom-margin {
    margin-bottom: 0px;
  }

  .menu-icon {
    fill: var(--font-color);
  }

  .menu-icon:hover {
    fill: var(--color-accent);
  }

  .input-box {
    background: inherit;
  }

  .input-box-50 {
    background: inherit;
    width: 100%;
  }

  .flow-buttons {
    margin-bottom: 4rem;
  }

  .page .grouped {
    flex-direction: column;
  }

  .page .grouped>:not(:last-child) {
    margin-right: 0px;
  }

  @media (min-width: 480px) {
    .page .grouped {
      flex-direction: inherit;
    }

    .page .grouped>:not(:last-child) {
      margin-right: 16px;
    }

    .input-box-50 {
      width: 50%;
    }

    .flow-buttons {
      margin-bottom: 0rem;
    }
  }

  .inputbox {
    position: relative;
  }

  .inputbox.primary {
    background: var(--bg-color);
  }

  .inputbox.secondary {
    background: var(--color-lightGrey);
  }

  .inputbox-label {
    position: relative;
    top: 8px;
    left: 9px;
    font-style: normal;
    font-weight: normal;
    font-size: 11px;
    line-height: 16px;
    padding: 0 4px;
    color: var(--font-color);
    background: inherit;
  }

  .inputbox-message {
    position: absolute;
    right: 14px;
    bottom: 12px;
  }

  .mainbox {
    display: flex;
    align-items: center;
    width: 100%;

    background: inherit;
    border: 1px solid var(--input-outline);
    box-sizing: border-box;
    transition: border 0.5s;
    border-radius: 4px;
    padding: 10px 12px;

    font-style: normal;
    font-weight: normal;
    font-size: 1.1em;
    line-height: 1;
    color: var(--font-color);
    letter-spacing: 0.44px;
  }

  .mainbox:focus {
    outline: none;
    border: 1px solid var(--color-primary);
  }

  .mainbox::-webkit-input-placeholder {
    font-style: normal;
    font-weight: normal;
    font-size: 1.1em;
    line-height: 1;
    display: flex;
    align-items: center;
    letter-spacing: 0.44px;
    color: var(--font-secondary);
  }

  /* Chrome, Safari, Edge, Opera */
  .mainbox::-webkit-outer-spin-button,
  .mainbox::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  .mainbox[type="number"] {
    -moz-appearance: textfield;
  }

  .mainbox:-webkit-autofill,
  .mainbox:-webkit-autofill:hover,
  .mainbox:-webkit-autofill:focus {
    border: 1px solid var(--outline);
    -webkit-text-fill-color: var(--font-color);
    box-shadow: 0 0 0px 1000px var(--bg-color) inset;
  }

  .flow-layout {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }
  .flow-page {
    flex-grow: 1;
    padding-top: 10px;
    flex-direction: column;
  }
  .flow-content {
    flex-grow: 1;
    display: flex;
  }
  .flow-header {
    display: flex;
    flex-direction: row;
    position: absolute;
    left: 0%;
    right: 0%;
    top: 0%;
    bottom: 0%;
    right: 0;
    height: 6rem;
    border-bottom: 1px solid var(--divider-light);
  }
  .flow-footer {
    text-align: center;
    margin-bottom: 1rem;
  }
  .flow-steps {
    display: flex;
    justify-content: center;
    height: 10rem;
  }

  .flow-hide-steps {
    display: none;
  }
  .flow-content-left {
    box-sizing: border-box;
    padding: 1rem;
    max-height: 500px;
    width: 316px;
    justify-content: flex-start;
  }

  .flow-content-right {
    flex-direction: column;
    justify-content: flex-start;
    flex-grow: 1;
    padding: 1rem;
    max-width: 800px;
  }

  @media (max-width: 480px) {
    .flow-content-left,
    .flow-content-right {
      padding: 0px;
      width: 100%;
    }
  }

  .flow-content-left > .text-box {
    margin: 1rem 0;
  }
  .flow-content-left > .buttons {
    flex-grow: 1;
    max-height: 250px;
    justify-content: flex-end;
  }

  .buttons {
    width: 35rem;
    margin-top: 4rem;
  }

  .flow-text-box {
    font-weight: 300;
    margin-bottom: 1rem;
    line-height: 1.4;
  }

  .flow-buttons {
    flex-grow: 1;
    justify-content: center;
  }

  @media (min-width: 480px) {
    .flex-row {
      flex-direction: row;
    }
    .flow-page {
      flex-direction: row;
    }
  }
  
  @media (min-width: 950px) {
    .flow-content-left {
      padding: 1rem 5% 0;
      min-width: 498px;
    }
    .flow-content-right {
      width: calc(100vw - 625px);
      padding: 1rem 5% 0;
    }
  }

  .spinner {
    animation: rotation 4s infinite linear;
  }

  @keyframes rotation {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-720deg);
    }
  }

  .chk-container {
    display: block;
    position: relative;
    padding-left: 35px;
    margin-bottom: 12px;
    cursor: pointer;
    font-size: 18px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .chk-container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .chk-checkmark {
    position: absolute;
    top: 0;
    left: 0;
    height: 22px;
    width: 22px;
    border-radius: 4px;
    background-color: var(--color-darkGrey);
  }

  .chk-container:hover input ~ .chk-checkmark {
    filter: brightness(75%);
  }

  .chk-container input:checked ~ .chk-checkmark {
    background-color: var(--color-primary);
  }

  .chk-checkmark:after {
    content: "";
    position: absolute;
    display: none;
  }

  .chk-container input:disabled ~ .chk-checkmark {
    background-color: var(--font-secondary);
  }

  .chk-container input:checked ~ .chk-checkmark:after {
    display: block;
  }

  .chk-container .chk-checkmark:after {
    left: 9px;
    top: 4px;
    width: 6px;
    height: 12px;
    border: solid white;
    border-width: 0 3px 3px 0;
    -webkit-transform: rotate(45deg);
    -ms-transform: rotate(45deg);
    transform: rotate(45deg);
  }

  .row-box:hover .nickname {
    text-decoration: underline;
  }

  .show-on-hover {
    display: none;
  }

  .row-box:hover .show-on-hover {
    display: flex;
  }

  .row-box .nickname {
    cursor: pointer;
  }

  .options-box {
    justify-content: center;
    background: inherit;
    border: 1px solid transparent;
  }

  .options-box:first-child {
    margin-right: 1rem;
  }

  .options {
    cursor: pointer;
    box-sizing: border-box;
    align-items: center;
    justify-content: space-between;
    width: 150px;
    height: 95px;
    border-radius: 8px;
    padding: 16px 0;
    margin: 0 0.5rem;
  }
  
  .options-box-primary {
    color: var(--color-white);
    background-color: var(--color-primary);
  }

  .options-box-primary:hover {
    filter: brightness(125%);
  }

  .options-box-grey {
    background-color: var(--color-lightGrey);
    border: 1px solid var(--color-darkGrey);
  }

  .options-box-grey:hover {
    background-color: var(--bg-secondary-hover);
  }

  #copyhelper {
    position: absolute;
    left: -1000px;
    top: -1000px;
  }

  .copy-text {
    cursor: pointer;
  }

  .fade-half {
    opacity: 0.5;
    transition: opacity 1000ms;
  }

  .identicon svg {
    border-radius: 50%;
  }

  .not-overflowed .grouped {
    overflow-x: initial !important;
    overflow-y: initial !important;
  }

  .hidden {
    display: none;
  }

  .button, [type=button], [type=reset], [type=submit], button {
    padding: 1rem 1rem;
  }
</style>
