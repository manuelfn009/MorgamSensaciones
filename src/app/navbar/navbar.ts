import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';
import { filter } from 'rxjs';

import { CarritoService } from '../core/services/carrito.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {

  menuAbierto = false;
  isScrolled = false;
  estaEnCarrito = false;

  constructor(
    public carritoService: CarritoService,
    private router: Router
  ) {
    this.comprobarRuta(this.router.url);

    this.router.events
      .pipe(
        filter(
          evento => evento instanceof NavigationEnd
        )
      )
      .subscribe(evento => {
        const navigationEnd = evento as NavigationEnd;
        this.comprobarRuta(navigationEnd.urlAfterRedirects);
        this.cerrarMenu();
      });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  alternarMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  private comprobarRuta(url: string): void {
    this.estaEnCarrito =
      url.startsWith('/carrito') ||
      url.startsWith('/checkout') ||
      url.startsWith('/pedido-confirmado');
  }
}