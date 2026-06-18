import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Link } from '../links/link.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  googleId: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  facebookId: string | null;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatar: string | null;

  // Hash của refresh token hiện tại (để revoke / rotate)
  @Column({ type: 'varchar', nullable: true })
  refreshTokenHash: string | null;

  @OneToMany(() => Link, (link) => link.owner)
  links: Link[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
