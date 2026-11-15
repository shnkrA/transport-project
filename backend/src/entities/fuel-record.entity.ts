import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('fuel_records')
export class FuelRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'vehicle_id' })
  vehicleId: number;

  @Column({ name: 'trip_id', nullable: true })
  tripId?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  liters: number;

  @Column({ name: 'price_per_liter', type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerLiter?: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalCost?: number;

  @Column({ name: 'mileage_at_refuel', type: 'decimal', precision: 12, scale: 2, nullable: true })
  mileageAtRefuel?: number;

  @Column({ name: 'refuel_date', type: 'timestamptz', default: () => 'NOW()' })
  refuelDate: Date;

  @Column({ name: 'receipt_number', nullable: true })
  receiptNumber?: string;
}
