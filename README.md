# Morgam

Tienda web en Angular con carrito, checkout, correos de pedido (Gmail) y pago opcional con Stripe.

## Requisitos

- [Node.js](https://nodejs.org/) 20 o superior
- Una cuenta de Gmail (para enviar correos)
- (Opcional) Cuenta en [Stripe](https://stripe.com) (pago con tarjeta)
- (Opcional) Cuenta en [Vercel](https://vercel.com) (despliegue)

---

## 1. Instalar el proyecto en local

```bash
npm install
copy .env.example .env
```

En macOS/Linux: `cp .env.example .env`

Edita el archivo `.env` con tus datos (ver secciones siguientes).

Arrancar frontend + API de correos:

```bash
npm run dev
```

- Web: http://localhost:4200/
- API: http://localhost:3000/

Solo frontend: `npm start`  
Solo API: `npm run server`

---

## 2. Configurar Gmail (obligatorio para los correos)

Al confirmar un pedido se envían **dos correos**:

1. A la tienda (`MORGAM_EMAIL`): productos, dirección y datos del cliente.
2. Al cliente: resumen, total e instrucciones de pago.

### Paso a paso en Google

1. Entra en tu cuenta Google: https://myaccount.google.com/
2. Activa la **verificación en 2 pasos**:  
   https://myaccount.google.com/signinoptions/two-step-verification  
   Sin esto no podrás crear contraseñas de aplicación.
3. Crea una **contraseña de aplicación**:  
   https://myaccount.google.com/apppasswords  
   - Elige “Correo” o “Otra” → nombre `Morgam`.  
   - Google te da 16 caracteres (pueden ir con espacios).
4. Pon en tu `.env`:

```env
GMAIL_USER=tunombre@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
FROM_EMAIL=Morgam <tunombre@gmail.com>
MORGAM_EMAIL=tunombre@gmail.com
```

- `GMAIL_USER`: cuenta que **envía** los correos.
- `GMAIL_APP_PASSWORD`: la contraseña de aplicación (no la de entrar a Gmail).
- `MORGAM_EMAIL`: dónde **recibís** los pedidos (puede ser el mismo Gmail).
- `FROM_EMAIL`: nombre que ve el destinatario.

Reinicia `npm run dev` después de guardar el `.env`.

### Probar

1. Abre http://localhost:4200/
2. Añade un producto y finaliza un pedido.
3. Revisa bandeja de entrada (y spam) de la tienda y del email del cliente.

Si falla, revisa la terminal del servidor: suele ser contraseña incorrecta o 2 pasos no activados.

---

## 3. Datos bancarios (transferencia)

Si el cliente elige transferencia, el correo al cliente incluye estos datos:

```env
BANK_IBAN=ES00 0000 0000 0000 0000 0000
BANK_BENEFICIARY=Morgam
BANK_CONCEPT=Compra en la web
```

Sustituye por el IBAN real de la tienda.

---

## 4. Stripe (opcional — pago con tarjeta en la web)

Sin Stripe solo aparece “Transferencia bancaria”. Con Stripe también “Tarjeta (pago online)”.

### Paso a paso en Stripe

1. Regístrate o inicia sesión: https://dashboard.stripe.com/register
2. En modo **Prueba** (toggle “Test mode” arriba).
3. Ve a **Developers → API keys**:  
   https://dashboard.stripe.com/test/apikeys
4. Copia la **Secret key** (`sk_test_...`).
5. En el `.env`:

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxx
FRONTEND_URL=http://localhost:4200
```

6. Reinicia el servidor. En checkout debería salir la opción de tarjeta.

**Tarjetas de prueba Stripe:** https://docs.stripe.com/testing  
Ejemplo: `4242 4242 4242 4242`, fecha futura, CVC cualquiera.

En producción: desactiva Test mode, usa `sk_live_...` y pon en `FRONTEND_URL` la URL real de la web (ej. `https://tudominio.vercel.app`).

---

## 5. Variables de entorno (resumen)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `GMAIL_USER` | Sí | Gmail que envía |
| `GMAIL_APP_PASSWORD` | Sí | Contraseña de aplicación |
| `MORGAM_EMAIL` | Sí | Destino de pedidos de la tienda |
| `FROM_EMAIL` | No | Remitente visible |
| `BANK_IBAN` | Recomendada | IBAN para transferencias |
| `BANK_BENEFICIARY` | No | Nombre del beneficiario |
| `BANK_CONCEPT` | No | Concepto por defecto |
| `STRIPE_SECRET_KEY` | No | Pago con tarjeta |
| `FRONTEND_URL` | Sí en prod | URL pública de la web |
| `PORT` | No | Puerto API local (por defecto 3000) |

Plantilla: `.env.example`. **No subas el `.env` a Git** (ya está en `.gitignore`).

---

## 6. Desplegar en Vercel

Vercel sirve muy bien el **frontend Angular**. La API de correos (`server/`) es un servidor Node/Express aparte: en Vercel hay que publicarla como **Serverless Function** o alojarla en otro sitio. Sin esa API, el checkout no enviará correos.

### 6.1 Opción recomendada: frontend en Vercel + API en otro hosting

#### A) API (correos / Stripe)

Usa un hosting Node continuo, por ejemplo:

- [Railway](https://railway.app/)
- [Render](https://render.com/)
- [Fly.io](https://fly.io/)

En ese servicio:

1. Conecta el mismo repositorio (o solo la carpeta del servidor).
2. Comando de arranque: `node server/index.js` (o `npm run server`).
3. Añade las mismas variables del `.env` (Gmail, Stripe, `FRONTEND_URL` = URL de Vercel).
4. Anota la URL pública de la API, ej. `https://morgam-api.up.railway.app`.

En el frontend, las llamadas van a `/api/...`. En producción debes o bien:

- configurar un **proxy/rewrite** en Vercel hacia esa API, o  
- apuntar el cliente a la URL absoluta de la API.

Rewrite en Vercel (`vercel.json` de ejemplo):

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://TU-API.up.railway.app/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

(Sustituye la URL de destino por la de tu API.)

#### B) Frontend Angular en Vercel

1. Entra en https://vercel.com/ y crea cuenta / inicia sesión (GitHub recomendado).
2. **Add New… → Project** e importa el repositorio de Morgam.
3. Configuración del proyecto:
   - **Framework Preset:** Other (o Angular si lo detecta).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/morgam/browser`  
     (comprueba la carpeta real tras un `npm run build` local; en Angular 17+ suele ser `dist/morgam/browser`).
   - **Install Command:** `npm install`
4. En **Settings → Environment Variables** puedes dejar las de Gmail/Stripe solo en el servicio de la API (el frontend no necesita la contraseña de Gmail).
5. Deploy. Te dará una URL tipo `https://morgam-xxx.vercel.app`.
6. Pon esa URL en `FRONTEND_URL` de la API y vuelve a desplegar/reiniciar la API.
7. En Stripe (modo live o test), los `success_url` / `cancel_url` usan `FRONTEND_URL`; asegúrate de que coincida.

Rutas de Angular (`/productos`, `/checkout`, etc.): el rewrite a `index.html` evita el 404 al recargar.

### 6.2 Opción alternativa: todo en Vercel (API serverless)

Si quieres una sola plataforma:

1. Adaptar `server/index.js` para exportar la app Express **sin** `app.listen` en Vercel.
2. Crear una función en `/api` (o `api/index.js`) que reexporte esa app.
3. En `vercel.json`, servir el build de Angular y enrutar `/api/*` a esa función.
4. Añadir en Vercel → **Settings → Environment Variables** todas las del `.env` (`GMAIL_*`, `MORGAM_EMAIL`, `STRIPE_SECRET_KEY`, `FRONTEND_URL` = URL de Vercel, etc.).
5. Redeploy tras cambiar variables.

Documentación útil:

- Variables de entorno: https://vercel.com/docs/projects/environment-variables  
- Serverless Functions: https://vercel.com/docs/functions  
- Rewrites: https://vercel.com/docs/projects/project-configuration#rewrites  

Límites a tener en cuenta: timeouts cortos en el plan gratuito y cold starts; Gmail SMTP suele funcionar, pero si hay problemas de red/timeout, la opción 6.1 (API en Railway/Render) es más estable.

### Checklist post-despliegue

- [ ] `FRONTEND_URL` apunta a la URL de Vercel (https, sin barra final rara).
- [ ] Variables Gmail correctas en el servicio que ejecuta la API.
- [ ] Rewrite `/api` → API funciona (`/api/health` debe devolver `{"ok":true,"email":true,...}`).
- [ ] Pedido de prueba: llegan 2 correos.
- [ ] Si usas Stripe: `FRONTEND_URL` correcto y tarjetas de prueba OK.

---

## Scripts npm

| Comando | Qué hace |
|---|---|
| `npm run dev` | API + Angular a la vez |
| `npm start` | Solo Angular (proxy a la API local) |
| `npm run server` | Solo API de correos |
| `npm run build` | Build de producción |
| `npm test` | Tests unitarios |

---

## Estructura relevante

```
server/           API Express (correos + Stripe)
src/app/checkout  Formulario de pedido
src/app/core/     Servicios carrito / pedido
.env              Secretos (no subir a Git)
.env.example      Plantilla de variables
proxy.conf.json   Proxy /api → localhost:3000 en desarrollo
```
