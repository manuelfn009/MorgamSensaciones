export interface Producto {
  'nombre producto': string;
  descripcion: string;
  precio: number;
  ruta_imagen: string;
}

export interface LineaCarrito {
  producto: Producto;
  cantidad: number;
}
