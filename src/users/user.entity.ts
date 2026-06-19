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

  // === Billing (Stripe) ===
  // Gói hiện tại: 'free' | 'pro'. Nguồn sự thật do webhook Stripe cập nhật.
  @Column({ type: 'varchar', default: 'free' })
  plan: string;

  // ID Customer bên Stripe (tạo lazy lần đầu checkout) — map ngược từ webhook.
  @Column({ type: 'varchar', nullable: true, unique: true })
  stripeCustomerId: string | null;

  // Subscription đang active (nếu có) + trạng thái thô từ Stripe.
  @Column({ type: 'varchar', nullable: true })
  stripeSubscriptionId: string | null;

  // active | trialing | past_due | canceled | unpaid ...
  @Column({ type: 'varchar', nullable: true })
  subscriptionStatus: string | null;

  // Hết chu kỳ hiện tại — để FE hiển thị "gia hạn ngày…".
  @Column({ type: 'timestamptz', nullable: true })
  currentPeriodEnd: Date | null;

  @OneToMany(() => Link, (link) => link.owner)
  links: Link[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
