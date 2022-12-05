import EventEmitter from 'eventemitter3';

const TIMEOUT_INTERVAL_IN_SECONDS = 60*5; // 5 minutes and response timeout will be issued

export default class Provider extends EventEmitter {
  _log;
  _state;
  _defaultState = {
    accounts: null,
    isConnected: false,
    isLocked: false,
    initialized: false,
    isPermanentlyDisconnected: false,
  };

  endpoint = null;

  /**
   * The currently selected address.
   * If null, there it is either locked or the user has not permitted any addresses to be viewed.
   */
  selectedAddress = null;

  constructor(logger = console) {
    super();

    // set property that it is XTON wallet
    this.isXTonWallet = true;
    this.isTEP100 = true;

    // private state
    this._log = logger;

    // private state
    this._state = this._defaultState;

    // public state
    this.selectedAddress = null;
    this.endpoint = null;

    // bind functions (to prevent consumers from making unbound calls)
    // private methods
    this._handleAccountChanged = this._handleAccountChanged.bind(this);
    this._handleConnect = this._handleConnect.bind(this);
    this._handleEndpointChanged = this._handleEndpointChanged.bind(this);
    this._handleUnlockStateChanged = this._handleUnlockStateChanged.bind(this);

    // public method
    this.request = this.request.bind(this);

    // setup own event listeners TEP-99
    this.on('connect', () => {
      this._state.isConnected = true;
    });

    this.on('accountChanged', (params) => {
      this._handleAccountChanged(params);
    });

    this.on('unlockStateChanged', (params) => {
      this._handleUnlockStateChanged(params);
    });

    this.on('endpointChanged', (params) => {
      this._handleEndpointChanged(params);
    });

/*
    this.on('ton_subscription', (params) => {
      this.emit('message', {
        type: 'ton_subscription',
        data: params,
      });
    });
*/

    this._initializeState();
  }

  //====================
  // Public Methods
  //====================

  /**
   * Returns whether the provider can process RPC requests.
   */
  isConnected() {
    return this._state.isConnected;
  }

  /**
   * Submits an RPC request for the given method, with the given params.
   * Resolves with the result of the method call, or rejects on error.
   *
   * @param args - The RPC request arguments.
   * @param args.method - The RPC method name.
   * @param args.params - The parameters for the RPC method.
   * @returns A Promise that resolves with the result of the RPC method,
   * or rejects if an error is encountered.
   */
  request(args) {
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      return Promise.reject({code: 0, message: 'Invaid request'});
    }

    const { method, params } = args;

    if (typeof method !== 'string' || method.length === 0) {
      return Promise.reject({code: 0, message: 'Invaid request'});
    }

    if (params !== undefined && !Array.isArray(params) && (typeof params !== 'object' || params === null)) {
      return Promise.reject({code: 0, message: 'Invaid request'});
    }

    return new Promise((resolve, reject) => {
      const uniqueId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      window.dispatchEvent(new CustomEvent('xtonwallet-request', {
        detail: {'id': uniqueId, 'method': method, 'params': params},
      }));

      const listener = (event) => {
        clearInterval(tracker);
        if (event.detail.code == 4000) {
          resolve(event.detail.data);
        } else {
          reject(event.detail);
        }
      };

      window.addEventListener(`xtonwallet-response-${uniqueId}`, listener);

      let tracker = setInterval(function() {
        //Need to clear memory if no response
        window.removeEventListener(`xtonwallet-response-${uniqueId}`, listener);
        clearInterval(tracker);
        reject({code: 0, message: 'Response timeout'});
      }, TIMEOUT_INTERVAL_IN_SECONDS*1000); // in TIMEOUT_INTERVAL_IN_SECONDS seconds will be rejected
      
      //Need to clear memory in timeout + 10 seconds
      let trackerRemoveEventListener = setInterval(function() {
        clearInterval(trackerRemoveEventListener);
        window.removeEventListener(`xtonwallet-response-${uniqueId}`, listener);
      }, (TIMEOUT_INTERVAL_IN_SECONDS + 10) *1000);
    });
  }

  //====================
  // Private Methods
  //====================

  /**
   * Constructor helper.
   * Populates initial state by calling 'getProviderState' and emits necessary events.
   */
  async _initializeState() {
    try {
      const {account, endpoint, isLocked} = await this.request({ method: 'getProviderState'});

      // indicate that we've connected, for TEPs-83 compliance
      this.emit('connect', endpoint);

      this._handleEndpointChanged(endpoint);
      this._handleUnlockStateChanged({ account, isLocked });
      this._handleAccountChanged(account);
    } catch (error) {
      this._log.error(
        'XTON wallet: Failed to get initial state. Please report this bug.',
        error,
      );
    } finally {
      this._state.initialized = true;
      this.emit('_initialized');
    }
  }

  /**
   * When the provider becomes connected, updates internal state and emits
   * required events. Idempotent.
   *
   * @param endpoint - The newly connected endpoint.
   * @emits connect
   */
  _handleConnect(endpoint) {
    if (!this._state.isConnected) {
      this._state.isConnected = true;
      this.emit('connect', endpoint);
    }
  }

  /**
   * Upon receipt of a new endpoint sets relevant public state.
   * Does nothing if the endpoint is different from existing value.
   *
   * @emits endpointChanged
   * @param endpoint - The endpoint info.
   */
  _handleEndpointChanged(endpoint) {
    if ((!endpoint && endpoint != null) || endpoint == "") {
      this._log.error(
        'XTON wallet: Received invalid network parameters. Please report this bug.',
        endpoint,
      );
      return;
    }

    this._handleConnect(endpoint);

    if (endpoint !== this.endpoint) {
      this.endpoint = endpoint;
    }
  }

  /**
   * Called when account may has changed. Diffs the new account value with
   * the current one, updates all state as necessary.
   *
   * @param account - The new account value.
   */
  _handleAccountChanged(account) {
    // emit accountChanged if account has changed
    if (this._state.account != account) {
      this._state.account = account;

      // handle selectedAddress
      if (this.selectedAddress !== account) {
        this.selectedAddress = account || null;
      }
    }
  }

  /**
   * Upon receipt of a new isLocked state, sets relevant public state.
   * Calls the accounts changed handler with the received accounts, or an empty
   * array.
   *
   * Does nothing if the received value is equal to the existing value.
   * There are no lock/unlock events.
   *
   * @param opts - Options bag.
   * @param opts.account - The exposed account, if any.
   * @param opts.isLocked - The latest isLocked value.
   */
  _handleUnlockStateChanged({ account, isLocked }) {
    if (typeof isLocked !== 'boolean') {
      this._log.error(
        'XTON wallet: Received invalid isLocked parameter. Please report this bug.',
      );
      return;
    }

    if (isLocked !== this._state.isLocked) {
      this._state.isLocked = isLocked;
      this._handleAccountChanged(account);
    }
  }
}
