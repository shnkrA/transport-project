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

  @Column({ name: 'status_id' })
  statusId: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ name: 'route_id', nullable: true })
  routeId?: number;

  @Column({ name: 'vehicle_id' })
  vehicleId: number;

  @Column({ name: 'driver_id' })
  driverId: number;

  @Column({ name: 'departure_time', type: 'timestamptz', nullable: true })
  departureTime?: Date;

  @Column({ name: 'arrival_time', type: 'timestamptz', nullable: true })
  arrivalTime?: Date;

  @Column({ name: 'actual_distance_km', type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualDistanceKm?: number;

  @Column({ name: 'fuel_spent_liters', type: 'decimal', precision: 10, scale: 2, nullable: true })
  fuelSpentLiters?: number;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
