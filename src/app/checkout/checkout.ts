import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../core/services/carrito.service';
import { PedidoService } from '../core/services/pedido.service';
import { Pedido, ClientePedido } from '../core/models/pedido';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.html'
})
export class Checkout implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly pedidoService = inject(PedidoService);
  readonly carrito = inject(CarritoService);
  enviado = false;
  enviando = false;
  errorEnvio: string | null = null;
  pagoOnlineDisponible = false;

  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9+\s()-]{7,20}$/)]],
    direccion: ['', [Validators.required, Validators.minLength(5)]],
    localidad: ['', Validators.required],
    provincia: ['', Validators.required],
    codigoPostal: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
    notas: [''],
    metodoPago: ['transferencia', Validators.required],
    privacidad: [false, Validators.requiredTrue]
  });

  ngOnInit(): void {
    this.http.get<{ stripe: boolean }>('/api/health').subscribe({
      next: (respuesta) => {
        this.pagoOnlineDisponible = respuesta.stripe;
      },
      error: () => {
        this.pagoOnlineDisponible = false;
      }
    });
  }

  async finalizarPedido(): Promise<void> {
    this.enviado = true;
    this.errorEnvio = null;

    if (this.formulario.invalid || !this.carrito.lineas().length) {
      this.formulario.markAllAsTouched();
      return;
    }

    const numero = `MOR-${Date.now().toString().slice(-8)}`;
    const pedido: Pedido = {
      numero,
      fecha: new Date().toISOString(),
      cliente: this.formulario.getRawValue() as ClientePedido,
      lineas: this.carrito.lineas(),
      subtotal: this.carrito.subtotal(),
      gastosEnvio: this.carrito.gastosEnvio(),
      total: this.carrito.total()
    };

    this.enviando = true;

    try {
      const respuesta = await this.pedidoService.enviar(pedido);

      localStorage.setItem('morgam_ultimo_pedido', JSON.stringify({ ...pedido, paymentUrl: respuesta.paymentUrl }));
      this.carrito.vaciar();

      if (pedido.cliente.metodoPago === 'tarjeta' && respuesta.paymentUrl) {
        window.location.href = respuesta.paymentUrl;
        return;
      }

      await this.router.navigate(['/pedido-confirmado'], {
        queryParams: { numero, metodo: pedido.cliente.metodoPago }
      });
    } catch {
      this.errorEnvio =
        'No se pudo confirmar el pedido. Comprueba tu conexión e inténtalo de nuevo. Si el problema persiste, contáctanos.';
    } finally {
      this.enviando = false;
    }
  }

  campoInvalido(nombre: keyof typeof this.formulario.controls): boolean {
    const campo = this.formulario.controls[nombre];
    return campo.invalid && (campo.touched || this.enviado);
  }
}
