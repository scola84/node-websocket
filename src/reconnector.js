import { EventEmitter } from 'events';

export default class Reconnector extends EventEmitter {
  constructor() {
    super();

    this._class = null;
    this._url = null;
    this._protocols = null;
    this._options = null;

    this._codes = [1000, 1001, 1006];
    this._maxAttempts = 10;

    this._attempts = 0;
    this._timeout = null;

    this._handleClose = (e) => this._close(e);
    this._handleError = (e) => this._error(e);
    this._handleOpen = (e) => this._open(e);
  }

  class(value) {
    this._class = value;
    return this;
  }

  url(value) {
    this._url = value;
    return this;
  }

  protocols(value) {
    this._protocols = value;
    return this;
  }

  options(value) {
    this._options = value;
    return this;
  }

  codes(value) {
    this._codes = value;
    return this;
  }

  attempts(value) {
    this._maxAttempts = value;
    return;
  }

  open() {
    clearTimeout(this._timeout);

    this._websocket = new this._class(this._url, this._protocols,
      this._options);

    this._bindSocketError();
    this._bindSocket();
  }

  _bindSocket() {
    this._websocket.addEventListener('close', this._handleClose);
    this._websocket.addEventListener('open', this._handleOpen);
  }

  _unbindSocket() {
    if (this._websocket.removeEventListener) {
      this._websocket.removeEventListener('close', this._handleClose);
      this._websocket.removeEventListener('open', this._handleOpen);
    } else {
      this._websocket.removeListener('close', this._handleClose);
      this._websocket.removeListener('open', this._handleOpen);
    }
  }

  _bindSocketError() {
    this._websocket.addEventListener('error', this._handleError);
  }

  _unbindSocketError() {
    if (this._websocket.removeEventListener) {
      this._websocket.removeEventListener('error', this._handleError);
    } else {
      this._websocket.removeListener('error', this._handleError);
    }
  }

  _close(event) {
    this._unbindSocket();

    if (this._codes.indexOf(event.code) !== -1 &&
      this._attempts < this._maxAttempts) {

      this._reconnect(event);
      return;
    }

    this.emit('close');
  }

  _error(error) {
    this.emit('error', error);
  }

  _open(event) {
    event.attempts = this._attempts;
    event.socket = this._websocket;

    this._attempts = 0;
    this._unbindSocketError();

    this.emit('open', event);
  }

  _reconnect(event) {
    let delay = Math.pow(2, this._attempts);
    this._attempts += 1;

    if (event.reason) {
      const match = event.reason.match(/delay=(\d+)/);

      if (match) {
        delay = Number(match[1]);
      }
    }

    event.attempt = this._attempts;
    event.delay = delay * 1000;

    this._timeout = setTimeout(() => this.open(), event.delay);

    this.emit('reconnect', event);
  }
}
