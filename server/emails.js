const formatEuro = (valor) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor);

const nombreProducto = (linea) => linea.producto['nombre producto'];

function filasProductos(lineas) {
  return lineas
    .map(
      (linea) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #eee;">${nombreProducto(linea)}</td>
        <td style="padding:12px;border-bottom:1px solid #eee;text-align:center;">${linea.cantidad}</td>
        <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">${formatEuro(linea.producto.precio)}</td>
        <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">${formatEuro(linea.producto.precio * linea.cantidad)}</td>
      </tr>`
    )
    .join('');
}

function plantillaBase(titulo, contenido) {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>${titulo}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;color:#18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#000;color:#fff;padding:28px 32px;">
          <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:.7;">Morgam</p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:400;letter-spacing:3px;">${titulo}</h1>
        </td></tr>
        <tr><td style="padding:32px;">${contenido}</td></tr>
        <tr><td style="padding:20px 32px;background:#fafafa;border-top:1px solid #e4e4e7;font-size:12px;color:#71717a;">
          Morgam · Pedido gestionado automáticamente
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function bloqueTotales(pedido) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;font-size:14px;">
      <tr><td style="padding:6px 0;">Subtotal</td><td style="padding:6px 0;text-align:right;">${formatEuro(pedido.subtotal)}</td></tr>
      <tr><td style="padding:6px 0;">Envío</td><td style="padding:6px 0;text-align:right;">${pedido.gastosEnvio === 0 ? 'Gratis' : formatEuro(pedido.gastosEnvio)}</td></tr>
      <tr><td style="padding:12px 0 0;font-size:18px;font-weight:600;border-top:1px solid #eee;">Total</td><td style="padding:12px 0 0;font-size:18px;font-weight:600;text-align:right;border-top:1px solid #eee;">${formatEuro(pedido.total)}</td></tr>
    </table>`;
}

function emailNegocio(pedido) {
  const { cliente, numero, fecha } = pedido;
  const direccion = `${cliente.direccion}, ${cliente.codigoPostal} ${cliente.localidad} (${cliente.provincia})`;

  const contenido = `
    <p style="margin:0 0 8px;font-size:14px;color:#71717a;">Pedido <strong>${numero}</strong> · ${new Date(fecha).toLocaleString('es-ES')}</p>

    <h2 style="margin:28px 0 12px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#71717a;">Cliente</h2>
    <p style="margin:0;line-height:1.7;">
      ${cliente.nombre} ${cliente.apellidos}<br>
      <a href="mailto:${cliente.email}">${cliente.email}</a><br>
      ${cliente.telefono}
    </p>

    <h2 style="margin:28px 0 12px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#71717a;">Dirección de envío</h2>
    <p style="margin:0;line-height:1.7;">${direccion}</p>

    ${cliente.notas ? `<h2 style="margin:28px 0 12px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#71717a;">Notas</h2><p style="margin:0;">${cliente.notas}</p>` : ''}

    <h2 style="margin:28px 0 12px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#71717a;">Productos</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      <thead>
        <tr style="background:#fafafa;">
          <th style="padding:10px 12px;text-align:left;font-weight:500;">Producto</th>
          <th style="padding:10px 12px;text-align:center;font-weight:500;">Cant.</th>
          <th style="padding:10px 12px;text-align:right;font-weight:500;">Precio</th>
          <th style="padding:10px 12px;text-align:right;font-weight:500;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filasProductos(pedido.lineas)}</tbody>
    </table>
    ${bloqueTotales(pedido)}

    <p style="margin:24px 0 0;font-size:13px;color:#71717a;">Forma de pago: <strong>${cliente.metodoPago === 'tarjeta' ? 'Tarjeta (Stripe)' : 'Transferencia bancaria'}</strong></p>`;

  return {
    subject: `Nuevo pedido ${numero} — Morgam`,
    html: plantillaBase('Nuevo pedido recibido', contenido)
  };
}

function emailCliente(pedido, { bankIban, bankBeneficiary, bankConcept, paymentUrl }) {
  const { cliente, numero } = pedido;

  let bloquePago = '';

  if (paymentUrl) {
    bloquePago = `
      <div style="margin-top:28px;padding:20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
        <p style="margin:0 0 12px;font-weight:600;">Paga tu pedido online</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">Puedes completar el pago de forma segura con tarjeta haciendo clic en el botón:</p>
        <a href="${paymentUrl}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:13px;letter-spacing:2px;">PAGAR ${formatEuro(pedido.total)}</a>
      </div>`;
  } else if (bankIban) {
    bloquePago = `
      <div style="margin-top:28px;padding:20px;background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;">
        <p style="margin:0 0 12px;font-weight:600;">Datos para transferencia bancaria</p>
        <p style="margin:0;font-size:14px;line-height:1.8;">
          Beneficiario: <strong>${bankBeneficiary || 'Morgam'}</strong><br>
          IBAN: <strong>${bankIban}</strong><br>
          Concepto: <strong>${bankConcept || numero}</strong><br>
          Importe: <strong>${formatEuro(pedido.total)}</strong>
        </p>
        <p style="margin:16px 0 0;font-size:13px;color:#71717a;">Tu pedido se preparará una vez confirmemos el pago.</p>
      </div>`;
  }

  const contenido = `
    <p style="margin:0;line-height:1.7;">Hola <strong>${cliente.nombre}</strong>,</p>
    <p style="margin:16px 0 0;line-height:1.7;">Gracias por tu compra en Morgam. Hemos recibido tu pedido <strong>${numero}</strong> correctamente.</p>

    <h2 style="margin:28px 0 12px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#71717a;">Resumen del pedido</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      <thead>
        <tr style="background:#fafafa;">
          <th style="padding:10px 12px;text-align:left;font-weight:500;">Producto</th>
          <th style="padding:10px 12px;text-align:center;font-weight:500;">Cant.</th>
          <th style="padding:10px 12px;text-align:right;font-weight:500;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${pedido.lineas
          .map(
            (linea) => `
          <tr>
            <td style="padding:12px;border-bottom:1px solid #eee;">${nombreProducto(linea)}</td>
            <td style="padding:12px;border-bottom:1px solid #eee;text-align:center;">${linea.cantidad}</td>
            <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">${formatEuro(linea.producto.precio * linea.cantidad)}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
    ${bloqueTotales(pedido)}
    ${bloquePago}

    <p style="margin:28px 0 0;font-size:14px;line-height:1.7;">Si tienes alguna duda, responde a este correo y te ayudaremos encantados.</p>`;

  return {
    subject: `Confirmación de pedido ${numero} — Morgam`,
    html: plantillaBase('Tu pedido está confirmado', contenido)
  };
}

module.exports = { emailNegocio, emailCliente };
