import { render, screen, fireEvent } from '@testing-library/react';
import { CategoriaInsumos } from './categoriainsumos';
import axios from '../../utils/axiosConfig';
import Swal from 'sweetalert2';

jest.mock('axios');

describe('CategoriaInsumos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Swal.fire = jest.fn(); // Mock SweetAlert
  });

  it('should display error message if nombre is empty', async () => {
    render(<CategoriaInsumos />);
    
    fireEvent.click(screen.getByText(/Crear Categoría/i)); // Open dialog
    fireEvent.change(screen.getByLabelText(/Nombre de la categoría/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Breve descripción/i), { target: { value: 'Descripción válida' } });

    fireEvent.click(screen.getByText(/Crear Categoría/i)); // Save

    expect(await screen.findByText(/Por favor, ingrese el nombre de la categoría de insumos./i)).toBeInTheDocument();
  });

  it('should display error message if nombre is too short', async () => {
    render(<CategoriaInsumos />);
    
    fireEvent.click(screen.getByText(/Crear Categoría/i)); // Open dialog
    fireEvent.change(screen.getByLabelText(/Nombre de la categoría/i), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText(/Breve descripción/i), { target: { value: 'Descripción válida' } });

    fireEvent.click(screen.getByText(/Crear Categoría/i)); // Save

    expect(await screen.findByText(/El nombre debe tener al menos 4 caracteres./i)).toBeInTheDocument();
  });

  it('should display error message if nombre contains invalid characters', async () => {
    render(<CategoriaInsumos />);
    
    fireEvent.click(screen.getByText(/Crear Categoría/i)); // Open dialog
    fireEvent.change(screen.getByLabelText(/Nombre de la categoría/i), { target: { value: 'Nombre123' } });
    fireEvent.change(screen.getByLabelText(/Breve descripción/i), { target: { value: 'Descripción válida' } });

    fireEvent.click(screen.getByText(/Crear Categoría/i)); // Save

    expect(await screen.findByText(/El nombre solo puede contener letras y espacios./i)).toBeInTheDocument();
  });

  it('should display error message if descripcion is empty', async () => {
    render(<CategoriaInsumos />);
    
    fireEvent.click(screen.getByText(/Crear Categoría/i)); // Open dialog
    fireEvent.change(screen.getByLabelText(/Nombre de la categoría/i), { target: { value: 'Nombre Válido' } });
    fireEvent.change(screen.getByLabelText(/Breve descripción/i), { target: { value: '' } });

    fireEvent.click(screen.getByText(/Crear Categoría/i)); // Save

    expect(await screen.findByText(/Por favor, ingrese la descripción de la categoría./i)).toBeInTheDocument();
  });

  it('should display error message if descripcion is too short', async () => {
    render(<CategoriaInsumos />);
    
    fireEvent.click(screen.getByText(/Crear Categoría/i)); // Open dialog
    fireEvent.change(screen.getByLabelText(/Nombre de la categoría/i), { target: { value: 'Nombre Válido' } });
    fireEvent.change(screen.getByLabelText(/Breve descripción/i), { target: { value: 'Corta' } });

    fireEvent.click(screen.getByText(/Crear Categoría/i)); // Save

    expect(await screen.findByText(/La descripción debe tener entre 2 y 50 caracteres./i)).toBeInTheDocument();
  });
});
