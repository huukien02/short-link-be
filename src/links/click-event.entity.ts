import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Link } from './link.entity';

@Entity('click_events')
@Index(['linkId', 'createdAt'])
export class ClickEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Link, (link) => link.events, { onDelete: 'CASCADE' })
  link: Link;

  @Column()
  linkId: string;

  @Column({ type: 'varchar', nullable: true })
  country: string | null;

  @Column({ type: 'varchar', nullable: true })
  device: string | null;

  @Column({ type: 'varchar', nullable: true })
  browser: string | null;

  @Column({ type: 'varchar', nullable: true })
  referrer: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
