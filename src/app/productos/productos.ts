import {
  Component,
  HostListener,
  AfterViewInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RevealDirective } from '../shared/directives/reveal';
import { RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { CarritoService } from '../core/services/carrito.service';
import { Producto } from '../core/models/producto';

import productosJson from '../../assets/productos.json';

@Component({
  selector: 'app-productos',
   imports: [
    CommonModule,
    RevealDirective,
    RouterLink
  ],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos implements AfterViewInit {

  private readonly carrito = inject(CarritoService);

  isScrolled = false;

  productos = productosJson;
agregarAlCarrito(producto: Producto): void {
    this.carrito.agregar(producto);
  }
  @HostListener('window:scroll', [])
  onScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  ngAfterViewInit(): void {
    const image = document.getElementById('heroImage');

    window.addEventListener('scroll', () => {
      const scroll = window.scrollY;

      if (image) {
        image.style.transform =
          `scale(1.1) translateY(${scroll * 0.2}px)`;
      }
    });
  }
}
