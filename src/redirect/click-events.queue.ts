/** Tên queue dùng chung giữa producer (RedirectService) và worker (ClickEventsProcessor). */
export const CLICK_EVENTS_QUEUE = 'click-events';

/** Payload của 1 job click — đủ nhẹ để enqueue nhanh; enrich geo/device làm ở worker. */
export interface ClickJobData {
  linkId: string;
  referrer: string | null;
  userAgent: string | null;
  ip: string | null;
}
