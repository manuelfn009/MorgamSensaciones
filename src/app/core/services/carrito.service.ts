import { Injectable, computed, signal } from '@angular/core';
import { LineaCarrito, Producto } from '../models/producto';

const STORAGE_KEY = 'morgam_carrito';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly lineasSignal = signal<LineaCarrito[]>(this.cargar());

  readonly lineas = this.lineasSignal.asReadonly();
  readonly cantidadTotal = computed(() =>
    this.lineasSignal().reduce((total, linea) => total + linea.cantidad, 0)
  );
  readonly subtotal = computed(() =>
    this.lineasSignal().reduce(
      (total, linea) => total + linea.producto.precio * linea.cantidad,
      0
    )
  );
  readonly gastosEnvio = computed(() => {
    const subtotal = this.subtotal();
    return subtotal === 0 || subtotal >= 45 ? 0 : 4.95;
  });
  readonly total = computed(() => this.subtotal() + this.gastosEnvio());

  agregar(producto: Producto): void {
    const lineas = [...this.lineasSignal()];
    const indice = lineas.findIndex(
      linea => linea.producto['nombre producto'] === producto['nombre producto']
    );

    if (indice >= 0) {
      lineas[indice] = { ...lineas[indice], cantidad: lineas[indice].cantidad + 1 };
    } else {
      lineas.push({ producto, cantidad: 1 });
    }

    this.actualizar(lineas);
  }

  cambiarCantidad(nombreProducto: string, cantidad: number): void {
    if (cantidad <= 0) {
      this.eliminar(nombreProducto);
      return;
    }

    this.actualizar(
      this.lineasSignal().map(linea =>
        linea.producto['nombre producto'] === nombreProducto
          ? { ...linea, cantidad }
          : linea
      )
    );
  }

  eliminar(nombreProducto: string): void {
    this.actualizar(
      this.lineasSignal().filter(
        linea => linea.producto['nombre producto'] !== nombreProducto
      )
    );
  }

  vaciar(): void {
    this.actualizar([]);
  }

  private actualizar(lineas: LineaCarrito[]): void {
    this.lineasSignal.set(lineas);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lineas));
    }
  }

  private cargar(): LineaCarrito[] {
    if (typeof localStorage === 'undefined') return [];

    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      return guardado ? (JSON.parse(guardado) as LineaCarrito[]) : [];
    } catch {
      return [];
    }
  }
}
