import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_id', nullable: true })
  customerId?: number;

  @Column({ name: 'customer_name' })
  customerName: string;

  @Column({ name: 'driver_id', nullable: true })
  driverId?: number;

  @Column({ name: 'vehicle_id' })
  vehicleId: number;

  @Column({ name: 'departure_point' })
  departurePoint: string;

  @Column({ name: 'arrival_point' })
  arrivalPoint: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'passenger_count', nullable: true })
  passengerCount?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cost: number;

  @Column({ name: 'departure_time', type: 'timestamptz', nullable: true })
  departureTime?: Date;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
