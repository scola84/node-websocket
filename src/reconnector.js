import { EventEmitter } from 'events';

export default class Reconnector extends EventEmitter {
  constructor() {
    super();

    this._factory = null;
    this._url = null;
    this._protocols = null;
    this._options = null;

    this._codes = [1000, 1001, 1006];
    this._maxAttempts = 10;

    this._attempts = 0;
    this._factor = 1;
    this._timeout = null;

    this._handleClose = (e) => this._close(e);
    this._handleError = () => {};
    this._handleOpen = (e) => this._open(e);
  }

  factory(value = null) {
    if (value === null) {
      return this._factory;
    }

    this._factory = value;
    return this;
  }

  url(value = null) {
    if (value === null) {
      return this._url;
    }

    this._url = value;
    return this;
  }

  protocols(value = null) {
    if (value === null) {
      return this._protocols;
    }

    this._protocols = value;
    return this;
  }

  options(value = null) {
    if (value === null) {
      return this._options;
    }

    this._options = value;
    return this;
  }

  codes(value = null) {
    if (value === null) {
      return this._codes;
    }

    this._codes = value;
    return this;
  }

  attempts(value = null) {
    if (value === null) {
      return this._maxAttempts;
    }

    this._maxAttempts = value;
    return this;
  }

  factor(value = null) {
    if (value === null) {
      return this._factor;
    }

    this._factor = value;
    return this;
  }

  open() {
    clearTimeout(this._timeout);

    this._websocket = this._factory(this._url,
      this._protocols, this._options);

    this._websocket.removeEventListener =
      this._websocket.removeEventListener ||
      this._websocket.removeListener;

    this._bindSocket();
  }

  _bindSocket() {
    this._websocket.addEventListener('close', this._handleClose);
    this._websocket.addEventListener('error', this._handleError);
    this._websocket.addEventListener('open', this._handleOpen);
  }

  _unbindSocket() {
    this._websocket.removeEventListener('close', this._handleClose);
    this._websocket.removeEventListener('error', this._handleError);
    this._websocket.removeEventListener('open', this._handleOpen);
  }

  _close(event) {
    this._unbindSocket();

    const reconnect = this._codes.indexOf(event.code) !== -1 &&
      this._maxAttempts === -1 ||
      this._attempts < this._maxAttempts;

    if (reconnect === true) {
      this._reconnect(event);
      return;
    }

    this.emit('close');
  }

  _open(event) {
    event.attempts = this._attempts;
    event.socket = this._websocket;

    this._attempts = 0;

    this.emit('open', event);
  }

  _reconnect(event) {
    let delay = Math.pow(this._factor, this._attempts);
    this._attempts += 1;

    if (typeof event.reason === 'string') {
      const match = event.reason.match(/delay=(\d+)/);
      delay = match === null ? delay : Number(match[1]);
    }

    this._timeout = setTimeout(() => this.open(), delay * 1000);
  }
}
