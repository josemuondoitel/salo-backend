// Domain Repository Interface - Order
import { Order, OrderStatus } from '../entities/order.entity';

export interface CreateOrderItemData {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderData {
  customerId: string;
  restaurantId: string;
  items: CreateOrderItemData[];
  notes?: string | null;
  idempotencyKey: string;
  totalAmount: number;
}

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByIdempotencyKey(key: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  findByRestaurantId(restaurantId: string): Promise<Order[]>;

  create(data: CreateOrderData): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
}

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
