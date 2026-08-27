import { Routes } from '@angular/router';
import { Inicio } from './inicio/inicio';
import { Productos } from './productos/productos';
import { Carrito } from './carrito/carrito';
import { Checkout } from './checkout/checkout';
import { PedidoConfirmado } from './pedido-confirmado/pedido-confirmado';

export const routes: Routes = [
  { path: '', component: Inicio, title: 'Morgam | Sabores artesanales' },
  { path: 'productos', component: Productos, title: 'Productos | Morgam' },
  { path: 'carrito', component: Carrito, title: 'Carrito | Morgam' },
  { path: 'checkout', component: Checkout, title: 'Finalizar pedido | Morgam' },
  { path: 'pedido-confirmado', component: PedidoConfirmado, title: 'Pedido confirmado | Morgam' },
  { path: '**', redirectTo: '' }
];
