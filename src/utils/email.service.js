const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function enviarConfirmacionCliente({ correo, nombre, numeroPedido, total, items }) {
  const lineas = items.map(i =>
    `<tr><td>${i.nombre}</td><td>${i.cantidad}</td><td>₡${i.precioUnitario.toLocaleString('es-CR')}</td></tr>`
  ).join('');

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: correo,
    subject: `Omnilife — Pedido #${numeroPedido} confirmado`,
    html: `
      <h2>¡Hola, ${nombre}!</h2>
      <p>Tu pedido <strong>#${numeroPedido}</strong> fue recibido con éxito.</p>
      <table border="1" cellpadding="6">
        <tr><th>Producto</th><th>Cantidad</th><th>Precio</th></tr>
        ${lineas}
      </table>
      <p><strong>Total: ₡${total.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</strong></p>
      <p>Nos pondremos en contacto contigo pronto.</p>
    `,
  });
}

async function enviarNotificacionAdmin({ correoAdmin, nombreAdmin, numeroPedido, nombreCliente, total, items }) {
  const lineas = items.map(i =>
    `<tr><td>${i.nombre}</td><td>${i.cantidad}</td><td>₡${i.precioUnitario.toLocaleString('es-CR')}</td></tr>`
  ).join('');

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: correoAdmin,
    subject: `Nuevo pedido #${numeroPedido} — ${nombreCliente}`,
    html: `
      <h2>Nuevo pedido recibido</h2>
      <p>Hola <strong>${nombreAdmin}</strong>, el cliente <strong>${nombreCliente}</strong> realizó el pedido <strong>#${numeroPedido}</strong>.</p>
      <table border="1" cellpadding="6">
        <tr><th>Producto</th><th>Cantidad</th><th>Precio</th></tr>
        ${lineas}
      </table>
      <p><strong>Total: ₡${total.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</strong></p>
    `,
  });
}

module.exports = { enviarConfirmacionCliente, enviarNotificacionAdmin };