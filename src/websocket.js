'use strict';

import { bind, unbind } from '@scola/bind';

export default class WebSocketWrapper {
  constructor(url, protocols) {
    this._url = url;
    this._protocols = protocols;
    this._binaryType = 'blob';

    this._onclose = new Set();
    this._onopen = new Set();
    this._onerror = new Set();
    this._onmessage = new Set();

    this._websocket = null;
    this._attempts = 0;
    this._timeout = null;

    this.maxAttempts = 10;
    this.codes = [1000, 1001, 1006];

    this.open();
  }

  open() {
    this._websocket = new WebSocket(this._url, this._protocols);
    this._websocket.binaryType = this._binaryType;
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

  removeEventListener(type, listener) {
    this['_on' + type].forEach((registered) => {
      if (registered === listener) {
        this['_on' + type].delete(listener);
      }
    });
  }

  _bindSocket() {
    bind(this, this._websocket, 'close', this._handleClose);
    bind(this, this._websocket, 'error', this._handleError);
    bind(this, this._websocket, 'message', this._handleMessage);
    bind(this, this._websocket, 'open', this._handleOpen);
  }

  _unbindSocket() {
    unbind(this, this._websocket, 'close', this._handleClose);
    unbind(this, this._websocket, 'error', this._handleError);
    unbind(this, this._websocket, 'message', this._handleMessage);
    unbind(this, this._websocket, 'open', this._handleOpen);
  }

  _handleOpen() {
    this._onopen.forEach((listener) => {
      listener(this._attempts);
    });

    this._attempts = 0;
  }

  _handleMessage(event) {
    this._onmessage.forEach((listener) => {
      listener(event);
    });
  }

  _handleError(event) {
    if (this._websocket.readyState === this._websocket.CLOSED) {
      return;
    }

    this._onerror.forEach((listener) => {
      listener(event);
    });
  }

  _handleClose(event) {
    this._unbindSocket();

    if (this._attempts === 0 || this._attempts === this.maxAttempts) {
      event.final = this._attempts === this.maxAttempts;

      this._onclose.forEach((listener) => {
        listener(event);
      });
    }

    if (this.codes.indexOf(event.code) !== -1 &&
      this._attempts < this.maxAttempts) {

      this._handleReconnect(event);
      return;
    }
  }

  _handleReconnect(event) {
    let delay = Math.pow(2, this._attempts);
    this._attempts += 1;

    if (event.reason) {
      const match = event.reason.match(/delay=(\d+)/);

      if (match) {
        delay = Number(match[1]);
      }
    }

    this._timeout = setTimeout(this.open.bind(this), delay * 1000);
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
