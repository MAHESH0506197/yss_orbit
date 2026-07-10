// yss_orbit\frontend\src\modules\notification\types\notificationTypes.ts
import { BaseEntity } from '@/types/commonTypes';

export interface Notification extends BaseEntity {
  title: string;
  message: string;
  isRead: boolean;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  link?: string;
  channels?: string[];
}
