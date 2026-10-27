import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { styles } from '../../styles/add/infoCard.styles';
import { colors } from '../../styles/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface InfoCardProps {
  icon: IconName;
  title: string;
  body: string;
  tone?: 'neutral' | 'blue';
}

// A small hint box: icon on the left, bold title, gray explanation.
export function InfoCard({ icon, title, body, tone = 'neutral' }: InfoCardProps) {
  return (
    <View style={[styles.card, tone === 'blue' && styles.blue]}>
      <Ionicons name={icon} size={20} color={tone === 'blue' ? colors.primary : colors.textSecondary} />
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}
