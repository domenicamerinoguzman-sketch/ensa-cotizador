import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFDocument } from "pdf-lib";

const ROJO = [226, 0, 57];
const GRIS = [245, 245, 245];
const NEGRO = [35, 35, 35];

const PRECIOS = {
  PVE30: {
    nombre: "PVE30-750",
    descripcion: "1 pasajero - 75Kg.",
    espacio: "1 metro",
    paradas: {
      2: { base: 14976, colorEstructura: 160, policarbonatoCristal: 660 },
      3: { base: 17680, colorEstructura: 240, policarbonatoCristal: 990 },
      4: { base: 19979, colorEstructura: 320, policarbonatoCristal: 1320 },
      5: { base: 22819, colorEstructura: 400, policarbonatoCristal: 1650 },
    },
    adicionales: { metroAdicional: 400, falsoCabezal: 200, bisagra: 300 },
    opcionales: {
      llavin: 160,
      barandillaNegra: 180,
      barandillaInox: 270,
      sillin: 200,
      cieloRaso: 255,
      moqueta: 100,
      cierraPuerta: 360,
      rampa: 90,
      cabezalSilent: null,
    },
  },
  PVE37: {
    nombre: "PVE37-933",
    descripcion: "2 pasajeros - 200Kg.",
    espacio: "1 metro",
    paradas: {
      2: { base: 19968, colorEstructura: 200, policarbonatoCristal: 700 },
      3: { base: 22946, colorEstructura: 300, policarbonatoCristal: 1050 },
      4: { base: 26035, colorEstructura: 400, policarbonatoCristal: 1400 },
      5: { base: 29153, colorEstructura: 500, policarbonatoCristal: 1750 },
    },
    adicionales: { metroAdicional: 400, falsoCabezal: 200, bisagra: 300 },
    opcionales: {
      llavin: 160,
      barandillaNegra: 180,
      barandillaInox: 270,
      sillin: 200,
      cieloRaso: 255,
      moqueta: 100,
      cierraPuerta: 360,
      rampa: 90,
      cabezalSilent: 1500,
    },
  },
  PVE52: {
    nombre: "PVE52-1316",
    descripcion: "3 pasajeros - 300Kg.",
    espacio: "1.30 metros",
    paradas: {
      2: { base: 27994, colorEstructura: 300, policarbonatoCristal: 740 },
      3: { base: 31753, colorEstructura: 450, policarbonatoCristal: 1110 },
      4: { base: 35155, colorEstructura: 600, policarbonatoCristal: 1480 },
      5: { base: 38900, colorEstructura: 750, policarbonatoCristal: 1850 },
    },
    adicionales: { metroAdicional: 650, falsoCabezal: 200, bisagra: 300 },
    opcionales: {
      llavin: 160,
      barandillaNegra: 180,
      barandillaInox: 270,
      sillin: 200,
      cieloRaso: 630,
      moqueta: 168,
      cierraPuerta: 360,
      rampa: 125,
      cabezalSilent: 2000,
    },
  },
};

const fmt = (n) =>
  n == null
    ? "En desarrollo"
    : `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fechaHoy = () =>
  new Date().toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" });

const loadImageBase64 = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

export default function App() {
  const [form, setForm] = useState({
    numeroCot: "",
    fecha: fechaHoy(),
    cliente: "",
    ciudad: "Cuenca",
    ciudadOtra: "",
    modelo: "PVE37",
    paradas: "4",
    colorEstructura: false,
    policarbonatoCristal: false,
    metrosAdicionales: 0,
    falsoCabezal: 0,
    bisagra: false,
    llavin: 0,
    barandillaNegra: false,
    barandillaInox: false,
    sillin: false,
    cieloRaso: false,
    moqueta: false,
    cierraPuerta: 0,
    rampa: false,
    cabezalSilent: false,
    instalacion: false,
    montaje: 400,
    pruebas: 120,
    transporte: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const modelo = PRECIOS[form.modelo];
  const parada = modelo.paradas[parseInt(form.paradas)];
  const op = modelo.opcionales;
  const ad = modelo.adicionales;
  const ciudadFinal = form.ciudad === "otra" ? form.ciudadOtra : form.ciudad;
  const esCuenca = ciudadFinal.toLowerCase() === "cuenca";

  const filasDesglose = () => {
    const filas = [];
    const add = (concepto, cant, valor) => filas.push([concepto, String(cant), fmt(valor)]);

    add(
      `Ascensor 1 ${modelo.nombre} Panorámico 360°, ${modelo.descripcion}, ${form.paradas} paradas. Requiere un espacio físico libre de ${modelo.espacio}. Embarque y desembarque en planta alta a cualquier orientación 0° - 90° - 180° o 270° en relación a planta baja.`,
      1,
      parada.base
    );

    if (form.colorEstructura) add("Color especial estructura", 1, parada.colorEstructura);
    if (form.policarbonatoCristal) add("Policarbonato cristal", 1, parada.policarbonatoCristal);
    if (form.metrosAdicionales > 0) add("Metro adicional de intermedio", form.metrosAdicionales, form.metrosAdicionales * ad.metroAdicional);
    if (form.falsoCabezal > 0) add("Falso cabezal (cada 50cm)", form.falsoCabezal, form.falsoCabezal * ad.falsoCabezal);
    if (form.bisagra) add("Bisagra izquierda", 1, ad.bisagra);
    if (form.llavin > 0) add("Llavín de cabina", form.llavin, form.llavin * op.llavin);
    if (form.barandillaNegra) add("Barandilla negra", 1, op.barandillaNegra);
    if (form.barandillaInox) add("Barandilla acero inox", 1, op.barandillaInox);
    if (form.sillin) add("Sillín rebatible", 1, op.sillin);
    if (form.cieloRaso) add("Cielo raso dibon espejado", 1, op.cieloRaso);
    if (form.moqueta) add("Moqueta", 1, op.moqueta);
    if (form.cierraPuerta > 0) add("Cierra puerta automática", form.cierraPuerta, form.cierraPuerta * op.cierraPuerta);
    if (form.rampa) add("Rampa de chapa estándar", 1, op.rampa);
    if (form.cabezalSilent && op.cabezalSilent) add("Cabezal silent", 1, op.cabezalSilent);

    if (!esCuenca && form.instalacion) {
      add("Instalación y montaje (de 2 a 3 días)", 1, form.montaje);
      add("Pruebas, ajustes, puesta en marcha y capacitación", 1, form.pruebas);
      if (form.transporte) add(`Transporte equipos Cuenca - ${ciudadFinal}`, 1, parseFloat(form.transporte) || 0);
    }

    return filas;
  };

  const calcTotal = () =>
    filasDesglose().reduce((s, fila) => {
      const valor = fila[2].replace(/[$,]/g, "");
      return s + (parseFloat(valor) || 0);
    }, 0);

  const generarPDF = async () => {
    const doc = new jsPDF("p", "mm", "a4");
    const logo = await loadImageBase64("/ensa.png");
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 12;

    const red = ROJO;
    const line = () => {
      doc.setDrawColor(...red);
      doc.setLineWidth(0.6);
      doc.line(margin, 43, pageW - margin, 43);
    };

    // Header
    if (logo) doc.addImage(logo, "PNG", 78, 8, 54, 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...red);
    doc.text("Cotización N°:", 150, 13);
    doc.setTextColor(...NEGRO);
    doc.text(`COT-2026-${form.numeroCot || "XXXX"}`, 150, 18);
    doc.setDrawColor(170, 170, 170);
    doc.line(150, 20, 196, 20);

    doc.setTextColor(...red);
    doc.text("Fecha:", 150, 26);
    doc.setTextColor(...NEGRO);
    doc.text(form.fecha, 150, 31);
    doc.setDrawColor(170, 170, 170);
    doc.line(150, 33, 196, 33);

    doc.setTextColor(...red);
    doc.text("Cliente:", 150, 38);
    doc.setTextColor(...NEGRO);
    doc.text(form.cliente || "Cliente", 150, 42);
    line();

    // Intro
    let y = 50;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...NEGRO);
    doc.text("Estimado", margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...red);
    doc.text((form.cliente || "Cliente").toUpperCase(), margin + 16, y);
    y += 6;
    doc.setTextColor(...NEGRO);
    doc.text(`${ciudadFinal}. –`, margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    const intro = "Reciba un cordial saludo de parte de ENSA Ecuador. Nos complace presentar nuestra propuesta para la implementación de un ascensor neumático panorámico para su domicilio.";
    doc.text(doc.splitTextToSize(intro, 178), margin, y);
    y += 14;
// BENEFICIOS MODERNOS
doc.setFont("helvetica", "bold");
doc.setTextColor(...red);
doc.setFontSize(11);
doc.text("Beneficios", margin, y);

y += 8;

const beneficios = [
  "Diseño panorámico 360° con imagen premium.",
  "Sin cuarto de máquinas y sin necesidad de foso.",
  "Instalación rápida y limpia.",
  "Bajo consumo energético y mantenimiento eficiente.",
  "Ideal para adultos mayores y personas con movilidad reducida.",
];

const cardW = 34;
const cardH = 22;
const gap = 3;

beneficios.forEach((b, i) => {
  const x = margin + i * (cardW + gap);

  // fondo tarjeta
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(x, y, cardW, cardH, 2, 2, "F");

  // circulo rojo
  doc.setFillColor(...red);
  doc.circle(x + 5, y + 5, 2.8, "F");

  // texto
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.7);
  doc.setTextColor(...NEGRO);

  const lines = doc.splitTextToSize(b, 22);

  doc.text(lines, x + 10, y + 5);
});

y += 30;

    // Main table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...red);
    doc.text("Desglose Económico", margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: 18, right: 18 },
tableWidth: 150,
      head: [["CONCEPTO", "CANT.", "VALOR (USD)"]],
      body: filasDesglose(),
      foot: [["SUBTOTAL:", "", fmt(calcTotal())]],
      theme: "grid",
      styles: { font: "helvetica", fontSize: 8.2, cellPadding: 2.2, lineColor: [0, 0, 0], lineWidth: 0.25, valign: "middle" },
      headStyles: { fillColor: red, textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
      columnStyles: {
  0: { cellWidth: 102 },
  1: { cellWidth: 24, halign: "center" },
  2: { cellWidth: 40, halign: "center" }
},
      footStyles: { fillColor: [255, 255, 255], textColor: red, fontStyle: "bold", halign: "center" },
    });

    y = doc.lastAutoTable.finalY + 4;

    // Additions and options side by side
    const adicionales = [
      ["Metro adicional de intermedio", fmt(ad.metroAdicional)],
      ["Costo adicional color especial estructura", fmt(parada.colorEstructura)],
      ["Costo adicional de policarbonato cristal", fmt(parada.policarbonatoCristal)],
      ["Falso cabezal (cada 50cm)", fmt(ad.falsoCabezal)],
      ["Bisagra izquierda", fmt(ad.bisagra)],
    ];

    const opcionales = [
      ["Llavín de cabina (c/u)", fmt(op.llavin)],
      ["Barandilla negra", fmt(op.barandillaNegra)],
      ["Barandilla acero inox", fmt(op.barandillaInox)],
      ["Sillín rebatible", fmt(op.sillin)],
      ["Cielo raso dibon espejado", fmt(op.cieloRaso)],
      ["Moqueta", fmt(op.moqueta)],
      ["Cierra puerta automática (c/u)", fmt(op.cierraPuerta)],
      ["Rampa de chapa estándar", fmt(op.rampa)],
      ["Cabezal silent", fmt(op.cabezalSilent)],
    ];

    autoTable(doc, {
      startY: y,
      margin: { left: 33 },
      tableWidth: 70,
      head: [[{ content: "Adicionales", colSpan: 2 }], ["DESCRIPCIÓN", "VALOR (USD)"]],
      body: adicionales,
      theme: "grid",
      styles: { fontSize: 7.7, cellPadding: 1.7, lineColor: [170, 170, 170], lineWidth: 0.25 },
      headStyles: { fillColor: red, textColor: [255, 255, 255], halign: "center", fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 20, halign: "center" } },
    });

    autoTable(doc, {
      startY: y,
      margin: { left: 106 },
      tableWidth: 70,
      head: [[{ content: "Opcionales", colSpan: 2 }], ["DESCRIPCIÓN", "VALOR (USD)"]],
      body: opcionales,
      theme: "grid",
      styles: { fontSize: 7.7, cellPadding: 1.7, lineColor: [170, 170, 170], lineWidth: 0.25 },
      headStyles: { fillColor: red, textColor: [255, 255, 255], halign: "center", fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 20, halign: "center" } },
    });

    y = Math.max(doc.lastAutoTable.finalY, y + 45) + 5;

    const ensureSpace = (need) => {
      if (y + need > pageH - 18) {
        doc.addPage();
        y = 15;
      }
    };

    ensureSpace(70);
    doc.setDrawColor(190, 190, 190);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    // Two columns: notes and conditions
    const leftX = margin;
    const rightX = 108;
    const colTextW = 82;
    let yLeft = y;
    let yRight = y;

    const bullet = (x, yy, text, width) => {
      doc.setTextColor(...red);
      doc.text("•", x, yy);
      doc.setTextColor(...NEGRO);
      const lines = doc.splitTextToSize(text, width);
      doc.text(lines, x + 4, yy);
      return yy + lines.length * 4.3 + 2;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...red);
    doc.text("Nota:", leftX, yLeft);
    yLeft += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.3);
    [
      "El precio incluye: ascensor color estándar (negro), costos de importación, flete internacional, aduana, y aranceles.",
      "No incluye: IVA.",
      "Adecuaciones y trabajos de obra civil a cargo del cliente.",
      "Se puede personalizar color de estructura, policarbonato y accesorios adicionales previo al cierre del acuerdo comercial.",
      "Requiere acometida de 220V. más tierra. El consumo eléctrico es mínimo.",
      "Para un modelo de 4 paradas, normalmente el peso total instalado suele estar aproximadamente entre 550 y 750 kg.",
    ].forEach((t) => (yLeft = bullet(leftX, yLeft, t, colTextW)));

    doc.setDrawColor(170, 170, 170);
    doc.line(102, y, 102, Math.max(yLeft, yRight) + 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...red);
    doc.text("CONDICIONES COMERCIALES", rightX, yRight);
    yRight += 6;
    doc.setTextColor(...NEGRO);
    doc.setFontSize(8);
    doc.text("Forma de pago", rightX, yRight);
    yRight += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.3);
    yRight = bullet(rightX, yRight, "50% anticipo para confirmar pedido y reservar cupo de fabricación", colTextW);
    yRight = bullet(rightX, yRight, "50% contra entrega", colTextW);
    yRight += 2;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NEGRO);
    doc.text("Garantía", rightX, yRight);
    yRight += 5;
    doc.setFont("helvetica", "normal");
    yRight = bullet(rightX, yRight, "1 año contra defectos de fábrica", colTextW);
    yRight += 2;
    doc.setFont("helvetica", "bold");
    doc.text("Tiempo de entrega e instalación", rightX, yRight);
    yRight += 5;
    doc.setFont("helvetica", "normal");
    yRight = bullet(rightX, yRight, "Fabricación: 45 días desde confirmación de pedido", colTextW);
    yRight = bullet(rightX, yRight, "Importación: 45 días", colTextW);
    yRight = bullet(rightX, yRight, "Instalación: 1 a 3 días", colTextW);
    yRight = bullet(rightX, yRight, "Tiempo total estimado: aprox. de 10 a 13 semanas (según logística y agenda de instalación)", colTextW);
    yRight += 2;
    doc.setFont("helvetica", "bold");
    doc.text("Cierre", rightX, yRight);
    yRight += 5;
    doc.setFont("helvetica", "normal");
    yRight = bullet(rightX, yRight, "Para proceder: confirmamos la visita técnica (validación final de paradas/espacios, accesorios), emitimos la orden de pedido para reservar cupo de fabricación.", colTextW);

    y = Math.max(yLeft, yRight) + 8;
    if (y > pageH - 38) {
      doc.addPage();
      y = 25;
    }

    doc.setDrawColor(...red);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageW - margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...NEGRO);
    doc.text("Esta cotización tiene validez de 30 días.", pageW / 2, y, { align: "center" });
    y += 5;
    doc.text("Quedo atento para coordinar fecha de cierre y firma de contrato.", pageW / 2, y, { align: "center" });
    y += 8;
    doc.setDrawColor(120, 120, 120);
    doc.line(70, y, 140, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Ing. Geovanny Piedra Beltrán", pageW / 2, y, { align: "center" });
    y += 5;
    doc.setTextColor(...red);
    doc.text("ENSA ECUADOR", pageW / 2, y, { align: "center" });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...NEGRO);
    doc.text("Tel: 0998623488  |  Email: info@ensaecuador.com", pageW / 2, y, { align: "center" });

    const fichaPorModelo = {
      PVE30: "/ficha-pve30.pdf",
      PVE37: "/ficha-pve37.pdf",
      PVE52: "/ficha-pve52.pdf",
    };

    try {
      const cotizacionBytes = doc.output("arraybuffer");
      const pdfFinal = await PDFDocument.create();

      const cotizacionPDF = await PDFDocument.load(cotizacionBytes);
      const paginasCotizacion = await pdfFinal.copyPages(
        cotizacionPDF,
        cotizacionPDF.getPageIndices()
      );
      paginasCotizacion.forEach((page) => pdfFinal.addPage(page));

      const fichaUrl = fichaPorModelo[form.modelo];

      if (fichaUrl) {
        const response = await fetch(fichaUrl);

        if (!response.ok) {
          throw new Error(`No se encontró la ficha técnica: ${fichaUrl}`);
        }

        const fichaBytes = await response.arrayBuffer();
        const fichaPDF = await PDFDocument.load(fichaBytes);
        const paginasFicha = await pdfFinal.copyPages(
          fichaPDF,
          fichaPDF.getPageIndices()
        );

        paginasFicha.forEach((page) => pdfFinal.addPage(page));
      }

      const pdfBytes = await pdfFinal.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `COT-2026-${form.numeroCot || "XXXX"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      alert(
        "No se pudo unir la ficha técnica. Revisa que los archivos estén en public con estos nombres: ficha-pve30.pdf, ficha-pve37.pdf y ficha-pve52.pdf.\n\nDetalle: " +
          error.message
      );
    }
  };

  const total = calcTotal();

  return (
    <div style={{ padding: "1.5rem 1rem", maxWidth: 760, margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <h2>Generador de Cotizaciones</h2>
      <p>ENSA Ecuador — Ascensores Neumáticos</p>

      <section style={{ marginBottom: 22 }}>
        <h4>Datos del cliente</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input value={form.numeroCot} onChange={(e) => set("numeroCot", e.target.value)} placeholder="N° Cotización: ej. 1063" />
          <input value={form.fecha} onChange={(e) => set("fecha", e.target.value)} placeholder="Fecha" />
          <input style={{ gridColumn: "1/-1" }} value={form.cliente} onChange={(e) => set("cliente", e.target.value)} placeholder="Cliente / Proyecto" />
          <select style={{ gridColumn: "1/-1" }} value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)}>
            <option value="Cuenca">Cuenca</option>
            <option value="Quito">Quito</option>
            <option value="Guayaquil">Guayaquil</option>
            <option value="Ambato">Ambato</option>
            <option value="Loja">Loja</option>
            <option value="otra">Otra ciudad...</option>
          </select>
          {form.ciudad === "otra" && <input style={{ gridColumn: "1/-1" }} value={form.ciudadOtra} onChange={(e) => set("ciudadOtra", e.target.value)} placeholder="Nombre de la ciudad" />}
        </div>
      </section>

      <section style={{ marginBottom: 22 }}>
        <h4>Modelo del ascensor</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {Object.entries(PRECIOS).map(([k, v]) => (
            <button key={k} onClick={() => set("modelo", k)} style={{ padding: 10, border: form.modelo === k ? "2px solid #e20039" : "1px solid #ccc" }}>
              <b>{v.nombre}</b>
              <br />
              <small>{v.descripcion}</small>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {[2, 3, 4, 5].map((p) => (
            <button key={p} onClick={() => set("paradas", String(p))} style={{ flex: 1, padding: 8, border: form.paradas === String(p) ? "2px solid #e20039" : "1px solid #ccc" }}>
              {p} paradas
            </button>
          ))}
        </div>
        <p>Precio base: {fmt(parada.base)}</p>
      </section>

      <section style={{ marginBottom: 22 }}>
        <h4>Adicionales y opcionales</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            ["colorEstructura", "Color especial estructura", parada.colorEstructura],
            ["policarbonatoCristal", "Policarbonato cristal", parada.policarbonatoCristal],
            ["bisagra", "Bisagra izquierda", ad.bisagra],
            ["barandillaNegra", "Barandilla negra", op.barandillaNegra],
            ["barandillaInox", "Barandilla acero inox", op.barandillaInox],
            ["sillin", "Sillín rebatible", op.sillin],
            ["cieloRaso", "Cielo raso dibon espejado", op.cieloRaso],
            ["moqueta", "Moqueta", op.moqueta],
            ["rampa", "Rampa de chapa estándar", op.rampa],
            ["cabezalSilent", "Cabezal silent", op.cabezalSilent],
          ].map(([key, label, precio]) => (
            <label key={key} style={{ border: "1px solid #ddd", padding: 8, opacity: precio == null ? 0.5 : 1 }}>
              <input type="checkbox" checked={form[key]} disabled={precio == null} onChange={(e) => set(key, e.target.checked)} /> {label} — {fmt(precio)}
            </label>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
          <div>
            <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Metros adicionales</label>
            <input style={{ width: "100%", padding: 8 }} type="number" min="0" value={form.metrosAdicionales} onChange={(e) => set("metrosAdicionales", parseInt(e.target.value) || 0)} />
            <small>Precio unitario: {fmt(ad.metroAdicional)}</small>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Falso cabezal (cada 50cm)</label>
            <input style={{ width: "100%", padding: 8 }} type="number" min="0" value={form.falsoCabezal} onChange={(e) => set("falsoCabezal", parseInt(e.target.value) || 0)} />
            <small>Precio unitario: {fmt(ad.falsoCabezal)}</small>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Llavín de cabina</label>
            <input style={{ width: "100%", padding: 8 }} type="number" min="0" value={form.llavin} onChange={(e) => set("llavin", parseInt(e.target.value) || 0)} />
            <small>Precio unitario: {fmt(op.llavin)}</small>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>Cierra puerta automático</label>
            <input style={{ width: "100%", padding: 8 }} type="number" min="0" value={form.cierraPuerta} onChange={(e) => set("cierraPuerta", parseInt(e.target.value) || 0)} />
            <small>Precio unitario: {fmt(op.cierraPuerta)}</small>
          </div>
        </div>
      </section>

      {!esCuenca && (
        <section style={{ marginBottom: 22 }}>
          <h4>Instalación y transporte</h4>
          <label>
            <input type="checkbox" checked={form.instalacion} onChange={(e) => set("instalacion", e.target.checked)} /> Incluir instalación, montaje y pruebas
          </label>
          {form.instalacion && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
              <input type="number" value={form.montaje} onChange={(e) => set("montaje", parseFloat(e.target.value) || 0)} placeholder="Montaje" />
              <input type="number" value={form.pruebas} onChange={(e) => set("pruebas", parseFloat(e.target.value) || 0)} placeholder="Pruebas" />
              <input type="number" value={form.transporte} onChange={(e) => set("transporte", e.target.value)} placeholder="Transporte" />
            </div>
          )}
        </section>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 18, border: "1px solid #ddd" }}>
        <div>
          <div>Subtotal estimado</div>
          <h2>{fmt(total)}</h2>
          <small>No incluye IVA</small>
        </div>
        <button onClick={generarPDF} style={{ padding: "12px 24px", background: "#e20039", color: "white", border: 0, cursor: "pointer" }}>
          Generar PDF
        </button>
      </div>
    </div>
  );
}
