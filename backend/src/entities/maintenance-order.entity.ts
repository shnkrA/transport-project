import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('maintenance_orders')
export class MaintenanceOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'type_id' })
  typeId: number;

  @Column({ name: 'status_id' })
  statusId: number;

  @Column({ name: 'vehicle_id' })
  vehicleId: number;

  @Column({ name: 'mechanic_id', nullable: true })
  mechanicId?: number;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduledDate?: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cost?: number;

  @Column({ name: 'mileage_at_service', type: 'decimal', precision: 12, scale: 2, nullable: true })
  mileageAtService?: number;

  @Column({ name: 'next_service_mileage', type: 'decimal', precision: 12, scale: 2, nullable: true })
  nextServiceMileage?: number;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
