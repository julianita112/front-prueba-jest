import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Select,
  Option,
  IconButton,
  Typography
} from "@material-tailwind/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import axios from "../../utils/axiosConfig";
import Swal from 'sweetalert2';

// Función para formatear la fecha en formato YYYY-MM-DD
const formatDate = (isoDate) => {
  return isoDate ? new Date(isoDate).toISOString().substring(0, 10) : '';
};

export function EditarPedido({ pedido, clientes = [], productos = [], fetchPedidos, onCancel }) {
  const [selectedPedido, setSelectedPedido] = useState({
    id_cliente: "",
    numero_pedido: "",
    fecha_entrega: "",
    fecha_pago: "",
    estado: "Esperando Pago",
    pagado: false,
    detallesPedido: [],
    clientesh: { nombre: "", contacto: "" },
    total: 0
  });

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (pedido) {
      if (pedido.pagado) {
        Swal.fire({
          title: 'No se puede editar',
          text: 'Este pedido ya ha sido pagado y no se puede editar.',
          icon: 'warning',
          confirmButtonColor: '#A62A64',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          onCancel();
        });
        return;
      }

      const detallesConSubtotal = pedido.detallesPedido.map(detalle => {
        const producto = productos.find(p => p.id_producto === detalle.id_producto);
        const precioUnitario = producto ? producto.precio : 0;
        const cantidad = detalle.cantidad;
        const subtotal = cantidad * precioUnitario;
        return { ...detalle, precio_unitario: precioUnitario, subtotal };
      });

      setSelectedPedido({
        ...pedido,
        fecha_entrega: formatDate(pedido.fecha_entrega),
        fecha_pago: formatDate(pedido.fecha_pago),
        detallesPedido: detallesConSubtotal,
        clientesh: pedido.clientesh || { nombre: "", contacto: "" },
        total: calcularTotal(detallesConSubtotal)
      });
    }
  }, [pedido, productos, onCancel]);

  const calcularTotal = (detalles) => {
    return detalles.reduce((acc, detalle) => acc + (detalle.subtotal || 0), 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedPedido({ ...selectedPedido, [name]: value });
  };

  const handleDetalleChange = (index, e) => {
    const { name, value } = e.target;
    const detalles = [...selectedPedido.detallesPedido];

    if (name === 'id_producto') {
      const productoSeleccionado = productos.find(p => p.id_producto === parseInt(value));
      if (productoSeleccionado) {
        detalles[index].precio_unitario = productoSeleccionado.precio;
      }
    }

    detalles[index][name] = value;

    if (name === 'cantidad' || name === 'precio_unitario') {
      const cantidad = parseInt(detalles[index].cantidad) || 0;
      const precioUnitario = parseFloat(detalles[index].precio_unitario) || 0;
      detalles[index].subtotal = cantidad * precioUnitario;
    }

    setSelectedPedido({ ...selectedPedido, detallesPedido: detalles });
    updateTotal(detalles);
  };

  const handleAddDetalle = () => {
    setSelectedPedido({
      ...selectedPedido,
      detallesPedido: [...selectedPedido.detallesPedido, { id_producto: "", cantidad: "", precio_unitario: "", subtotal: 0 }]
    });
  };

  const handleRemoveDetalle = (index) => {
    const detalles = [...selectedPedido.detallesPedido];
    detalles.splice(index, 1);
    setSelectedPedido({ ...selectedPedido, detallesPedido: detalles });
    updateTotal(detalles);
  };

  const updateTotal = (detalles) => {
    const total = calcularTotal(detalles);
    setSelectedPedido(prevState => ({
      ...prevState,
      total
    }));
  };

  const handlePagadoChange = (e) => {
    const isChecked = e.target.checked;
    const newEstado = isChecked ? "Pendiente de Preparación" : "Esperando Pago";
    setSelectedPedido({
      ...selectedPedido,
      pagado: isChecked,
      fecha_pago: isChecked ? selectedPedido.fecha_pago : "",
      estado: newEstado
    });
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!selectedPedido.fecha_entrega) {
      newErrors.fecha_entrega = "La fecha de entrega es obligatoria";
    }
    if (selectedPedido.detallesPedido.length === 0) {
      newErrors.detallesPedido = "Debe agregar al menos un detalle de pedido";
    }
    selectedPedido.detallesPedido.forEach((detalle, index) => {
      if (!detalle.id_producto) {
        newErrors[`producto_${index}`] = "El producto es obligatorio";
      }
      if (!detalle.cantidad) {
        newErrors[`cantidad_${index}`] = "La cantidad es obligatoria";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Swal.fire({
        title: 'Error',
        text: 'Por favor, complete todos los campos requeridos.',
        icon: 'error',
      });
      return;
    }

    const pedidoToSave = {
      fecha_entrega: new Date(selectedPedido.fecha_entrega).toISOString(),
      fecha_pago: selectedPedido.pagado && selectedPedido.fecha_pago ? new Date(selectedPedido.fecha_pago).toISOString() : null,
      estado: selectedPedido.pagado ? "Pendiente de Preparación" : "Esperando Pago",
      pagado: selectedPedido.pagado,
      detallesPedido: selectedPedido.detallesPedido.map(detalle => ({
        id_producto: parseInt(detalle.id_producto),
        cantidad: parseInt(detalle.cantidad),
        precio_unitario: parseFloat(detalle.precio_unitario),
        subtotal: parseFloat(detalle.subtotal)
      })),
      total: selectedPedido.total
    };

    try {
      await axios.put(`http://localhost:3000/api/pedidos/${selectedPedido.id_pedido}`, pedidoToSave);
      Swal.fire({
        title: '¡Actualización exitosa!',
        text: 'El pedido ha sido actualizado correctamente.',
        icon: 'success',
      });
      fetchPedidos();
      onCancel();
    } catch (error) {
      console.error("Error updating pedido:", error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al actualizar el pedido.',
        icon: 'error',
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-lg">
      <Typography variant="h5" color="black" className="mb-4">
        Editar Pedido
      </Typography>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <Select
            label="Cliente"
            name="id_cliente"
            value={selectedPedido.id_cliente}
            className="w-full"
            disabled
          >
            {clientes.map(cliente => (
              <Option key={cliente.id_cliente} value={cliente.id_cliente}>
                {cliente.nombre}
              </Option>
            ))}
          </Select>
          <Input
            label="Número de Pedido"
            name="numero_pedido"
            type="text"
            value={selectedPedido.numero_pedido}
            className="w-full"
            disabled
          />
          <Input
            label="Fecha de Entrega"
            name="fecha_entrega"
            type="date"
            value={selectedPedido.fecha_entrega}
            onChange={handleChange}
            className="w-full"
            required
          />
          <Input
            label="Fecha de Pago"
            name="fecha_pago"
            type="date"
            value={selectedPedido.fecha_pago || ""}
            onChange={handleChange}
            className="w-full"
            disabled={!selectedPedido.pagado}
          />
          <div className="flex items-center gap-2">
            <Typography color="gray" className="text-sm">Pagado:</Typography>
            <input
              type="checkbox"
              name="pagado"
              checked={selectedPedido.pagado}
              onChange={handlePagadoChange}
              className="form-checkbox"
            />
          </div>
        </div>

        <div className="mt-6 text-center">
           <Typography variant="h6" color="blue-gray" className="font-semibold mb-4">
    Detalles del Pedido
  </Typography>
       
          <div className="bg-gray-100 p-4 rounded-lg shadow-md">
            {selectedPedido.detallesPedido.map((detalle, index) => (
              <div key={index} className="flex flex-col gap-4 mb-4">
                <Select
                  label="Producto"
                  name="id_producto"
                  value={detalle.id_producto}
                  onChange={(e) => handleDetalleChange(index, { target: { name: 'id_producto', value: e.target.value } })}
                  className="w-full"
                >
                  {productos.map(producto => (
                    <Option key={producto.id_producto} value={producto.id_producto}>
                      {producto.nombre}
                    </Option>
                  ))}
                </Select>
                <Input
                  label="Cantidad"
                  name="cantidad"
                  type="number"
                  value={detalle.cantidad}
                  onChange={(e) => handleDetalleChange(index, e)}
                  className="w-full"
                />
                <Input
                  label="Precio Unitario"
                  name="precio_unitario"
                  type="number"
                  step="0.01"
                  value={detalle.precio_unitario}
                  className="w-full"
                  readOnly
                />
                <Input
                  label="Subtotal"
                  name="subtotal"
                  type="number"
                  step="0.01"
                  value={detalle.subtotal}
                  className="w-full"
                  readOnly
                />
                <div className="flex justify-end">
                  <IconButton
                    color="red"
                    onClick={() => handleRemoveDetalle(index)}
                    size="sm"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            ))}
            <div className="mt-2 flex justify-end">
              <Button
                className="btnmas"
                size="sm"
                onClick={handleAddDetalle}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </div>
          <Typography variant="h6" color="black" className="text-right mt-4">
            Total: ${selectedPedido.total.toFixed(2)}
          </Typography>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="text" className="btncancelarm" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleSave}>
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
