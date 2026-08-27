require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { emailNegocio, emailCliente } = require('./emails');

const app = express();
const PORT = process.env.PORT || 3000;

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const MORGAM_EMAIL = process.env.MORGAM_EMAIL || GMAIL_USER;
const FROM_EMAIL = process.env.FROM_EMAIL || (GMAIL_USER ? `Morgam <${GMAIL_USER}>` : null);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const mailerReady = Boolean(GMAIL_USER && GMAIL_APP_PASSWORD && MORGAM_EMAIL);

const transporter = mailerReady
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD.replace(/\s/g, '')
      }
    })
  : null;

app.use(cors({ origin: [FRONTEND_URL, 'http://localhost:4200'] }));
app.use(express.json({ limit: '1mb' }));

function validarPedido(pedido) {
  if (!pedido?.numero || !pedido?.cliente?.email || !Array.isArray(pedido.lineas) || !pedido.lineas.length) {
    return 'Datos de pedido incompletos.';
  }
  if (typeof pedido.total !== 'number' || pedido.total <= 0) {
    return 'Total de pedido inválido.';
  }
  return null;
}

async function crearEnlacePago(pedido) {
  if (!stripe) return null;

  const lineItems = pedido.lineas.map((linea) => ({
    price_data: {
      currency: 'eur',
      product_data: { name: linea.producto['nombre producto'] },
      unit_amount: Math.round(linea.producto.precio * 100)
    },
    quantity: linea.cantidad
  }));

  if (pedido.gastosEnvio > 0) {
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: { name: 'Gastos de envío' },
        unit_amount: Math.round(pedido.gastosEnvio * 100)
      },
      quantity: 1
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    customer_email: pedido.cliente.email,
    metadata: { pedido: pedido.numero },
    success_url: `${FRONTEND_URL}/pedido-confirmado?numero=${pedido.numero}&pago=ok`,
    cancel_url: `${FRONTEND_URL}/checkout`
  });

  return session.url;
}

async function enviarCorreo({ to, replyTo, subject, html }) {
  return transporter.sendMail({
    from: FROM_EMAIL,
    to,
    replyTo,
    subject,
    html
  });
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    email: mailerReady,
    stripe: Boolean(stripe)
  });
});

app.post('/api/pedido', async (req, res) => {
  const errorValidacion = validarPedido(req.body);
  if (errorValidacion) {
    return res.status(400).json({ ok: false, error: errorValidacion });
  }

  if (!transporter || !mailerReady) {
    return res.status(503).json({
      ok: false,
      error: 'El servicio de correo no está configurado. Contacta con la tienda.'
    });
  }

  const pedido = req.body;
  let paymentUrl = null;

  try {
    if (pedido.cliente.metodoPago === 'tarjeta' && stripe) {
      paymentUrl = await crearEnlacePago(pedido);
    }

    const negocio = emailNegocio(pedido);
    const cliente = emailCliente(pedido, {
      bankIban: process.env.BANK_IBAN,
      bankBeneficiary: process.env.BANK_BENEFICIARY,
      bankConcept: process.env.BANK_CONCEPT || pedido.numero,
      paymentUrl
    });

    await Promise.all([
      enviarCorreo({
        to: MORGAM_EMAIL,
        replyTo: pedido.cliente.email,
        subject: negocio.subject,
        html: negocio.html
      }),
      enviarCorreo({
        to: pedido.cliente.email,
        replyTo: MORGAM_EMAIL,
        subject: cliente.subject,
        html: cliente.html
      })
    ]);

    res.json({ ok: true, paymentUrl });
  } catch (error) {
    console.error('Error al procesar pedido:', error);
    res.status(500).json({
      ok: false,
      error: 'No se pudieron enviar los correos. Revisa la configuración de Gmail e inténtalo de nuevo.'
    });
  }
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor Morgam en http://localhost:${PORT}`);
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.warn('⚠ GMAIL_USER / GMAIL_APP_PASSWORD no configurados');
    }
    if (!MORGAM_EMAIL) console.warn('⚠ MORGAM_EMAIL no configurada');
    if (!stripe) console.warn('ℹ Stripe no configurado — solo transferencia bancaria');
  });
}
