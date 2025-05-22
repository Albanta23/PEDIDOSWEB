// @ts-nocheck
// src/utils/historicoVentana.js

/**
 * Abre una ventana nueva con el histórico de pedidos de la tienda.
 * @param {Array} pedidos - Lista de pedidos.
 * @param {string} tiendaId - ID de la tienda.
 * @param {Window} win - Referencia a la ventana abierta.
 */
export function abrirHistoricoEnVentana(pedidos, tiendaId, win) {
  const html = generarHtmlHistorico(pedidos, tiendaId);
  // Estrategia robusta multiplataforma para poblar la ventana
  try {
    win.document.open && win.document.open();
    win.document.write(html);
    win.document.close && win.document.close();
    // Verifica si el contenido se cargó correctamente
    if (!win.document.body || win.document.body.innerHTML.trim() === '') {
      throw new Error('document.write falló');
    }
  } catch (e) {
    try {
      win.location.replace('about:blank');
      setTimeout(() => {
        try {
          if (win.document.documentElement) {
            win.document.documentElement.innerHTML = html;
          } else {
            win.document.write(html);
          }
        } catch (e2) {
          try {
            win.document.body.innerHTML = '<pre style="color:red">No se pudo mostrar el historial.\n' + (e2.message || e2) + '</pre>';
          } catch {}
        }
      }, 100);
    } catch (e3) {
      try {
        win.document.body.innerHTML = '<pre style="color:red">No se pudo mostrar el historial.\n' + (e3.message || e3) + '</pre>';
      } catch {}
    }
  }
}

/**
 * Genera el HTML completo para el histórico de pedidos.
 * Devuelve un string con la página HTML.
 */
export function generarHtmlHistorico(pedidos, tiendaId) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Histórico de Pedidos</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 32px; color: #222; }
          h1 { color: #1a237e; border-bottom: 2px solid #3949ab; padding-bottom: 8px; margin-bottom: 32px; }
          h2 { color: #3949ab; margin-top: 40px; margin-bottom: 16px; font-size: 1.3em; letter-spacing: 1px; }
          table { border-collapse: collapse; width: 100%; background: #fff; border-radius: 8px; box-shadow: 0 2px 12px #e3e3e3; margin-bottom: 32px; overflow: hidden; }
          th, td { border: 1px solid #e0e0e0; padding: 10px 14px; text-align: left; font-size: 1em; }
          th { background: #e8eaf6; color: #1a237e; font-weight: 600; letter-spacing: 0.5px; }
          tr:nth-child(even) { background: #f5f7fa; }
          .section { margin-bottom: 48px; }
          .empty { color: #888; font-style: italic; padding: 16px; }
          .filtros { margin-bottom: 24px; background: #e8eaf6; padding: 12px 18px; border-radius: 8px; display: flex; align-items: center; gap: 16px; }
          .filtros label { font-weight: 500; margin-right: 8px; }
          .btn-ver { background: #3949ab; color: #fff; border: none; border-radius: 4px; padding: 6px 14px; cursor: pointer; font-size: 0.95em; margin-left: 8px; transition: background 0.2s; }
          .btn-ver:hover { background: #1a237e; }
        </style>
      </head>
      <body>
        <h1>Histórico de Pedidos</h1>
        <div class="filtros">
          <label>Desde: <input type="date" id="fechaDesde"></label>
          <label>Hasta: <input type="date" id="fechaHasta"></label>
          <button onclick="filtrarPorFecha()">Filtrar</button>
          <button onclick="resetFiltro()">Ver todos</button>
        </div>
        <div class="section">
          <h2>Pedidos realizados a fábrica</h2>
          <div id="tablaRealizados"></div>
        </div>
        <div class="section">
          <h2>Pedidos recibidos de fábrica</h2>
          <div id="tablaRecibidos"></div>
        </div>
        <script>
          const pedidos = ${JSON.stringify(pedidos)};
          const tiendaId = "${tiendaId}";
          function agruparPorPedido(lista, fechaCampo) {
            const agrupados = {};
            lista.forEach(p => {
              if (!p.numeroPedido) return;
              const clave = p.numeroPedido + '|' + p.tiendaId;
              if (!agrupados[clave]) agrupados[clave] = [];
              agrupados[clave].push(p);
            });
            return Object.entries(agrupados).map(([clave, lineas]) => {
              const [numeroPedido, tiendaId] = clave.split('|');
              return {
                numeroPedido,
                tiendaId,
                fecha: lineas[0][fechaCampo] ? new Date(lineas[0][fechaCampo]).toLocaleString() : '-',
                lineas
              };
            });
          }
          function filtrarPedidosRealizados(desde, hasta) {
            return pedidos.filter(p =>
              String(p.tiendaId).trim() === String(tiendaId).trim() &&
              p.numeroPedido &&
              (!desde || (p.fechaPedido && new Date(p.fechaPedido) >= desde)) &&
              (!hasta || (p.fechaPedido && new Date(p.fechaPedido) <= hasta))
            );
          }
          function filtrarPedidosRecibidos(desde, hasta) {
            return pedidos.filter(p =>
              p.tiendaId === tiendaId &&
              p.estado === 'preparado' &&
              p.numeroPedido &&
              (!desde || (p.fechaEnvio && new Date(p.fechaEnvio) >= desde)) &&
              (!hasta || (p.fechaEnvio && new Date(p.fechaEnvio) <= hasta))
            );
          }
          function renderTablas(desde, hasta) {
            const realizados = agruparPorPedido(filtrarPedidosRealizados(desde, hasta), 'fechaPedido');
            let htmlRealizados = '';
            if (realizados.length === 0) {
              htmlRealizados = '<div class="empty">No hay pedidos realizados a fábrica.</div>';
            } else {
              htmlRealizados = '<table><thead><tr><th>Nº Pedido</th><th>Fecha pedido</th><th>Líneas</th><th>Ver</th></tr></thead><tbody>';
              realizados.forEach(p => {
                htmlRealizados += '<tr><td>' + p.numeroPedido + '</td><td>' + p.fecha + '</td><td>' + p.lineas.length + '</td><td><button class="btn-ver" onclick="verDetalle(\'' + p.numeroPedido + '\', \'realizado\')">Ver</button></td></tr>';
              });
              htmlRealizados += '</tbody></table>';
            }
            document.getElementById('tablaRealizados').innerHTML = htmlRealizados;
            const recibidos = agruparPorPedido(filtrarPedidosRecibidos(desde, hasta), 'fechaEnvio');
            let htmlRecibidos = '';
            if (recibidos.length === 0) {
              htmlRecibidos = '<div class="empty">No hay pedidos recibidos de fábrica.</div>';
            } else {
              htmlRecibidos = '<table><thead><tr><th>Nº Pedido</th><th>Fecha envío</th><th>Líneas</th><th>Ver</th></tr></thead><tbody>';
              recibidos.forEach(p => {
                htmlRecibidos += '<tr>';
                htmlRecibidos += '<td>' + p.numeroPedido + '</td>';
                htmlRecibidos += '<td>' + p.fecha + '</td>';
                htmlRecibidos += '<td>' + p.lineas.length + '</td>';
                htmlRecibidos += '<td><button class="btn-ver" onclick="verDetalle(\'' + p.numeroPedido + '\', \'recibido\')">Ver</button></td>';
                htmlRecibidos += '</tr>';
              });
              htmlRecibidos += '</tbody></table>';
            }
            document.getElementById('tablaRecibidos').innerHTML = htmlRecibidos;
          }
          window.verDetalle = function(numeroPedido, tipo) {
            const lineas = pedidos.filter(p => p.numeroPedido == numeroPedido && p.tiendaId === tiendaId);
            let detalle = "Pedido #" + numeroPedido + "\n";
            if (tipo === 'realizado') {
              detalle += "Fecha pedido: " + (lineas[0].fechaPedido ? new Date(lineas[0].fechaPedido).toLocaleString() : '-') + "\n";
            } else {
              detalle += "Fecha envío: " + (lineas[0].fechaEnvio ? new Date(lineas[0].fechaEnvio).toLocaleString() : '-') + "\n";
            }
            detalle += "-----------------------------------\n";
            lineas.forEach((p, i) => {
              detalle += (i+1) + ". " + p.producto + " - " + p.cantidad + " " + p.formato + (p.comentario ? " (" + p.comentario + ")" : "") + "\n";
            });
            if (confirm("¿Cómo quieres visualizar el pedido?\nAceptar: En pantalla\nCancelar: PDF")) {
              alert(detalle);
            } else {
              const { jsPDF } = window.jspdf;
              const doc = new jsPDF({ unit: 'mm', format: 'a4' });
              const pageWidth = doc.internal.pageSize.getWidth();
              let y = 20;
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(18);
              doc.text('Histórico de Pedidos', pageWidth / 2, y, { align: 'center' });
              y += 10;
              doc.setFontSize(13);
              doc.setFont('helvetica', 'normal');
              doc.text('Tienda: ' + tiendaId, 10, y);
              y += 8;
              doc.setFontSize(12);
              doc.text('Pedido #' + numeroPedido, 10, y);
              if (tipo === 'realizado') {
                doc.text('Fecha pedido: ' + (lineas[0].fechaPedido ? new Date(lineas[0].fechaPedido).toLocaleString() : '-'), 80, y);
              } else {
                doc.text('Fecha envío: ' + (lineas[0].fechaEnvio ? new Date(lineas[0].fechaEnvio).toLocaleString() : '-'), 80, y);
              }
              y += 8;
              doc.setDrawColor(60, 60, 120);
              doc.setLineWidth(0.5);
              doc.line(10, y, pageWidth - 10, y);
              y += 6;
              doc.setFontSize(11);
              doc.setFont('helvetica', 'bold');
              doc.text('Nº', 12, y);
              doc.text('Producto', 22, y);
              doc.text('Cantidad', 92, y);
              doc.text('Formato', 112, y);
              doc.text('Comentario', 142, y);
              doc.setFont('helvetica', 'normal');
              y += 6;
              lineas.forEach((p, i) => {
                doc.text(String(i+1), 12, y);
                doc.text(p.producto, 22, y, { maxWidth: 65 });
                doc.text(String(p.cantidad), 92, y);
                doc.text(p.formato, 112, y);
                doc.text(p.comentario ? p.comentario : '-', 142, y, { maxWidth: 55 });
                y += 7;
                if (y > 270) {
                  doc.addPage();
                  y = 20;
                }
              });
              y = 287;
              doc.setFontSize(9);
              doc.setTextColor(120);
              doc.text('Generado el: ' + new Date().toLocaleString(), 10, y);
              doc.save('pedido_' + numeroPedido + '.pdf');
            }
          }
          function filtrarPorFecha() {
            const desdeStr = document.getElementById('fechaDesde').value;
            const hastaStr = document.getElementById('fechaHasta').value;
            const desde = desdeStr ? new Date(desdeStr + "T00:00:00") : null;
            const hasta = hastaStr ? new Date(hastaStr + "T23:59:59") : null;
            renderTablas(desde, hasta);
          }
          function resetFiltro() {
            document.getElementById('fechaDesde').value = '';
            document.getElementById('fechaHasta').value = '';
            renderTablas();
          }
          renderTablas();
        </script>
      </body>
    </html>
  `;
}
