import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'status_id' })
  statusId: number;

  @Column({ name: 'type_id' })
  typeId: number;

  @Column({ name: 'customer_name' })
  customerName: string;

  @Column({ name: 'customer_phone', nullable: true })
  customerPhone?: string;

  @Column({ name: 'customer_email', nullable: true })
  customerEmail?: string;

  @Column({ name: 'departure_point' })
  departurePoint: string;

  @Column({ name: 'arrival_point' })
  arrivalPoint: string;

  @Column({ name: 'departure_date', type: 'timestamptz' })
  departureDate: Date;

  @Column({ name: 'cargo_weight', type: 'decimal', precision: 10, scale: 2, nullable: true })
  cargoWeight?: number;

  @Column({ name: 'cargo_dimensions', nullable: true })
  cargoDimensions?: string;

  @Column({ name: 'passenger_count', nullable: true })
  passengerCount?: number;

  @Column({ name: 'calculated_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  calculatedPrice?: number;

  @Column({ nullable: true })
  notes?: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
