import {
  Card,
  CardBody,
  Typography,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  IconButton,
} from "@material-tailwind/react";
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import Swal from 'sweetalert2';
import { Producir } from "./Producir"; // Importar el nuevo componente

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export function ProductoTerminado() {
  const [productos, setProductos] = useState([]);
  const [productosActivos, setProductosActivos] = useState([]);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [open, setOpen] = useState(false);
  const [productionOpen, setProductionOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [productosPerPage] = useState(5);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProductos();
    fetchProductosActivos();
  }, []);

  const fetchProductos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/productos");
      setProductos(response.data);
      setFilteredProductos(response.data);
    } catch (error) {
      console.error("Error fetching productos:", error);
    }
  };

  const fetchProductosActivos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/productos/activos");
      setProductosActivos(response.data);
    } catch (error) {
      console.error("Error fetching productos activos:", error);
    }
  };

  useEffect(() => {
    filterProductos();
  }, [search, productos]);

  const filterProductos = () => {
    const filtered = productos.filter((producto) =>
      producto.nombre.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProductos(filtered);
  };

  const handleOpen = () => setOpen(!open);
  const handleProductionOpen = () => setProductionOpen(!productionOpen);
  const handleDetailsOpen = () => setDetailsOpen(!detailsOpen);

  const handleEdit = (producto) => {
    setSelectedProducto(producto);
    setEditMode(true);
    handleOpen();
  };

  const handleCreate = () => {
    setSelectedProducto({
      nombre: "",
      descripcion: "",
      precio: "",
    });
    setEditMode(false);
    setErrors({});
    handleOpen();
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (editMode) {
        await axios.put(`http://localhost:3000/api/productos/${selectedProducto.id_producto}`, selectedProducto);
        Toast.fire({
          icon: 'success',
          title: 'El producto ha sido actualizado correctamente.'
        });
      } else {
        await axios.post("http://localhost:3000/api/productos", selectedProducto);
        Toast.fire({
          icon: 'success',
          title: 'El producto ha sido creado correctamente.'
        });
      }
      fetchProductos();
      handleOpen();
    } catch (error) {
      console.error("Error saving producto:", error);
      Toast.fire({
        icon: 'error',
        title: 'Hubo un problema al guardar el producto.'
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedProducto.nombre) {
      newErrors.nombre = "El nombre es requerido";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,}$/.test(selectedProducto.nombre)) {
      newErrors.nombre = "El nombre debe tener al menos 3 caracteres y solo puede contener letras, tildes y espacios";
    }

    if (!selectedProducto.descripcion) {
      newErrors.descripcion = "La descripción es requerida";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{5,}$/.test(selectedProducto.descripcion)) {
      newErrors.descripcion = "La descripción debe tener al menos 5 caracteres y solo puede contener letras, tildes y espacios";
    }

    if (!selectedProducto.precio) {
      newErrors.precio = "El precio es requerido";
    } else if (!/^\d+$/.test(selectedProducto.precio)) {
      newErrors.precio = "El precio solo puede contener números";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDelete = async (producto) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Estás seguro de que deseas eliminar el producto ${producto.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:3000/api/productos/${producto.id_producto}`);
        fetchProductos();
        Toast.fire({
          icon: 'success',
          title: 'El producto ha sido eliminado correctamente.'
        });
        fetchProductosActivos();
      } catch (error) {
        console.error("Error deleting producto:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: 'El producto no se puede eliminar ya que se encuentra asociado a una venta y/o a una orden de producción.',
          confirmButtonText: 'Aceptar',
          background: '#ffff',
          iconColor: '#A62A64',
          confirmButtonColor: '#000000',
          customClass: {
            title: 'text-lg font-semibold',
            icon: 'text-2xl',
            confirmButton: 'px-4 py-2 text-white'
          }
        });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedProducto({ ...selectedProducto, [name]: value });
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleViewDetails = (producto) => {
    setSelectedProducto(producto);
    handleDetailsOpen();
  };

  const toggleActivo = async (id_producto, activo) => {
    try {
      await axios.patch(`http://localhost:3000/api/productos/${id_producto}/estado`, { activo: !activo });
      fetchProductos();
      fetchProductosActivos();
      Toast.fire({
        icon: 'success',
        title: `El producto ha sido ${!activo ? 'activado' : 'desactivado'} correctamente.`,
      });
    } catch (error) {
      console.error("Error al cambiar el estado del producto:", error);
      Toast.fire({
        icon: 'error',
        title: 'Hubo un problema al cambiar el estado del producto.',
      });
    }
  };

  const indexOfLastProducto = currentPage * productosPerPage;
  const indexOfFirstProducto = indexOfLastProducto - productosPerPage;
  const currentProductos = filteredProductos.slice(indexOfFirstProducto, indexOfLastProducto);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredProductos.length / productosPerPage); i++) {
    pageNumbers.push(i);
  }

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
     <div className="relative h-20 w-full overflow-hidden rounded-xl bg-cover bg-center">
     <div className="absolute inset-0 h-full w-full bg-white-900/75" />
      </div>
      <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
        <CardBody className="p-4">
          <Button onClick={handleCreate} className="btnagregar" size="sm" startIcon={<PlusIcon />}>
            Crear Producto
          </Button>

          <div className="mb-6">
            <Input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>       
          <div className="mb-1">
            <Typography variant="h5" color="blue-gray" className="mb-4">
              Lista de Productos
            </Typography>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendidos</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th scope="col" className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Editar</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentProductos.map((producto) => (
                    <tr key={producto.id_producto}>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{producto.nombre}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{producto.descripcion}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{producto.precio}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{producto.stock}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      <label className="inline-flex relative items-center cursor-pointer">
  <input
    type="checkbox"
    className="sr-only peer"
    checked={producto.activo}
    onChange={() => toggleActivo(producto.id_producto, producto.activo)}
  />
  <div
    className={`relative inline-flex items-center h-6 w-12 rounded-full p-1 duration-300 ease-in-out ${
      producto.activo
        ? 'bg-gradient-to-r from-green-800 to-green-600 hover:from-green-600 hover:to-green-400 shadow-lg'
        : 'bg-gradient-to-r from-red-800 to-red-500 hover:from-red-600 hover:to-red-400 shadow-lg'
    }`}
  >
    <span
      className={`inline-block w-5 h-5 transform bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${
        producto.activo ? 'translate-x-5' : 'translate-x-1'
      }`}
    />
  </div>
</label>

                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-1">
                          <IconButton
                            className="btnedit"
                            size="sm"
                            color="blue"
                            onClick={() => handleEdit(producto)}
                            disabled={!producto.activo} // Disable edit button if product is inactive
                          >
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            className="cancelar"
                            size="sm"
                            color="red"
                            onClick={() => handleDelete(producto)}
                            disabled={!producto.activo} // Disable delete button if product is inactive
                          >
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            className="btnvisualizar"
                            size="sm"
                            onClick={() => handleViewDetails(producto)}
                             // Disable view details button if product is inactive
                          >
                            <EyeIcon className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <ul className="flex justify-center items-center space-x-2">
                {pageNumbers.map((number) => (
                  <Button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`pagination ${number === currentPage ? 'active' : ''}`}               
                    size="sm"
                  >
                    {number}
                  </Button>
                ))}
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      <Dialog open={open} handler={handleOpen} className="max-w-md w-11/12 p-6 bg-white rounded-lg shadow-lg" size="xs">
        <DialogHeader className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-4">
          {editMode ? "Editar Producto Terminado" : "Crear Producto Terminado"}
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div>
            <Input
              name="nombre"
              label="Nombre"
              required
              value={selectedProducto.nombre}
              onChange={handleChange}
              error={errors.nombre}
              className="rounded-lg border-gray-300"
            />
            {errors.nombre && <Typography className="text-red-500 mt-1 text-sm">{errors.nombre}</Typography>}
          </div>
          <div>
            <Input
              name="descripcion"
              label="Descripción"
              value={selectedProducto.descripcion}
              error={errors.descripcion}
              required
              onChange={handleChange}
              className="rounded-lg border-gray-300"
            />
            {errors.descripcion && <Typography className="text-red-500 mt-1 text-sm">{errors.descripcion}</Typography>}
          </div>
          <div>
            <Input
              name="precio"
              label="Precio"
              type="number"
              value={selectedProducto.precio}
              onChange={handleChange}
              required
              error={errors.precio}
              className="rounded-lg border-gray-300"
            />
            {errors.precio && <Typography className="text-red-500 mt-1 text-sm">{errors.precio}</Typography>}
          </div>
        </DialogBody>
        <DialogFooter className="flex justify-end pt-4">
          <Button variant="text" className="btncancelarm" size="sm" onClick={handleOpen}>
            Cancelar
          </Button>
          <Button variant="gradient" className="btnagregarm" size="sm" color="green" onClick={handleSave}>
            {editMode ? "Guardar Cambios" : "Crear Producto"}
          </Button>
        </DialogFooter>
      </Dialog>

      <Producir
        open={productionOpen}
        handleProductionOpen={handleProductionOpen}
        productosActivos={productosActivos}
        fetchProductos={fetchProductos}
        fetchProductosActivos={fetchProductosActivos}
      />

      <Dialog open={detailsOpen} handler={handleDetailsOpen}>
        <DialogHeader>Detalles del Producto</DialogHeader>
        <DialogBody divider>
          <table className="min-w-full">
            <tbody>
              <tr>
                <td className="font-semibold">Nombre:</td>
                <td>{selectedProducto.nombre}</td>
              </tr>
              <tr>
                <td className="font-semibold">Descripción:</td>
                <td>{selectedProducto.descripcion}</td>
              </tr>
              <tr>
                <td className="font-semibold">Precio:</td>
                <td>{selectedProducto.precio}</td>
              </tr>
              <tr>
                <td className="font-semibold">Stock:</td>
                <td>{selectedProducto.stock}</td>
              </tr>
              <tr>
                <td className="font-semibold">Creado:</td>
                <td>{selectedProducto.createdAt ? new Date(selectedProducto.createdAt).toLocaleString() : "N/A"}</td>
              </tr>
              <tr>
                <td className="font-semibold">Actualizado:</td>
                <td>{new Date(selectedProducto.updatedAt).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </DialogBody>
        <DialogFooter>
          <Button variant="gradient" color="blue-gray" onClick={handleDetailsOpen}>
            Cerrar
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}