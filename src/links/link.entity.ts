import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { ClickEvent } from './click-event.entity';

@Entity('links')
export class Link {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Mã rút gọn — index unique, query nóng nhất hệ thống
  @Index({ unique: true })
  @Column()
  slug: string;

  @Column()
  targetUrl: string;

  @Column({ type: 'varchar', nullable: true })
  passwordHash: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'int', nullable: true })
  maxClicks: number | null;

  @Column({ type: 'int', default: 0 })
  clickCount: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, (user) => user.links, { onDelete: 'CASCADE' })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => ClickEvent, (event) => event.link)
  events: ClickEvent[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
