import { LineaCarrito } from './producto';

export interface ClientePedido {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  notas: string;
  metodoPago: 'transferencia' | 'tarjeta';
  privacidad: boolean;
}

export interface Pedido {
  numero: string;
  fecha: string;
  cliente: ClientePedido;
  lineas: LineaCarrito[];
  subtotal: number;
  gastosEnvio: number;
  total: number;
}

export interface RespuestaPedido {
  ok: boolean;
  paymentUrl?: string;
  error?: string;
}
