import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-pedido-confirmado',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pedido-confirmado.html'
})
export class PedidoConfirmado {
  private readonly route = inject(ActivatedRoute);
  readonly numero = this.route.snapshot.queryParamMap.get('numero') ?? 'MORGAM';
  readonly pagoOk = this.route.snapshot.queryParamMap.get('pago') === 'ok';
  readonly metodoTransferencia = this.route.snapshot.queryParamMap.get('metodo') === 'transferencia';
}
