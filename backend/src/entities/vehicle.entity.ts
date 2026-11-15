import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'type_id' })
  typeId: number;

  @Column({ name: 'status_id' })
  statusId: number;

  @Column()
  model: string;

  @Column({ name: 'license_plate', unique: true })
  licensePlate: string;

  @Column({ name: 'vin_number', unique: true, nullable: true })
  vinNumber?: string;

  @Column({ name: 'year_manufactured', type: 'smallint', nullable: true })
  yearManufactured?: number;

  @Column({ name: 'capacity_weight', type: 'decimal', precision: 10, scale: 2, nullable: true })
  capacityWeight?: number;

  @Column({ name: 'capacity_seats', nullable: true })
  capacitySeats?: number;

  @Column({ name: 'current_mileage', type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentMileage: number;

  @Column({ name: 'fuel_type', nullable: true })
  fuelType?: string;

  @Column({ name: 'fuel_consumption_per_100', type: 'decimal', precision: 5, scale: 2, nullable: true })
  fuelConsumptionPer100?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
