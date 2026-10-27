import { Text, View } from 'react-native';

import { styles } from '../../styles/add/stepIntro.styles';
import { colors } from '../../styles/theme';

interface StepIntroProps {
  eyebrow: string; // "IDENTIFY ITEM · 1 OF 3"
  step?: 1 | 2 | 3; // how many progress segments are filled (omit for the manual screen)
  title: string;
  subtitle: string;
}

// Blue step label with the 3-segment progress bar, then the big title and a short description.
export function StepIntro({ eyebrow, step, title, subtitle }: StepIntroProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        {step !== undefined && (
          <View style={styles.progress}>
            {[1, 2, 3].map((n) => (
              <View
                key={n}
                style={[styles.segment, { backgroundColor: n <= step ? colors.primary : colors.primaryMuted }]}
              />
            ))}
          </View>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}
