import { Text, View } from 'react-native';

import { styles } from '../styles/statusBadge.styles';
import { statusColors } from '../styles/theme';
import type { ExpiryStatus } from '../types/item';
import { STATUS_LABELS } from '../utils/expiry';

interface StatusBadgeProps {
  status: ExpiryStatus;
}

// The small "● Safe / ● Use soon / ● Urgent" pill on the right of each row.
export function StatusBadge({ status }: StatusBadgeProps) {
  const palette = statusColors[status];

  return (
    <View style={[styles.badge, { backgroundColor: palette.badgeBackground }]}>
      <View style={[styles.dot, { backgroundColor: palette.dot }]} />
      <Text style={[styles.label, { color: palette.badgeText }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}
