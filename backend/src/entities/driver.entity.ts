import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  // @ts-ignore
  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'license_number', unique: true })
  licenseNumber: string;

  @Column({ name: 'license_category_id', nullable: true })
  licenseCategoryId?: number;

  @Column({ name: 'license_issue_date', type: 'date', nullable: true })
  licenseIssueDate?: Date;

  @Column({ name: 'license_expiry_date', type: 'date', nullable: true })
  licenseExpiryDate?: Date;

  @Column({ name: 'employment_date', type: 'date', nullable: true })
  employmentDate?: Date;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
