import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Pedido, RespuestaPedido } from '../models/pedido';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);

  enviar(pedido: Pedido): Promise<RespuestaPedido> {
    return firstValueFrom(this.http.post<RespuestaPedido>('/api/pedido', pedido));
  }
}
