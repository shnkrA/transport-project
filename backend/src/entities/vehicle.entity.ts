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

  @Column({ name: 'vehicle_type' })
  vehicleType: string;

  @Column()
  status: string;

  @Column()
  model: string;

  @Column({ name: 'license_plate', unique: true })
  licensePlate: string;

  @Column({ name: 'capacity_seats', nullable: true })
  capacitySeats?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
