<template>
  <div class="app-container">
    <header class="header">
      <h1>🏨 Hotel Booking - Reserva de Habitaciones</h1>
      <div class="status">
        <span :class="connected ? 'connected' : 'disconnected'">
          {{ connected ? '🟢 Conectado' : '🔴 Desconectado' }}
        </span>
        <span class="session-id">ID: {{ sessionId }}</span>
      </div>
    </header>

    <main class="main-content">
      <!-- Información del Hotel -->
      <div class="hotel-info">
        <div class="info-card">
          <h2>{{ hotel.nombre }}</h2>
          <p>{{ hotel.direccion }}</p>
          <div class="dates">
            <div class="date-input">
              <label>Check-in:</label>
              <input type="date" v-model="fechaCheckIn" :min="hoy" />
            </div>
            <div class="date-input">
              <label>Check-out:</label>
              <input type="date" v-model="fechaCheckOut" :min="fechaCheckIn || hoy" />
            </div>
          </div>
          <div class="guests">
            <label>Huéspedes:</label>
            <select v-model="numHuespedes">
              <option v-for="n in 8" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>

        <div class="legend">
          <div class="legend-item">
            <div class="room-legend disponible"></div>
            <span>Disponible</span>
          </div>
          <div class="legend-item">
            <div class="room-legend seleccionada"></div>
            <span>Seleccionada</span>
          </div>
          <div class="legend-item">
            <div class="room-legend reservada"></div>
            <span>Reservada</span>
          </div>
          <div class="legend-item">
            <div class="room-legend ocupada"></div>
            <span>Ocupada</span>
          </div>
        </div>
      </div>

      <!-- Vista de Habitaciones por Piso -->
      <div class="floors-container">
        <div v-for="piso in pisos" :key="piso.numero" class="floor-section">
          <h3 class="floor-title">Piso {{ piso.numero }}</h3>
          <div class="rooms-grid">
            <div
              v-for="habitacion in piso.habitaciones"
              :key="habitacion.numero"
              class="room-card"
              :class="{
                disponible: habitacion.estado === 'disponible',
                seleccionada: habitacion.seleccionada,
                reservada: habitacion.estado === 'reservada',
                ocupada: habitacion.estado === 'ocupada'
              }"
              @click="toggleHabitacion(habitacion)"
            >
              <div class="room-number">{{ habitacion.numero }}</div>
              <div class="room-type">{{ habitacion.tipo }}</div>
              <div class="room-capacity">👥 {{ habitacion.capacidad }}</div>
              <div class="room-price">${{ habitacion.precio.toLocaleString() }}</div>
              <div v-if="habitacion.reservadaPor" class="room-reserved-by">
                Reservada por: {{ habitacion.reservadaPor }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen de Reserva -->
      <div v-if="habitacionesSeleccionadas.length > 0" class="reservation-summary">
        <h3>Resumen de Reserva</h3>
        <div class="selected-rooms">
          <div v-for="hab in habitacionesSeleccionadas" :key="hab.numero" class="selected-room">
            <span>{{ hab.numero }} - {{ hab.tipo }}</span>
            <span>${{ hab.precio.toLocaleString() }}</span>
          </div>
        </div>
        <div class="total">
          <strong>Total: ${{ totalReserva.toLocaleString() }}</strong>
        </div>
        <button class="btn-reservar" @click="reservar">Reservar Habitaciones</button>
      </div>
    </main>

    <!-- Panel de Actividad -->
    <aside class="activity-panel">
      <h3>Actividad</h3>
      <div class="messages">
        <div v-for="(msg, idx) in mensajes" :key="idx" class="message">
          {{ msg }}
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { RelayService } from './services/relay.js';

const relay = new RelayService();
const connected = ref(false);
const sessionId = ref(relay.sessionId);
const mensajes = ref([]);

const hoy = new Date().toISOString().split('T')[0];
const fechaCheckIn = ref(hoy);
const fechaCheckOut = ref(new Date(Date.now() + 86400000).toISOString().split('T')[0]);

const numHuespedes = ref(2);

const hotel = ref({
  nombre: 'Grand Hotel Paradise',
  direccion: 'Av. Principal 123, Ciudad'
});

const pisos = ref([]);
const habitacionesSeleccionadas = ref([]);

const totalReserva = computed(() => {
  return habitacionesSeleccionadas.value.reduce((sum, hab) => sum + hab.precio, 0);
});

function inicializarHabitaciones() {
  const tipos = ['Standard', 'Deluxe', 'Suite', 'Presidencial'];
  const pisosArray = [];
  
  // 5 pisos, cada uno con diferentes habitaciones
  for (let pisoNum = 1; pisoNum <= 5; pisoNum++) {
    const habitaciones = [];
    const habitacionesPorPiso = pisoNum === 5 ? 8 : 12; // Piso 5 tiene menos habitaciones
    
    for (let i = 1; i <= habitacionesPorPiso; i++) {
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const precios = { Standard: 50000, Deluxe: 80000, Suite: 120000, Presidencial: 200000 };
      const capacidades = { Standard: 2, Deluxe: 3, Suite: 4, Presidencial: 6 };
      
      habitaciones.push({
        numero: `${pisoNum}${String(i).padStart(2, '0')}`,
        piso: pisoNum,
        tipo: tipo,
        capacidad: capacidades[tipo],
        precio: precios[tipo],
        estado: Math.random() > 0.3 ? 'disponible' : 'ocupada',
        seleccionada: false,
        reservadaPor: null
      });
    }
    
    pisosArray.push({
      numero: pisoNum,
      habitaciones: habitaciones
    });
  }
  
  pisos.value = pisosArray;
}

function toggleHabitacion(habitacion) {
  if (habitacion.estado !== 'disponible') return;
  
  habitacion.seleccionada = !habitacion.seleccionada;
  
  if (habitacion.seleccionada) {
    habitacionesSeleccionadas.value.push(habitacion);
  } else {
    const index = habitacionesSeleccionadas.value.findIndex(h => h.numero === habitacion.numero);
    if (index > -1) {
      habitacionesSeleccionadas.value.splice(index, 1);
    }
  }
  
  // Notificar a otros usuarios
  relay.enviarATodos({
    tipo: 'habitacion_toggle',
    numero: habitacion.numero,
    seleccionada: habitacion.seleccionada,
    sessionId: sessionId.value
  });
}

function reservar() {
  if (habitacionesSeleccionadas.value.length === 0) {
    agregarMensaje('Selecciona al menos una habitación');
    return;
  }
  
  const numerosHabitaciones = habitacionesSeleccionadas.value.map(h => h.numero);
  
  // Notificar reserva
  relay.enviarATodos({
    tipo: 'habitacion_reservada',
    habitaciones: numerosHabitaciones,
    usuario: sessionId.value,
    checkIn: fechaCheckIn.value,
    checkOut: fechaCheckOut.value,
    huespedes: numHuespedes.value
  });
  
  // Actualizar estado local
  habitacionesSeleccionadas.value.forEach(hab => {
    const habitacion = encontrarHabitacion(hab.numero);
    if (habitacion) {
      habitacion.estado = 'reservada';
      habitacion.seleccionada = false;
      habitacion.reservadaPor = sessionId.value;
    }
  });
  
  habitacionesSeleccionadas.value = [];
  agregarMensaje(`Reservadas: ${numerosHabitaciones.join(', ')}`);
}

function encontrarHabitacion(numero) {
  for (const piso of pisos.value) {
    const hab = piso.habitaciones.find(h => h.numero === numero);
    if (hab) return hab;
  }
  return null;
}

function manejarMensaje(msg) {
  switch (msg.tipo) {
    case 'habitacion_toggle':
      if (msg.sessionId !== sessionId.value) {
        const hab = encontrarHabitacion(msg.numero);
        if (hab) {
          hab.seleccionada = msg.seleccionada;
        }
      }
      break;
    case 'habitacion_reservada':
      msg.habitaciones.forEach(numero => {
        const hab = encontrarHabitacion(numero);
        if (hab) {
          hab.estado = 'reservada';
          hab.seleccionada = false;
          hab.reservadaPor = msg.usuario;
        }
      });
      if (msg.usuario !== sessionId.value) {
        agregarMensaje(`⚡ Habitaciones ${msg.habitaciones.join(', ')} reservadas por otro usuario`);
      }
      break;
    case 'sync_response':
      if (msg.habitacionesReservadas) {
        msg.habitacionesReservadas.forEach(({ numero, usuario }) => {
          const hab = encontrarHabitacion(numero);
          if (hab) {
            hab.estado = 'reservada';
            hab.reservadaPor = usuario;
          }
        });
      }
      break;
  }
}

function agregarMensaje(mensaje) {
  mensajes.value.unshift(mensaje);
  if (mensajes.value.length > 20) {
    mensajes.value = mensajes.value.slice(0, 20);
  }
}

onMounted(async () => {
  inicializarHabitaciones();
  
  relay.on('connect', () => {
    connected.value = true;
    agregarMensaje('Conectado a Relay Gateway');
    
    // Solicitar sincronización
    relay.enviarATodos({
      tipo: 'sync_request',
      sessionId: sessionId.value
    });
  });
  
  relay.on('disconnect', () => {
    connected.value = false;
    agregarMensaje('Desconectado de Relay Gateway');
  });
  
  relay.on('message', (msg) => {
    manejarMensaje(msg);
  });
  
  try {
    await relay.connect();
    // Verificar el estado de conexión después de conectar
    // (por si el evento 'connect' ya se emitió antes de registrar el listener)
    if (relay.connected) {
      connected.value = true;
      agregarMensaje('Conectado a Relay Gateway');
      relay.enviarATodos({
        tipo: 'sync_request',
        sessionId: sessionId.value
      });
    }
  } catch (error) {
    agregarMensaje('Error al conectar: ' + error.message);
  }
});

onUnmounted(() => {
  relay.disconnect();
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-template-rows: auto 1fr;
  gap: 1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  grid-column: 1 / -1;
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 1.8rem;
  color: #333;
  font-weight: 600;
}

.status {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.status .connected {
  color: #10b981;
  font-weight: 600;
}

.status .disconnected {
  color: #ef4444;
  font-weight: 600;
}

.session-id {
  background: #f3f4f6;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #4b5563;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
}

.hotel-info {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.info-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  flex: 1;
  min-width: 300px;
}

.info-card h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.info-card p {
  color: #6b7280;
  margin-bottom: 1rem;
}

.dates {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.date-input {
  flex: 1;
}

.date-input label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
  color: #4b5563;
}

.date-input input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.guests {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.guests label {
  font-size: 0.9rem;
  color: #4b5563;
}

.guests select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.legend {
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.room-legend {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid #d1d5db;
}

.room-legend.disponible {
  background: #dbeafe;
  border-color: #3b82f6;
}

.room-legend.seleccionada {
  background: #fef3c7;
  border-color: #f59e0b;
}

.room-legend.reservada {
  background: #fee2e2;
  border-color: #ef4444;
}

.room-legend.ocupada {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.floors-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.floor-section {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.floor-title {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #1f2937;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.room-card {
  background: #f9fafb;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.room-card:hover:not(.ocupada):not(.reservada) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.room-card.disponible {
  background: #dbeafe;
  border-color: #3b82f6;
}

.room-card.seleccionada {
  background: #fef3c7;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.3);
  animation: pulse 1s infinite;
}

.room-card.reservada {
  background: #fee2e2;
  border-color: #ef4444;
  opacity: 0.7;
  cursor: not-allowed;
}

.room-card.ocupada {
  background: #e5e7eb;
  border-color: #9ca3af;
  opacity: 0.5;
  cursor: not-allowed;
}

.room-number {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.room-type {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.room-capacity {
  font-size: 0.8rem;
  color: #4b5563;
  margin-bottom: 0.25rem;
}

.room-price {
  font-size: 1rem;
  font-weight: 600;
  color: #059669;
  margin-top: 0.5rem;
}

.room-reserved-by {
  font-size: 0.75rem;
  color: #dc2626;
  margin-top: 0.5rem;
  font-style: italic;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.3);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.1);
  }
}

.reservation-summary {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: sticky;
  bottom: 0;
}

.reservation-summary h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #1f2937;
}

.selected-rooms {
  margin-bottom: 1rem;
}

.selected-room {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.total {
  font-size: 1.2rem;
  padding: 1rem;
  background: #fef3c7;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 1rem;
}

.btn-reservar {
  width: 100%;
  padding: 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reservar:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.activity-panel {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.activity-panel h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #1f2937;
}

.messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message {
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #4b5563;
}

@media (max-width: 1200px) {
  .app-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto;
  }

  .activity-panel {
    max-height: 200px;
  }
}
</style>
