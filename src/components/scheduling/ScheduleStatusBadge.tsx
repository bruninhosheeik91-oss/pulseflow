import React from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Badge, BadgeProps } from '../ui/Badge';
import {
  ScheduleStatus,
  SCHEDULE_STATUS_LABELS,
} from '../../types/scheduling';

const STATUS_VARIANT: Record<ScheduleStatus, BadgeProps['variant']> = {
  scheduled: 'info',
  running: 'score-great',
  executed: 'success',
  failed: 'danger',
  cancelled: 'neutral',
};

const STATUS_ICON: Record<ScheduleStatus, React.ReactNode> = {
  scheduled: <CalendarClock className="w-3 h-3" />,
  running: <Loader2 className="w-3 h-3 animate-spin" />,
  executed: <CheckCircle2 className="w-3 h-3" />,
  failed: <AlertTriangle className="w-3 h-3" />,
  cancelled: <XCircle className="w-3 h-3" />,
};

interface ScheduleStatusBadgeProps {
  status: ScheduleStatus;
}

export const ScheduleStatusBadge: React.FC<ScheduleStatusBadgeProps> = ({
  status,
}) => {
  return (
    <Badge variant={STATUS_VARIANT[status]} size="sm" className="gap-1">
      {STATUS_ICON[status]}
      {SCHEDULE_STATUS_LABELS[status]}
    </Badge>
  );
};