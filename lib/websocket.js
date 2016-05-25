class WebSocketWrapper {
  constructor(url, protocols) {
    this._url = url;
    this._protocols = protocols;
    this._binaryType = 'blob';

    this._onclose = null;
    this._onopen = null;
    this._onerror = null;
    this._onmessage = null;

    this.websocket = null;
    this.attempts = 0;

    this.maxAttempts = 10;
    this.codes = [1000, 1001, 1006];

    this.open();
  }

  open() {
    this.websocket = new WebSocket(this._url, this._protocols);
    this.websocket.binaryType = this._binaryType;
    this.bindSocket();
  }

  bindSocket() {
    this.websocket.onclose = this.handleClose.bind(this);
    this.websocket.onerror = this.handleError.bind(this);
    this.websocket.onmessage = this._onmessage;
    this.websocket.onopen = this.handleOpen.bind(this);
  }

  unbindSocket() {
    this.websocket.onclose = null;
    this.websocket.onerror = null;
    this.websocket.onmessage = null;
    this.websocket.onopen = null;
  }

  handleOpen() {
    if (this._onopen) {
      this._onopen(this.attempts);
    }

    this.attempts = 0;
  }

  handleError(event) {
    if (this.websocket.readyState === this.websocket.CLOSED) {
      return;
    }

    if (this._onerror) {
      this._onerror(event);
    }
  }

  handleClose(event) {
    this.unbindSocket();

    if (this.codes.indexOf(event.code) !== -1 &&
      this.attempts < this.maxAttempts) {

      this.handleReconnect(event);
      return;
    }

    if (this._onclose) {
      this._onclose(event);
    }
  }

  handleReconnect(event) {
    let delay = Math.pow(2, this.attempts);
    this.attempts += 1;

    if (event.reason) {
      const match = event.reason.match(/delay=(\d+)/);

      if (match) {
        delay = Number(match[1]);
      }
    }

    setTimeout(this.open.bind(this), delay * 1000);
  }

  get binaryType() {
    return this.websocket.binaryType;
  }

  set binaryType(binaryType) {
    this.websocket.binaryType = binaryType;
  }

  get bufferedAmount() {
    return this.websocket.bufferedAmount;
  }

  get extensions() {
    return this.websocket.extensions;
  }

  get onclose() {
    return this._onclose;
  }

  set onclose(listener) {
    this._onclose = listener;
  }

  get onerror() {
    return this._onclose;
  }

  set onerror(listener) {
    this._onerror = listener;
  }

  get onmessage() {
    return this._onmessage;
  }

  set onmessage(listener) {
    this._onmessage = listener;
    this.websocket.onmessage = listener;
  }

  get onopen() {
    return this._onopen;
  }

  set onopen(listener) {
    this._onopen = listener;
  }

  get protocol() {
    return this.websocket.protocol;
  }

  get readyState() {
    return this.websocket.readyState;
  }

  get url() {
    return this.websocket.url;
  }

  get CONNECTING() {
    return this.websocket.CONNECTING;
  }

  get OPEN() {
    return this.websocket.OPEN;
  }

  get CLOSING() {
    return this.websocket.CLOSING;
  }

  get CLOSED() {
    return this.websocket.CLOSED;
  }

  close(code, reason) {
    this.websocket.close(code, reason);
  }

  send(data) {
    this.websocket.send(data);
  }
}

module.exports = WebSocketWrapper;
