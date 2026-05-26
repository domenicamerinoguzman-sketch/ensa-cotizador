import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFDocument } from "pdf-lib";

const ROJO = [226, 0, 57];
const NEGRO = [35, 35, 35];

const PRECIOS = {
  PVE30: {
    nombre: "PVE30-750",
    descripcion: "1 pasajero - 150Kg.",
    espacio: "0.8 mts",
    paradas: {
      2: { base: 14976, colorEstructura: 160, policarbonatoCristal: 660 },
      3: { base: 17680, colorEstructura: 240, policarbonatoCristal: 990 },
      4: { base: 19979, colorEstructura: 320, policarbonatoCristal: 1320 },
      5: { base: 22819, colorEstructura: 400, policarbonatoCristal: 1650 },
    },
    adicionales: { metroAdicional: 400, falsoCabezal: 200, bisagra: 300 },
    opcionales: {
      llavin: 160, barandillaNegra: 180, barandillaInox: 270, sillin: 200,
      cieloRaso: 255, moqueta: 100, cierraPuerta: 360, rampa: 90, cabezalSilent: null,
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
      llavin: 160, barandillaNegra: 180, barandillaInox: 270, sillin: 200,
      cieloRaso: 255, moqueta: 100, cierraPuerta: 360, rampa: 90, cabezalSilent: 1500,
    },
  },
  PVE52: {
    nombre: "PVE52-1316",
    descripcion: "3 pasajeros - 250Kg.",
    espacio: "1.50 metros",
    paradas: {
      2: { base: 27994, colorEstructura: 300, policarbonatoCristal: 740 },
      3: { base: 31753, colorEstructura: 450, policarbonatoCristal: 1110 },
      4: { base: 35155, colorEstructura: 600, policarbonatoCristal: 1480 },
      5: { base: 38900, colorEstructura: 750, policarbonatoCristal: 1850 },
    },
    adicionales: { metroAdicional: 650, falsoCabezal: 200, bisagra: 300 },
    opcionales: {
      llavin: 160, barandillaNegra: 180, barandillaInox: 270, sillin: 200,
      cieloRaso: 630, moqueta: 168, cierraPuerta: 360, rampa: 125, cabezalSilent: 2000,
    },
  },
};

const FICHAS = {
  PVE30: "/ficha-pve30.pdf",
  PVE37: "/ficha-pve37.pdf",
  PVE52: "/ficha-pve52.pdf",
};

const fmt = (n) =>
  n == null ? "En desarrollo"
    : `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fechaHoy = () =>
  new Date().toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" });

const loadImageBase64 = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

const nuevoAscensor = () => ({
  id: crypto.randomUUID(), etiqueta: "", modelo: "PVE37", paradas: "4",
  colorEstructura: false, policarbonatoCristal: false, metrosAdicionales: 0,
  falsoCabezal: 0, bisagra: false, llavin: 0, barandillaNegra: false,
  barandillaInox: false, sillin: false, cieloRaso: false, moqueta: false,
  cierraPuerta: 0, rampa: false, cabezalSilent: false,
  descuentoActivo: false, descuentoValor: "",
  adecuaciones: [], fotos: [],
});

export default function App() {
  const [form, setForm] = useState({
    numeroCot: "", fecha: fechaHoy(), cliente: "", atencion: "",
    ciudad: "Cuenca", ciudadOtra: "",
    instalacionGeneral: false, montajeGeneral: 400, pruebasGeneral: 120, transporteGeneral: "",
    obraCivil: false, obraCivilDescripcion: "", obraCivilPrecio: "",
    notasFinales: "",
  });

  const [ascensores, setAscensores] = useState([nuevoAscensor()]);

  const ciudadFinal = form.ciudad === "otra" ? form.ciudadOtra : form.ciudad;
  const esCuenca = ciudadFinal.toLowerCase() === "cuenca";

  const setCampo = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setAscensor = (id, k, v) =>
    setAscensores((lista) => lista.map((a) => (a.id === id ? { ...a, [k]: v } : a)));

  const duplicarAscensor = (id) => {
    const original = ascensores.find((a) => a.id === id);
    if (!original) return;
    setAscensores((lista) => [...lista, { ...original, id: crypto.randomUUID(), etiqueta: `${original.etiqueta || "Copia"}` }]);
  };

  const eliminarAscensor = (id) => {
    if (ascensores.length === 1) return alert("Debe existir al menos un ascensor.");
    setAscensores((lista) => lista.filter((a) => a.id !== id));
  };

  const descripcionAscensor = (a) => {
    const modelo = PRECIOS[a.modelo];
    if (a.modelo === "PVE30") return `${modelo.nombre} Panorámico 360°, 1 pasajero - 150Kg., ${a.paradas} paradas. Requiere un espacio físico libre de 0.8 mts. Embarque y desembarque alineados a planta baja, no permite cambios de orientación.`;
    if (a.modelo === "PVE37") return `${modelo.nombre} Panorámico 360°, 2 pasajeros - 200Kg., ${a.paradas} paradas. Requiere un espacio físico libre de 1 metro. Embarque y desembarque en planta alta a cualquier orientación 0° - 90° - 180° o 270° en relación a planta baja.`;
    if (a.modelo === "PVE52") return `${modelo.nombre} Panorámico 360°, 3 pasajeros - 250Kg., ${a.paradas} paradas. Requiere un espacio físico libre de 1.50 metros. Embarque y desembarque en planta alta orientado a 0° o 180° en relación a planta baja.`;
    return `${modelo.nombre} Panorámico 360°, ${modelo.descripcion}, ${a.paradas} paradas.`;
  };

  const descuentoBaseAscensor = (a) => {
    if (!a.descuentoActivo) return 0;
    const pct = Math.max(0, Math.min(parseFloat(a.descuentoValor) || 0, 100));
    return PRECIOS[a.modelo].paradas[parseInt(a.paradas)].base * (pct / 100);
  };

  const porcentajeDescuentoTexto = (a) => {
    const pct = Math.max(0, Math.min(parseFloat(a.descuentoValor) || 0, 100));
    return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
  };

  const filasDesglose = (a) => {
    const modelo = PRECIOS[a.modelo];
    const parada = modelo.paradas[parseInt(a.paradas)];
    const op = modelo.opcionales;
    const ad = modelo.adicionales;
    const filas = [];
    const conDesc = !!a.descuentoActivo;

    const add = (concepto, cant, valor, descuento = 0) => {
      const v = Number(valor) || 0;
      const d = Number(descuento) || 0;
      if (conDesc) {
        filas.push([concepto, String(cant), fmt(v), d > 0 ? `-${fmt(d)}` : fmt(0)]);
      } else {
        filas.push([concepto, String(cant), fmt(v)]);
      }
    };

    add(descripcionAscensor(a), 1, parada.base, descuentoBaseAscensor(a));
    if (a.colorEstructura) add("Color especial estructura", 1, parada.colorEstructura);
    if (a.policarbonatoCristal) add("Policarbonato cristal", 1, parada.policarbonatoCristal);
    if (a.metrosAdicionales > 0) add("Metro adicional de intermedio", a.metrosAdicionales, a.metrosAdicionales * ad.metroAdicional);
    if (a.falsoCabezal > 0) add("Falso cabezal (cada 50cm)", a.falsoCabezal, a.falsoCabezal * ad.falsoCabezal);
    if (a.bisagra) add("Bisagra izquierda", 1, ad.bisagra);
    if (a.llavin > 0) add("Llavín de cabina", a.llavin, a.llavin * op.llavin);
    if (a.barandillaNegra) add("Barandilla negra", 1, op.barandillaNegra);
    if (a.barandillaInox) add("Barandilla acero inox", 1, op.barandillaInox);
    if (a.sillin) add("Sillín rebatible", 1, op.sillin);
    if (a.cieloRaso) add("Cielo raso dibon espejado", 1, op.cieloRaso);
    if (a.moqueta) add("Moqueta", 1, op.moqueta);
    if (a.cierraPuerta > 0) add("Cierra puerta automática", a.cierraPuerta, a.cierraPuerta * op.cierraPuerta);
    if (a.rampa) add("Rampa de chapa estándar", 1, op.rampa);
    if (a.cabezalSilent && op.cabezalSilent) add("Cabezal silent", 1, op.cabezalSilent);
    if (a.adecuaciones && a.adecuaciones.length > 0) {
      a.adecuaciones.forEach((adec) => {
        if (adec.descripcion.trim()) add(adec.descripcion, 1, parseFloat(adec.precio) || 0);
      });
    }
    return filas;
  };

  const subtotalAscensor = (a) => {
    const modelo = PRECIOS[a.modelo];
    const parada = modelo.paradas[parseInt(a.paradas)];
    const op = modelo.opcionales;
    const ad = modelo.adicionales;
    let total = parada.base - descuentoBaseAscensor(a);
    if (a.colorEstructura) total += parada.colorEstructura;
    if (a.policarbonatoCristal) total += parada.policarbonatoCristal;
    if (a.metrosAdicionales > 0) total += a.metrosAdicionales * ad.metroAdicional;
    if (a.falsoCabezal > 0) total += a.falsoCabezal * ad.falsoCabezal;
    if (a.bisagra) total += ad.bisagra;
    if (a.llavin > 0) total += a.llavin * op.llavin;
    if (a.barandillaNegra) total += op.barandillaNegra;
    if (a.barandillaInox) total += op.barandillaInox;
    if (a.sillin) total += op.sillin;
    if (a.cieloRaso) total += op.cieloRaso;
    if (a.moqueta) total += op.moqueta;
    if (a.cierraPuerta > 0) total += a.cierraPuerta * op.cierraPuerta;
    if (a.rampa) total += op.rampa;
    if (a.cabezalSilent && op.cabezalSilent) total += op.cabezalSilent;
    if (a.adecuaciones) a.adecuaciones.forEach((adec) => { if (adec.descripcion.trim()) total += parseFloat(adec.precio) || 0; });
    return total;
  };

  const filasInstalacionGeneral = () => {
    if (!form.instalacionGeneral) return [];

    const filas = [
      ["Instalación y montaje (de 2 a 3 días)", "1", fmt(form.montajeGeneral || 0)],
      ["Pruebas, ajustes, puesta en marcha y capacitación", "1", fmt(form.pruebasGeneral || 0)],
    ];

    if (form.transporteGeneral) {
      filas.push([
        `Transporte equipos Cuenca - ${ciudadFinal}`,
        "1",
        fmt(parseFloat(form.transporteGeneral) || 0),
      ]);
    }

    return filas;
  };

  const subtotalInstalacionGeneral = () =>
    filasInstalacionGeneral().reduce((s, f) => s + (parseFloat(f[2].replace(/[$,]/g, "")) || 0), 0);

  const filasObraCivil = () => {
    if (!form.obraCivil) return [];
    return [[(form.obraCivilDescripcion?.trim() || "Obra civil"), "1", fmt(parseFloat(form.obraCivilPrecio) || 0)]];
  };

  const subtotalObraCivil = () =>
    filasObraCivil().reduce((s, f) => s + (parseFloat(f[2].replace(/[$,]/g, "")) || 0), 0);

  const generarPDF = async () => {
    const doc = new jsPDF("p", "mm", "a4");
    const logo = await loadImageBase64("/ensa.png");
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 12;
    const red = ROJO;

    const nuevaPaginaSiHaceFalta = (need, y) => {
      if (y + need > pageH - 15) { doc.addPage(); return 18; }
      return y;
    };

    // PORTADA PREMIUM
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, "F");

    doc.setFillColor(...red);
    doc.rect(0, 0, pageW, 14, "F");
    doc.setFillColor(...red);
    doc.rect(0, pageH - 14, pageW, 14, "F");

    doc.setDrawColor(...red);
    doc.setLineWidth(0.8);
    doc.roundedRect(16, 24, pageW - 32, pageH - 58, 5, 5, "S");

    if (logo) doc.addImage(logo, "PNG", 63, 34, 84, 43);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...red);
    doc.text("PROPUESTA COMERCIAL", pageW / 2, 96, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...NEGRO);
    doc.text("Ascensores neumáticos panorámicos", pageW / 2, 104, { align: "center" });

    doc.setFillColor(248, 248, 248);
    doc.roundedRect(34, 120, pageW - 68, 58, 4, 4, "F");

    doc.setFontSize(9.5);

    let infoY = 134;

    doc.setTextColor(...red);
    doc.setFont("helvetica", "bold");
    doc.text("Cliente / Proyecto:", 44, infoY);

    doc.setTextColor(...NEGRO);
    doc.setFont("helvetica", "normal");
    doc.text(form.cliente || "Cliente", 76, infoY);

    infoY += 12;

    if (form.atencion?.trim()) {
      doc.setTextColor(...red);
      doc.setFont("helvetica", "bold");
      doc.text("Atención a:", 44, infoY);

      doc.setTextColor(...NEGRO);
      doc.setFont("helvetica", "normal");
      doc.text(form.atencion, 76, infoY);

      infoY += 12;
    }

    doc.setTextColor(...red);
    doc.setFont("helvetica", "bold");
    doc.text("Ciudad:", 44, infoY);

    doc.setTextColor(...NEGRO);
    doc.setFont("helvetica", "normal");
    doc.text(ciudadFinal || "Ciudad", 76, infoY);

    doc.setTextColor(...red);
    doc.setFont("helvetica", "bold");
    doc.text("Cotización N°:", 112, 134);
    doc.text("Fecha:", 112, 146);

    doc.setTextColor(...NEGRO);
    doc.setFont("helvetica", "normal");
    doc.text(`COT-2026-${form.numeroCot || "XXXX"}`, 142, 134);
    doc.text(form.fecha, 142, 146);

    doc.setDrawColor(230, 230, 230);
    doc.line(58, 198, 152, 198);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...red);
    doc.text("Movilidad panorámica premium para tu proyecto", pageW / 2, 210, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    const frasePortada = "Tecnología neumática de alta gama, instalación limpia y diseño arquitectónico moderno.";
    const lineasFrase = doc.splitTextToSize(frasePortada, 100);
    doc.text(lineasFrase, pageW / 2, 219, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...red);
    doc.text("ENSA ECUADOR", pageW / 2, 250, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...NEGRO);
    doc.text("Ascensores Neumáticos del Ecuador", pageW / 2, 257, { align: "center" });

    doc.addPage();

    // ENCABEZADO
    if (logo) doc.addImage(logo, "PNG", 78, 8, 54, 28);
    doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
    doc.setTextColor(...red); doc.text("Cotización N°:", 150, 13);
    doc.setTextColor(...NEGRO); doc.text(`COT-2026-${form.numeroCot || "XXXX"}`, 150, 18);
    doc.setDrawColor(170, 170, 170); doc.line(150, 20, 196, 20);
    doc.setTextColor(...red); doc.text("Fecha:", 150, 26);
    doc.setTextColor(...NEGRO); doc.text(form.fecha, 150, 31);
    doc.line(150, 33, 196, 33);
    doc.setTextColor(...red); doc.text("Cliente:", 150, 38);
    doc.setTextColor(...NEGRO); doc.text(form.cliente || "Cliente", 150, 42);
    doc.setDrawColor(...red); doc.setLineWidth(0.6);
    doc.line(margin, 43, pageW - margin, 43);

    // SALUDO
    let y = 50;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...NEGRO);
    doc.text("Estimad@", margin, y);
    y += 6;

    if (form.atencion?.trim()) {
      doc.setFont("helvetica", "bold"); doc.setTextColor(...red);
      doc.text(form.atencion.toUpperCase(), margin, y);
      y += 6;
      doc.setFont("helvetica", "bold"); doc.setTextColor(...NEGRO);
      doc.text("Cliente:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(form.cliente || "Cliente", margin + 18, y);
      y += 6;
    } else {
      doc.setFont("helvetica", "bold"); doc.setTextColor(...red);
      doc.text((form.cliente || "Cliente").toUpperCase(), margin, y);
      y += 6;
    }

    doc.setFont("helvetica", "bold"); doc.setTextColor(...NEGRO);
    doc.text(`${ciudadFinal}. –`, margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    const intro = "Reciba un cordial saludo de parte de ENSA Ecuador. Nos complace presentar nuestra propuesta para la implementación de ascensor(es) neumático(s) panorámico(s) para su domicilio o proyecto.";
    doc.text(doc.splitTextToSize(intro, 178), margin, y);
    y += 14;

    // BENEFICIOS
    doc.setFont("helvetica", "bold"); doc.setTextColor(...red); doc.setFontSize(11);
    doc.text("Beneficios", margin, y);
    y += 8;
    const beneficios = [
      "Diseño panorámico 360° con imagen premium.",
      "Sin cuarto de máquinas y sin necesidad de foso.",
      "Instalación rápida y limpia.",
      "Bajo consumo energético y mantenimiento eficiente.",
      "Ideal para adultos mayores y personas con movilidad reducida.",
    ];
    beneficios.forEach((b, i) => {
      const x = margin + i * 37;
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(x, y, 34, 22, 2, 2, "F");
      doc.setFillColor(...red);
      doc.circle(x + 5, y + 5, 2.8, "F");
      doc.setFont("helvetica", "normal"); doc.setFontSize(6.7); doc.setTextColor(...NEGRO);
      doc.text(doc.splitTextToSize(b, 22), x + 10, y + 5);
    });
    y += 30;

    // helper para primera fila con modelo en negrita
    const dibujarConceptoConModeloNegrita = (data, modeloNombre) => {
      const textoCompleto = String(data.cell.raw || "");
      if (!textoCompleto.startsWith(modeloNombre)) return;
      const x = data.cell.x + 2.2;
      let yTexto = data.cell.y + 5.2;
      const anchoMaximo = data.cell.width - 4.4;
      const altoLinea = 4.1;
      const restoTexto = textoCompleto.replace(modeloNombre, "").trimStart();
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.2); doc.setTextColor(...NEGRO);
      doc.text(modeloNombre, x, yTexto);
      doc.setFont("helvetica", "normal");
      const anchoModelo = doc.getTextWidth(modeloNombre + " ");
      const palabras = restoTexto.split(" ");
      const lineas = [];
      let lineaActual = "", limiteActual = anchoMaximo - anchoModelo;
      palabras.forEach((palabra) => {
        const prueba = lineaActual ? `${lineaActual} ${palabra}` : palabra;
        if (doc.getTextWidth(prueba) <= limiteActual) { lineaActual = prueba; }
        else { if (lineaActual) lineas.push(lineaActual); lineaActual = palabra; limiteActual = anchoMaximo; }
      });
      if (lineaActual) lineas.push(lineaActual);
      if (lineas.length > 0) {
        doc.text(lineas[0], x + anchoModelo, yTexto);
        for (let i = 1; i < lineas.length; i++) { yTexto += altoLinea; doc.text(lineas[i], x, yTexto); }
      }
    };

    // DESGLOSE ECONÓMICO
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...red);
    doc.text("Desglose Económico", margin, y);
    y += 6;

    ascensores.forEach((a, index) => {
      const modelo = PRECIOS[a.modelo];
      y = nuevaPaginaSiHaceFalta(55, y);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.2); doc.setTextColor(...red);
      const tituloAscensor = `Ascensor ${index + 1}: ${a.etiqueta || modelo.nombre}`;
      const tituloLineas = doc.splitTextToSize(tituloAscensor, 170);
      doc.text(tituloLineas, 18, y);
      y += tituloLineas.length * 4 + 3;

      const conDesc = !!a.descuentoActivo;
      // Sin columna TOTAL — solo CONCEPTO, CANT, VALOR, DESCUENTO (si aplica)
      const head = conDesc
        ? [["CONCEPTO", "CANT.", "VALOR", `DESCUENTO (${porcentajeDescuentoTexto(a)})`]]
        : [["CONCEPTO", "CANT.", "VALOR (USD)"]];

      const colStyles = conDesc
        ? { 0: { cellWidth: 96, halign: "center" }, 1: { cellWidth: 18, halign: "center" }, 2: { cellWidth: 28, halign: "center" }, 3: { cellWidth: 28, halign: "center" } }
        : { 0: { cellWidth: 102, halign: "center" }, 1: { cellWidth: 24, halign: "center" }, 2: { cellWidth: 40, halign: "center" } };

      const foot = conDesc
        ? [["SUBTOTAL:", "", "", fmt(subtotalAscensor(a))]]
        : [["SUBTOTAL:", "", fmt(subtotalAscensor(a))]];

      autoTable(doc, {
        startY: y,
        margin: { left: 18, right: 18 },
        tableWidth: conDesc ? 170 : 166,
        head,
        body: filasDesglose(a),
        didParseCell: (data) => {
          if (data.section === "body" && data.row.index === 0 && data.column.index === 0) {
            data.cell.styles.textColor = [255, 255, 255];
          }
          // centrar texto en todas las celdas excepto concepto (col 0) que ya tiene halign
        },
        didDrawCell: (data) => {
          if (data.section === "body" && data.row.index === 0 && data.column.index === 0) {
            dibujarConceptoConModeloNegrita(data, modelo.nombre);
          }
        },
        foot,
        theme: "grid",
        alternateRowStyles: { fillColor: [248, 248, 248] },
        styles: {
          font: "helvetica",
          fontSize: 8.2,
          cellPadding: 2.6,
          lineColor: [210, 210, 210],
          lineWidth: 0.15,
          valign: "middle",
          halign: "center",
        },
        headStyles: { fillColor: red, textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        columnStyles: colStyles,
        footStyles: {
          fillColor: [255, 245, 247],
          textColor: red,
          fontStyle: "bold",
          halign: "center",
          lineWidth: 0.3,
        },
      });
      y = doc.lastAutoTable.finalY + 10;

      // FOTOS
      if (a.fotos && a.fotos.length > 0) {
        y = nuevaPaginaSiHaceFalta(60, y);
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...red);
        doc.text(`Fotografías - Ascensor ${index + 1}${a.etiqueta ? ": " + a.etiqueta : ""}`, 18, y);
        y += 5;
        const cols = 2, gap = 5, startX = 18;
        const fotoW = (170 - gap) / cols;
        let col = 0, alturaFilaActual = 0;
        for (const foto of a.fotos) {
          let fotoH = 60;
          try {
            const tmpImg = new Image();
            tmpImg.src = foto.dataUrl;
            if (tmpImg.naturalWidth && tmpImg.naturalHeight) fotoH = (tmpImg.naturalHeight / tmpImg.naturalWidth) * fotoW;
          } catch (e) {}
          fotoH = Math.min(fotoH, 120);
          if (col === 0) { alturaFilaActual = fotoH; y = nuevaPaginaSiHaceFalta(fotoH + 10, y); }
          else alturaFilaActual = Math.max(alturaFilaActual, fotoH);
          const x = startX + col * (fotoW + gap);
          try {
            doc.addImage(foto.dataUrl, "JPEG", x, y, fotoW, fotoH);
            doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
            doc.rect(x, y, fotoW, fotoH);
          } catch (e) {}
          col++;
          if (col >= cols) { col = 0; y += alturaFilaActual + 5; alturaFilaActual = 0; }
        }
        if (col > 0) y += alturaFilaActual + 5;
        y += 4;
      }
    });

    // INSTALACIÓN
    const filasInst = filasInstalacionGeneral();
    if (filasInst.length > 0) {
      y = nuevaPaginaSiHaceFalta(45, y);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.2); doc.setTextColor(...red);
      doc.text("Instalación y transporte general", 18, y); y += 3;
      autoTable(doc, {
        startY: y, margin: { left: 18, right: 18 }, tableWidth: 166,
        head: [["CONCEPTO", "CANT.", "VALOR (USD)"]],
        body: filasInst,
        foot: [["SUBTOTAL INSTALACIÓN:", "", fmt(subtotalInstalacionGeneral())]],
        theme: "grid",
        alternateRowStyles: { fillColor: [248, 248, 248] },
        styles: {
          font: "helvetica",
          fontSize: 8.2,
          cellPadding: 2.6,
          lineColor: [210, 210, 210],
          lineWidth: 0.15,
          valign: "middle",
          halign: "center",
        },
        headStyles: { fillColor: red, textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        columnStyles: { 0: { cellWidth: 102, halign: "center" }, 1: { cellWidth: 24, halign: "center" }, 2: { cellWidth: 40, halign: "center" } },
        footStyles: {
          fillColor: [255, 245, 247],
          textColor: red,
          fontStyle: "bold",
          halign: "center",
          lineWidth: 0.3,
        },
      });
      y = doc.lastAutoTable.finalY + 7;
    }

    // OBRA CIVIL
    const filasObra = filasObraCivil();
    if (filasObra.length > 0) {
      y = nuevaPaginaSiHaceFalta(38, y);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.2); doc.setTextColor(...red);
      doc.text("Obra civil", 18, y); y += 3;
      autoTable(doc, {
        startY: y, margin: { left: 18, right: 18 }, tableWidth: 166,
        head: [["DESCRIPCIÓN", "CANT.", "VALOR (USD)"]],
        body: filasObra,
        foot: [["SUBTOTAL OBRA CIVIL:", "", fmt(subtotalObraCivil())]],
        theme: "grid",
        alternateRowStyles: { fillColor: [248, 248, 248] },
        styles: {
          font: "helvetica",
          fontSize: 8.2,
          cellPadding: 2.6,
          lineColor: [210, 210, 210],
          lineWidth: 0.15,
          valign: "middle",
          halign: "center",
        },
        headStyles: { fillColor: red, textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        columnStyles: { 0: { cellWidth: 102, halign: "center" }, 1: { cellWidth: 24, halign: "center" }, 2: { cellWidth: 40, halign: "center" } },
        footStyles: {
          fillColor: [255, 245, 247],
          textColor: red,
          fontStyle: "bold",
          halign: "center",
          lineWidth: 0.3,
        },
      });
      y = doc.lastAutoTable.finalY + 7;
    }

    // TOTAL GENERAL (1 ascensor)
    if (ascensores.length === 1) {
      const totalGeneralPDF = subtotalAscensor(ascensores[0]) + subtotalInstalacionGeneral() + subtotalObraCivil();
      y = nuevaPaginaSiHaceFalta(22, y);
      autoTable(doc, {
        startY: y, margin: { left: (pageW - 72) / 2 }, tableWidth: 72,
        body: [["TOTAL GENERAL:", fmt(totalGeneralPDF)]],
        theme: "grid",
        styles: { fontSize: 10, fontStyle: "bold", cellPadding: 3, lineColor: [0, 0, 0], lineWidth: 0.3, halign: "center" },
        columnStyles: { 0: { cellWidth: 40, textColor: red }, 1: { cellWidth: 32, textColor: red } },
      });
      y = doc.lastAutoTable.finalY + 7;
    }

    // TABLAS ADICIONALES Y OPCIONALES
    // Solo se muestran cuando TODOS los ascensores son del mismo modelo.
    // Si se mezclan modelos, se ocultan para evitar confusión de precios.
    const todosMismoModelo = ascensores.every(
      (a) => a.modelo === ascensores[0].modelo
    );

    if (todosMismoModelo) {
      const modeloRef = PRECIOS[ascensores[0].modelo];
      const paradaRef = modeloRef.paradas[parseInt(ascensores[0].paradas)];
      const ad = modeloRef.adicionales;
      const op = modeloRef.opcionales;

      const adicionales = [
        ["Metro adicional de intermedio", fmt(ad.metroAdicional)],
        ["Costo adicional color especial estructura", fmt(paradaRef.colorEstructura)],
        ["Costo adicional de policarbonato cristal", fmt(paradaRef.policarbonatoCristal)],
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

      y = nuevaPaginaSiHaceFalta(80, y);

      autoTable(doc, {
        startY: y,
        margin: { left: 33 },
        tableWidth: 70,
        head: [
          [{ content: `Adicionales (${modeloRef.nombre})`, colSpan: 2 }],
          ["DESCRIPCIÓN", "VALOR (USD)"],
        ],
        body: adicionales,
        theme: "grid",
        styles: {
          fontSize: 7.7,
          cellPadding: 1.7,
          lineColor: [170, 170, 170],
          lineWidth: 0.25,
          halign: "center",
        },
        headStyles: {
          fillColor: red,
          textColor: [255, 255, 255],
          halign: "center",
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 50, halign: "center" },
          1: { cellWidth: 20, halign: "center" },
        },
      });

      autoTable(doc, {
        startY: y,
        margin: { left: 106 },
        tableWidth: 70,
        head: [
          [{ content: `Opcionales (${modeloRef.nombre})`, colSpan: 2 }],
          ["DESCRIPCIÓN", "VALOR (USD)"],
        ],
        body: opcionales,
        theme: "grid",
        styles: {
          fontSize: 7.7,
          cellPadding: 1.7,
          lineColor: [170, 170, 170],
          lineWidth: 0.25,
          halign: "center",
        },
        headStyles: {
          fillColor: red,
          textColor: [255, 255, 255],
          halign: "center",
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 50, halign: "center" },
          1: { cellWidth: 20, halign: "center" },
        },
      });

      y = Math.max(doc.lastAutoTable.finalY, y + 55) + 6;
    }

    // NOTAS Y CONDICIONES
    if (y + 90 > pageH - 18) { doc.addPage(); y = 15; }
    doc.setDrawColor(190, 190, 190); doc.line(margin, y, pageW - margin, y); y += 5;

    const bullet = (x, yy, text, width) => {
      doc.setTextColor(...red); doc.text("•", x, yy);
      doc.setTextColor(...NEGRO);
      const lines = doc.splitTextToSize(text, width);
      doc.text(lines, x + 4, yy);
      return yy + lines.length * 4.3 + 2;
    };

    const leftX = margin, rightX = 108, colTextW = 82;
    let yLeft = y, yRight = y;

    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(...red);
    doc.text("Nota:", leftX, yLeft); yLeft += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.3);
    [
      "El precio incluye: ascensor color estándar (negro), costos de importación, flete internacional, aduana, y aranceles.",
      "No incluye: IVA.",
      "Adecuaciones y trabajos de obra civil a cargo del cliente.",
      "Se puede personalizar color de estructura, policarbonato y accesorios adicionales previo al cierre del acuerdo comercial.",
      "Requiere acometida de 220V. más tierra. El consumo eléctrico es mínimo.",
    ].forEach((t) => (yLeft = bullet(leftX, yLeft, t, colTextW)));

    if (form.notasFinales?.trim()) {
      yLeft += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...red);
      doc.text("Observaciones adicionales:", leftX, yLeft);
      yLeft += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.3);
      doc.setTextColor(...NEGRO);
      const notasPersonalizadas = doc.splitTextToSize(form.notasFinales, colTextW);
      doc.text(notasPersonalizadas, leftX, yLeft);
      yLeft += notasPersonalizadas.length * 4.3 + 2;
    }

    doc.setDrawColor(170, 170, 170); doc.line(102, y, 102, Math.max(yLeft, yRight) + 4);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(...red);
    doc.text("CONDICIONES COMERCIALES", rightX, yRight); yRight += 6;
    doc.setTextColor(...NEGRO); doc.setFontSize(8);
    doc.text("Forma de pago", rightX, yRight); yRight += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.3);
    yRight = bullet(rightX, yRight, "50% anticipo para confirmar pedido y reservar cupo de fabricación", colTextW);
    yRight = bullet(rightX, yRight, "50% contra entrega", colTextW); yRight += 2;
    doc.setFont("helvetica", "bold"); doc.text("Garantía", rightX, yRight); yRight += 5;
    doc.setFont("helvetica", "normal");
    yRight = bullet(rightX, yRight, "1 año contra defectos de fábrica", colTextW); yRight += 2;
    doc.setFont("helvetica", "bold"); doc.text("Tiempo de entrega e instalación", rightX, yRight); yRight += 5;
    doc.setFont("helvetica", "normal");
    yRight = bullet(rightX, yRight, "Fabricación: 45 días desde confirmación de pedido", colTextW);
    yRight = bullet(rightX, yRight, "Importación: 45 días", colTextW);
    yRight = bullet(rightX, yRight, "Instalación: 1 a 3 días", colTextW);
    yRight = bullet(rightX, yRight, "Tiempo total estimado: aprox. de 10 a 13 semanas (según logística y agenda de instalación)", colTextW);
    yRight += 2;
    doc.setFont("helvetica", "bold"); doc.text("Cierre", rightX, yRight); yRight += 5;
    doc.setFont("helvetica", "normal");
    yRight = bullet(rightX, yRight, "Para proceder: confirmamos la visita técnica (validación final de paradas/espacios, accesorios), emitimos la orden de pedido para reservar cupo de fabricación.", colTextW);

    y = Math.max(yLeft, yRight) + 8;
    if (y > pageH - 55) { doc.addPage(); y = 25; }
    doc.setDrawColor(...red); doc.setLineWidth(0.6);
    doc.line(margin, y, pageW - margin, y); y += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...NEGRO);
    doc.text("Esta cotización tiene validez de 30 días.", pageW / 2, y, { align: "center" }); y += 5;
    doc.text("Quedo atento para coordinar fecha de cierre y firma de contrato.", pageW / 2, y, { align: "center" });
    y += 32;
    doc.setDrawColor(120, 120, 120); doc.line(70, y, 140, y); y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Ing. Geovanny Piedra Beltrán", pageW / 2, y, { align: "center" }); y += 5;
    doc.setTextColor(...red); doc.text("ENSA ECUADOR", pageW / 2, y, { align: "center" }); y += 5;
    doc.setFont("helvetica", "normal"); doc.setTextColor(...NEGRO);
    doc.text("Tel: 0998623488  |  Email: info@ensaecuador.com", pageW / 2, y, { align: "center" });

    // NUMERACIÓN DE PÁGINAS
    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);

      doc.text(
        `Página ${i} de ${totalPages}`,
        pageW - 18,
        pageH - 8,
        { align: "right" }
      );
    }

    // UNIR FICHAS TÉCNICAS
    try {
      const cotizacionBytes = doc.output("arraybuffer");
      const pdfFinal = await PDFDocument.create();
      const cotizacionPDF = await PDFDocument.load(cotizacionBytes);
      const paginasCot = await pdfFinal.copyPages(cotizacionPDF, cotizacionPDF.getPageIndices());
      paginasCot.forEach((page) => pdfFinal.addPage(page));
      const modelosUnicos = [...new Set(ascensores.map((a) => a.modelo))];
      for (const modeloKey of modelosUnicos) {
        const response = await fetch(FICHAS[modeloKey]);
        if (!response.ok) throw new Error(`No se encontró la ficha técnica: ${FICHAS[modeloKey]}`);
        const fichaPDF = await PDFDocument.load(await response.arrayBuffer());
        const paginasFicha = await pdfFinal.copyPages(fichaPDF, fichaPDF.getPageIndices());
        paginasFicha.forEach((page) => pdfFinal.addPage(page));
      }
      const pdfBytes = await pdfFinal.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `COT-2026-${form.numeroCot || "XXXX"}.pdf`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(url);
    } catch (error) {
      alert("No se pudo unir la ficha técnica. Revisa que los archivos estén en public: ficha-pve30.pdf, ficha-pve37.pdf y ficha-pve52.pdf.\n\nDetalle: " + error.message);
    }
  };

  return (
    <div className="ensa-app">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f5f6f8; }
        .ensa-app {
          min-height: 100vh;
          padding: 28px 16px 42px;
          font-family: Arial, sans-serif;
          color: #232323;
          background:
            radial-gradient(circle at top left, rgba(226, 0, 57, 0.10), transparent 32%),
            linear-gradient(180deg, #ffffff 0%, #f5f6f8 35%, #f3f4f6 100%);
        }
        .ensa-shell { max-width: 1040px; margin: 0 auto; }
        .ensa-hero {
          background: linear-gradient(135deg, #e20039 0%, #9f0028 100%);
          color: white;
          border-radius: 24px;
          padding: 28px;
          margin-bottom: 22px;
          box-shadow: 0 18px 45px rgba(226, 0, 57, 0.22);
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: center;
          overflow: hidden;
          position: relative;
        }
        .ensa-hero::after {
          content: "";
          position: absolute;
          right: -55px;
          top: -55px;
          width: 190px;
          height: 190px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.13);
        }
        .ensa-hero h2 { margin: 0 0 8px; font-size: 30px; letter-spacing: -0.5px; }
        .ensa-hero p { margin: 0; opacity: .92; font-size: 15px; }
        .ensa-badge {
          position: relative;
          z-index: 1;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.28);
          border-radius: 999px;
          padding: 10px 16px;
          font-weight: 700;
          white-space: nowrap;
          backdrop-filter: blur(8px);
        }
        .ensa-app section, .ensa-total-card {
          background: rgba(255, 255, 255, 0.94) !important;
          border: 1px solid rgba(20, 20, 20, 0.08) !important;
          border-radius: 18px !important;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
        }
        .ensa-app section { padding: 20px !important; }
        .ensa-app h3, .ensa-app h4 { color: #1f2937; }
        .ensa-app h3 { font-size: 20px; }
        .ensa-app h4 { margin-top: 20px; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; letter-spacing: .04em; color: #e20039; }
        .ensa-app input, .ensa-app select, .ensa-app textarea {
          border: 1px solid #d8dde6;
          border-radius: 12px;
          background: #fff;
          color: #1f2937;
          outline: none;
          transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease;
          font-size: 14px;
        }
        .ensa-app input:focus, .ensa-app select:focus, .ensa-app textarea:focus {
          border-color: #e20039;
          box-shadow: 0 0 0 4px rgba(226, 0, 57, 0.12);
        }
        .ensa-app button {
          border-radius: 12px;
          border: 1px solid #d8dde6;
          background: #ffffff;
          color: #1f2937;
          cursor: pointer;
          font-weight: 700;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
        }
        .ensa-app button:hover {
          transform: translateY(-1px);
          border-color: #e20039;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
        }
        .ensa-primary-button {
          background: linear-gradient(135deg, #e20039, #b8002e) !important;
          color: white !important;
          border: 0 !important;
          box-shadow: 0 14px 28px rgba(226, 0, 57, 0.25) !important;
        }
        .ensa-subtotal {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 14px;
          background: #fff5f7;
          color: #e20039;
          border: 1px solid rgba(226, 0, 57, 0.14);
          font-weight: 800;
        }
        .ensa-total-card { border-radius: 20px !important; }
        @media (max-width: 720px) {
          .ensa-hero { align-items: flex-start; flex-direction: column; padding: 22px; }
          .ensa-hero h2 { font-size: 24px; }
          .ensa-app div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
          .ensa-app div[style*="display: flex"] { flex-wrap: wrap; }
        }
      `}</style>
      <div className="ensa-shell">
        <div className="ensa-hero">
          <div>
            <h2>Generador de Cotizaciones</h2>
            <p>ENSA Ecuador — Ascensores Neumáticos</p>
          </div>
          <div className="ensa-badge">Propuesta comercial</div>
        </div>

      <section style={{ marginBottom: 22 }}>
        <h4>Datos del cliente</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input value={form.numeroCot} onChange={(e) => setCampo("numeroCot", e.target.value)} placeholder="N° Cotización: ej. 1063" />
          <input value={form.fecha} onChange={(e) => setCampo("fecha", e.target.value)} placeholder="Fecha" />
          <input style={{ gridColumn: "1/-1" }} value={form.cliente} onChange={(e) => setCampo("cliente", e.target.value)} placeholder="Cliente / Proyecto" />
          <input style={{ gridColumn: "1/-1" }} value={form.atencion} onChange={(e) => setCampo("atencion", e.target.value)} placeholder="Atención a (opcional): Ej. Ing. Juan Pérez" />
          <select style={{ gridColumn: "1/-1" }} value={form.ciudad} onChange={(e) => setCampo("ciudad", e.target.value)}>
            <option value="Cuenca">Cuenca</option>
            <option value="Quito">Quito</option>
            <option value="Guayaquil">Guayaquil</option>
            <option value="Ambato">Ambato</option>
            <option value="Loja">Loja</option>
            <option value="otra">Otra ciudad...</option>
          </select>
          {form.ciudad === "otra" && (
            <input style={{ gridColumn: "1/-1" }} value={form.ciudadOtra} onChange={(e) => setCampo("ciudadOtra", e.target.value)} placeholder="Nombre de la ciudad" />
          )}
        </div>
      </section>

      {ascensores.map((a, index) => {
        const modelo = PRECIOS[a.modelo];
        const parada = modelo.paradas[parseInt(a.paradas)];
        const ad = modelo.adicionales, op = modelo.opcionales;
        return (
          <section key={a.id} style={{ marginBottom: 22, padding: 16, border: "1px solid #ddd", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <h3 style={{ margin: 0 }}>Ascensor {index + 1}</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => duplicarAscensor(a.id)}>Duplicar</button>
                <button type="button" onClick={() => eliminarAscensor(a.id)}>Eliminar</button>
              </div>
            </div>
            <input style={{ width: "100%", marginTop: 10, padding: 8 }} value={a.etiqueta} onChange={(e) => setAscensor(a.id, "etiqueta", e.target.value)} placeholder="Etiqueta opcional: Torre A, Ascensor social..." />

            <h4>Modelo del ascensor</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {Object.entries(PRECIOS).map(([k, v]) => (
                <button key={k} onClick={() => setAscensor(a.id, "modelo", k)} style={{ padding: 10, border: a.modelo === k ? "2px solid #e20039" : "1px solid #ccc" }}>
                  <b>{v.nombre}</b><br /><small>{v.descripcion}</small>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {[2, 3, 4, 5].map((p) => (
                <button key={p} onClick={() => setAscensor(a.id, "paradas", String(p))} style={{ flex: 1, padding: 8, border: a.paradas === String(p) ? "2px solid #e20039" : "1px solid #ccc" }}>
                  {p} paradas
                </button>
              ))}
            </div>
            <p>Precio base: {fmt(parada.base)}</p>

            <div style={{ marginTop: 10, padding: 12, border: "1px solid #eee", borderRadius: 8, background: "#fafafa" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                <input type="checkbox" checked={a.descuentoActivo || false} onChange={(e) => setAscensor(a.id, "descuentoActivo", e.target.checked)} />
                Aplicar descuento solo al precio del ascensor
              </label>
              {a.descuentoActivo && (
                <div style={{ marginTop: 10 }}>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Descuento (%)</label>
                  <input type="number" min="0" max="100" step="0.1" value={a.descuentoValor} onChange={(e) => setAscensor(a.id, "descuentoValor", e.target.value)} placeholder="Ej: 5" style={{ width: "100%", padding: 8, boxSizing: "border-box" }} />
                  <small>Se aplica únicamente al precio base del ascensor.</small>
                </div>
              )}
            </div>

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
                  <input type="checkbox" checked={a[key]} disabled={precio == null} onChange={(e) => setAscensor(a.id, key, e.target.checked)} /> {label} — {fmt(precio)}
                </label>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
              {[
                ["metrosAdicionales", "Metros adicionales", ad.metroAdicional],
                ["falsoCabezal", "Falso cabezal (cada 50cm)", ad.falsoCabezal],
                ["llavin", "Llavín de cabina", op.llavin],
                ["cierraPuerta", "Cierra puerta automático", op.cierraPuerta],
              ].map(([key, label, precio]) => (
                <div key={key}>
                  <label style={{ display: "block", marginBottom: 5, fontWeight: 600 }}>{label}</label>
                  <input style={{ width: "100%", padding: 8 }} type="number" min="0" value={a[key]} onChange={(e) => setAscensor(a.id, key, parseInt(e.target.value) || 0)} />
                  <small>Precio unitario: {fmt(precio)}</small>
                </div>
              ))}
            </div>

            {/* ADECUACIONES */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h4 style={{ margin: 0 }}>Adecuaciones personalizadas</h4>
                <button type="button" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setAscensor(a.id, "adecuaciones", [...(a.adecuaciones || []), { id: crypto.randomUUID(), descripcion: "", precio: "" }])}>
                  + Agregar línea
                </button>
              </div>
              {(a.adecuaciones || []).length === 0 && <p style={{ fontSize: 12, color: "#999", margin: 0 }}>Sin adecuaciones.</p>}
              {(a.adecuaciones || []).map((adec, i) => (
                <div key={adec.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 36px", gap: 6, marginBottom: 6 }}>
                  <input placeholder="Descripción" value={adec.descripcion} onChange={(e) => { const n = [...a.adecuaciones]; n[i] = { ...n[i], descripcion: e.target.value }; setAscensor(a.id, "adecuaciones", n); }} />
                  <input type="number" placeholder="Precio $" value={adec.precio} onChange={(e) => { const n = [...a.adecuaciones]; n[i] = { ...n[i], precio: e.target.value }; setAscensor(a.id, "adecuaciones", n); }} />
                  <button type="button" style={{ color: "#e20039", fontWeight: "bold", fontSize: 16, border: "1px solid #ddd", borderRadius: 4, cursor: "pointer" }} onClick={() => setAscensor(a.id, "adecuaciones", a.adecuaciones.filter((_, idx) => idx !== i))}>×</button>
                </div>
              ))}
            </div>

            {/* FOTOS */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h4 style={{ margin: 0 }}>Fotografías</h4>
                <label style={{ fontSize: 12, padding: "4px 10px", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" }}>
                  + Agregar fotos
                  <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => {
                    Array.from(e.target.files).forEach((archivo) => {
                      const reader = new FileReader();
                      reader.onload = (ev) => setAscensor(a.id, "fotos", [...(a.fotos || []), { id: crypto.randomUUID(), nombre: archivo.name, dataUrl: ev.target.result }]);
                      reader.readAsDataURL(archivo);
                    });
                    e.target.value = "";
                  }} />
                </label>
              </div>
              {(a.fotos || []).length === 0 && <p style={{ fontSize: 12, color: "#999", margin: 0 }}>Sin fotos.</p>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {(a.fotos || []).map((foto, i) => (
                  <div key={foto.id} style={{ position: "relative", width: 80 }}>
                    <img src={foto.dataUrl} alt={foto.nombre} style={{ width: 80, height: 65, objectFit: "cover", borderRadius: 6, border: "1px solid #ddd" }} />
                    <button type="button" onClick={() => setAscensor(a.id, "fotos", a.fotos.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 2, right: 2, background: "rgba(226,0,57,0.85)", color: "white", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 11, cursor: "pointer", lineHeight: "18px", padding: 0, textAlign: "center" }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="ensa-subtotal">Subtotal ascensor {index + 1}: {fmt(subtotalAscensor(a))}</div>
          </section>
        );
      })}

      <button onClick={() => setAscensores((lista) => [...lista, nuevoAscensor()])} style={{ padding: "10px 18px", marginBottom: 18 }}>
        + Agregar otro ascensor
      </button>

      <section style={{ marginBottom: 24, padding: 18, border: "1px solid #ddd", borderRadius: 10 }}>
        <h3 style={{ marginTop: 0 }}>Instalación y transporte general</h3>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <input
            type="checkbox"
            checked={form.instalacionGeneral || false}
            onChange={(e) => setCampo("instalacionGeneral", e.target.checked)}
          />
          Incluir instalación, pruebas y transporte
        </label>

        {form.instalacionGeneral && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Instalación y montaje ($)</label>
              <input
                type="number"
                value={form.montajeGeneral || 400}
                onChange={(e) => setCampo("montajeGeneral", Number(e.target.value))}
                style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Pruebas y puesta en marcha ($)</label>
              <input
                type="number"
                value={form.pruebasGeneral || 120}
                onChange={(e) => setCampo("pruebasGeneral", Number(e.target.value))}
                style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Transporte a {ciudadFinal} ($)</label>
              <input
                type="number"
                placeholder={esCuenca ? "Ej: 0" : "Ej: 650"}
                value={form.transporteGeneral || ""}
                onChange={(e) => setCampo("transporteGeneral", e.target.value)}
                style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: 18, borderTop: "1px solid #eee", paddingTop: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontWeight: 700 }}>
            <input type="checkbox" checked={form.obraCivil || false} onChange={(e) => setCampo("obraCivil", e.target.checked)} />
            Incluir obra civil
          </label>
          {form.obraCivil && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Descripción</label>
                <textarea value={form.obraCivilDescripcion} onChange={(e) => setCampo("obraCivilDescripcion", e.target.value)} placeholder="Ej: Adecuación de vano, albañilería, reforzamiento..." style={{ width: "100%", minHeight: 70, padding: 10, boxSizing: "border-box", resize: "vertical" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Precio ($)</label>
                <input type="number" value={form.obraCivilPrecio} onChange={(e) => setCampo("obraCivilPrecio", e.target.value)} placeholder="Ej: 500" style={{ width: "100%", padding: 10, boxSizing: "border-box" }} />
              </div>
            </div>
          )}
        </div>
      </section>

      <section style={{ marginBottom: 24, padding: 18, border: "1px solid #ddd", borderRadius: 10 }}>
        <h3 style={{ marginTop: 0 }}>Notas / Observaciones personalizadas</h3>
        <textarea
          value={form.notasFinales}
          onChange={(e) => setCampo("notasFinales", e.target.value)}
          placeholder="Escriba aquí observaciones adicionales, condiciones especiales, aclaraciones, promociones, etc."
          style={{
            width: "100%",
            minHeight: 120,
            padding: 12,
            boxSizing: "border-box",
            resize: "vertical",
            fontFamily: "Arial, sans-serif",
          }}
        />
        <small>Este texto aparecerá al final del PDF dentro de la sección Nota.</small>
      </section>

      <div className="ensa-total-card" style={{ display: "flex", justifyContent: ascensores.length === 1 ? "space-between" : "flex-end", alignItems: "center", padding: 18, border: "1px solid #ddd", gap: 16 }}>
        {ascensores.length === 1 && (
          <div>
            <div>Total general estimado</div>
            <h2
            style={{
              margin: "6px 0",
              color: "#e20039",
              fontSize: 42,
              fontWeight: 800,
              letterSpacing: "-1px",
            }}
            >
  {fmt(subtotalAscensor(ascensores[0]) + subtotalInstalacionGeneral() + subtotalObraCivil())}
</h2>
            <small style={{ color: "#555", fontSize: 13 }}>
              No incluye IVA
            </small>
          </div>
        )}
        <button className="ensa-primary-button" onClick={generarPDF} style={{ padding: "12px 24px", background: "#e20039", color: "white", border: 0, cursor: "pointer", borderRadius: 8, fontWeight: 700 }}>
          Generar PDF
        </button>
      </div>
      </div>
    </div>
  );
}
