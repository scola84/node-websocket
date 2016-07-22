export default class WebSocketWrapper {
  constructor(url, protocols, wsClass = WebSocket) {
    this._url = url;
    this._protocols = protocols;
    this._binaryType = typeof WebSocket === 'undefined' ?
      'nodebuffer' : 'blob';

    this._onclose = new Set();
    this._onopen = new Set();
    this._onerror = new Set();
    this._onmessage = new Set();

    this._class = wsClass;

    this._websocket = null;
    this._attempts = 0;
    this._timeout = null;

    this.maxAttempts = 10;
    this.codes = [1000, 1001, 1006];

    this._handleClose = (e) => this._close(e);
    this._handleError = (e) => this._error(e);
    this._handleMessage = (e) => this._message(e);
    this._handleOpen = (e) => this._open(e);

    this.open();
  }

  open() {
    this._websocket = new this._class(this._url, this._protocols);

    this._websocket.binaryType = this._binaryType;
    this._websocket.removeEventListener =
      this._websocket.removeEventListener || this._websocket.removeListener;

    this._bindSocket();
  }

  close(code, reason) {
    this._websocket.close(code, reason);
    this._unbindSocket();

    clearTimeout(this._timeout);

    this._websocket = null;
    this._attempts = 0;
    this._timeout = null;
  }

  send(data) {
    this._websocket.send(data);
  }

  addEventListener(type, listener) {
    this['_on' + type].add(listener);
  }

  addListener(type, listener) {
    this.addEventListener(type, listener);
  }

  removeEventListener(type, listener) {
    this['_on' + type].forEach((registered) => {
      if (registered === listener) {
        this['_on' + type].delete(listener);
      }
    });
  }

  removeListener(type, listener) {
    this.removeEventListener(type, listener);
  }

  _bindSocket() {
    this._websocket.addEventListener('close', this._handleClose);
    this._websocket.addEventListener('error', this._handleError);
    this._websocket.addEventListener('message', this._handleMessage);
    this._websocket.addEventListener('open', this._handleOpen);
  }

  _unbindSocket() {
    this._websocket.removeEventListener('close', this._handleClose);
    this._websocket.removeEventListener('error', this._handleError);
    this._websocket.removeEventListener('message', this._handleMessage);
    this._websocket.removeEventListener('open', this._handleOpen);
  }

  _open() {
    this._onopen.forEach((listener) => {
      listener(this._attempts);
    });

    this._attempts = 0;
  }

  _message(event) {
    this._onmessage.forEach((listener) => {
      listener(event);
    });
  }

  _error(event) {
    if (this._websocket.readyState === this._websocket.CLOSED) {
      return;
    }

    this._onerror.forEach((listener) => {
      listener(event);
    });
  }

  _close(event) {
    if (typeof event === 'number') {
      event = {
        code: event,
        reason: arguments[1]
      };
    }

    this._unbindSocket();

    if (this._attempts === 0 || this._attempts === this.maxAttempts) {
      event.final = this._attempts === this.maxAttempts;

      this._onclose.forEach((listener) => {
        listener(event);
      });
    }

    if (this.codes.indexOf(event.code) !== -1 &&
      this._attempts < this.maxAttempts) {

      this._reconnect(event);
      return;
    }
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

    this._timeout = setTimeout(() => this.open(), delay * 1000);
  }

  get binaryType() {
    return this._websocket.binaryType;
  }

  set binaryType(binaryType) {
    this._binaryType = binaryType;
    this._websocket.binaryType = binaryType;
  }

  get bufferedAmount() {
    return this._websocket.bufferedAmount;
  }

  get extensions() {
    return this._websocket.extensions;
  }

  get onclose() {
    return [...this._onclose][0];
  }

  set onclose(listener) {
    this._onclose.clear();
    this._onclose.add(listener);
  }

  get onerror() {
    return [...this._onerror][0];
  }

  set onerror(listener) {
    this._onerror.clear();
    this._onerror.add(listener);
  }

  get onmessage() {
    return [...this._onmessage][0];
  }

  set onmessage(listener) {
    this._onmessage.clear();
    this._onmessage.add(listener);
  }

  get onopen() {
    return [...this._onopen][0];
  }

  set onopen(listener) {
    this._onopen.clear();
    this._onopen.add(listener);
  }

  get protocol() {
    return this._websocket.protocol;
  }

  get readyState() {
    return this._websocket.readyState;
  }

  get url() {
    return this._websocket.url;
  }

  get CONNECTING() {
    return this._websocket.CONNECTING;
  }

  get OPEN() {
    return this._websocket.OPEN;
  }

  get CLOSING() {
    return this._websocket.CLOSING;
  }

  get CLOSED() {
    return this._websocket.CLOSED;
  }
}
