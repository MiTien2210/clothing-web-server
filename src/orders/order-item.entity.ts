import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { ProductVariant } from 'src/product-variants/product-variant.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'SET NULL' })
  productVariant: ProductVariant | null;

  @Column()
  product_name: string;

  @Column()
  size: string;

  @Column()
  color: string;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'int' })
  quantity: number;

  @CreateDateColumn()
  created_at: Date;
}
