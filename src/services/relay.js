import { io } from 'socket.io-client';

export class RelayService {
  constructor() {
    this.socket = null;
    this.RELAY_URL = this.getRelayUrl();
    this.sessionId = this.getSessionId();
    this.connected = false;
    this.identified = false;
    this.listeners = new Map();
  }

  getRelayUrl() {
    if (typeof window === 'undefined') {
      return 'http://localhost:5000';
    }
    if (window.location.hostname === 'localhost' && window.location.port === '8000') {
      return 'http://localhost:5000';
    }
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  getSessionId() {
    let id = localStorage.getItem('hotelSession');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('hotelSession', id);
    }
    return id;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(`${this.RELAY_URL}/relay`, {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('[Relay] Conectado:', this.socket.id);
        this.connected = true;
        
        this.socket.emit('identificar', this.sessionId, (ok) => {
          this.identified = ok;
          console.log('[Relay] Identificado:', this.sessionId);
        });
        
        // Emitir evento 'connect' para que los listeners puedan reaccionar
        this.emit('connect');
        
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Relay] Desconectado:', reason);
        this.connected = false;
        this.identified = false;
        this.emit('disconnect', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('[Relay] Error:', error.message);
        reject(error);
      });

      this.socket.on('relay', (data) => {
        this.emit('message', data);
      });

      this.socket.on('notificar', (data) => {
        this.emit('message', { ...data, _channel: 'notificar' });
      });
    });
  }

  enviar(data, destino = 'nosotros') {
    this.socket?.emit('relay', { ...data, destino });
  }

  enviarATodos(data) {
    this.enviar(data, 'nosotros');
  }

  enviarAOtros(data) {
    this.enviar(data, 'ustedes');
  }

  enviarAMi(data) {
    this.enviar(data, 'yo');
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.connected = false;
  }
}

