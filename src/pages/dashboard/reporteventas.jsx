import React from "react";
import * as XLSX from "xlsx";
import axios from "../../utils/axiosConfig";
import Swal from "sweetalert2";

export function ReporteVentas() {
  const generarReporte = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/ventas");
      const ventas = response.data;

      const datosReporte = ventas.map((venta) => ({
        "Número de Venta": venta.numero_venta || "N/A",
        "Cliente": venta.cliente?.nombre || "Desconocido",
        "Fecha de Venta": venta.fecha_venta.split("T")[0],
        "Fecha de Entrega": venta.fecha_entrega.split(" ")[0],
        "Estado": venta.estado,
        "Total": parseFloat(venta.total).toFixed(2),
        "Pagado": venta.pagado ? "Sí" : "No",
        "Anulación": venta.anulacion || "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(datosReporte);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte de Ventas");

      XLSX.writeFile(workbook, "reporte_ventas.xlsx");

      Swal.fire({
        icon: "success",
        title: "Reporte generado correctamente",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      console.error("Error al generar el reporte:", error);
      Swal.fire({
        icon: "error",
        title: "Error al generar el reporte",
        text: "Hubo un problema al generar el reporte de ventas.",
      });
    }
  };

  // Llamar la función de generar reporte cuando se carga el componente
  React.useEffect(() => {
    generarReporte();
  }, []);

  return null;
}
