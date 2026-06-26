// ─── Domain Types ────────────────────────────────────────────────────────────

export type ProductCategory = 'Nutricional' | 'Cosmético';

// ─── Auth Types ───────────────────────────────────────────────────────────────
// Roles según tabla Rol en BD: IdRol 1 = Administrador, IdRol 2 = Cliente

export type UserRole = 1 | 2;

export interface AuthUser {
  idUsuario: number;
  nombreUsuario: string;
  apellidosUsuario: string;
  correoElectronico: string;
  idRol: UserRole;
  nombreRol: 'Administrador' | 'Cliente';
}

// ─── Client Types ─────────────────────────────────────────────────────────────

export interface TransactionItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface TransactionHistory {
  id: number;
  date: string; // ISO date string
  items: TransactionItem[];
  total: number;
}

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  registeredAt: string; // ISO date string
  isActive: boolean;
  transactions: TransactionHistory[];
  // Total real de pedidos del cliente, calculado por el backend (sp_listar_clientes).
  // El listado no trae el detalle de cada pedido (eso vive en `transactions`,
  // que se llena bajo demanda vía GET /api/clientes/:id/historial).
  totalTransactions?: number;
}

export interface Product {
  id: number;
  name: string;
  category: ProductCategory;
  price: number;
  imageUrl: string;
  stock: number;
  description: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Uzo Evolución',
    category: 'Nutricional',
    price: 1320.0,
    imageUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
    stock: 15,
    description:
      'Suplemento alimenticio en polvo sabor vainilla francesa. Contiene vitamina E, niacina y selenio.',
  },
  {
    id: 2,
    name: 'Vitalité Crema Facial',
    category: 'Cosmético',
    price: 870.0,
    imageUrl:
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop',
    stock: 8,
    description:
      'Crema hidratante de uso diario con extractos naturales para piel radiante.',
  },
  {
    id: 3,
    name: 'OmniProtein Chocolate',
    category: 'Nutricional',
    price: 1560.0,
    imageUrl:
      'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=400&fit=crop',
    stock: 0,
    description:
      'Proteína de suero de leche sabor chocolate oscuro. Ideal para recuperación muscular.',
  },
];

// ─── Mock Clients ─────────────────────────────────────────────────────────────

export const MOCK_CLIENTS: Client[] = [
  {
    id: 1,
    firstName: 'María',
    lastName: 'González Rojas',
    email: 'maria.gonzalez@email.com',
    phone: '8812-3456',
    registeredAt: '2025-03-10T09:00:00Z',
    isActive: true,
    transactions: [
      {
        id: 101,
        date: '2026-05-28T14:30:00Z',
        items: [
          { productName: 'Uzo Evolución', quantity: 2, unitPrice: 1320.0 },
          { productName: 'Vitalité Crema Facial', quantity: 1, unitPrice: 870.0 },
        ],
        total: 3510.0,
      },
      {
        id: 102,
        date: '2026-04-15T10:00:00Z',
        items: [
          { productName: 'OmniProtein Chocolate', quantity: 1, unitPrice: 1560.0 },
        ],
        total: 1560.0,
      },
    ],
  },
  {
    id: 2,
    firstName: 'Carlos',
    lastName: 'Vargas Mora',
    email: 'c.vargas@correo.cr',
    phone: '7701-9988',
    registeredAt: '2025-07-22T11:15:00Z',
    isActive: true,
    transactions: [
      {
        id: 201,
        date: '2026-06-01T16:45:00Z',
        items: [
          { productName: 'Vitalité Crema Facial', quantity: 3, unitPrice: 870.0 },
        ],
        total: 2610.0,
      },
    ],
  },
  {
    id: 3,
    firstName: 'Ana',
    lastName: 'Jiménez Castro',
    email: 'ana.jimenez@gmail.com',
    phone: '6623-7744',
    registeredAt: '2026-01-05T08:30:00Z',
    isActive: false,
    transactions: [],
  },
];
