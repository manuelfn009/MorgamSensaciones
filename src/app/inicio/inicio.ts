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
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CommonModule,
    RevealDirective,
    RouterLink
  ],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css'],
})
export class Inicio implements AfterViewInit {

  private readonly carrito = inject(CarritoService);

  isScrolled = false;

  productos = productosJson;
 
  productosDestacados = this.productos.filter(producto =>
  [
    'Almogrote 100g',
    'Mojo picón',
    'Mojo verde'
  ].includes(producto['nombre producto'])
);
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