import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { styles } from '../styles/bottomNavBar.styles';
import { colors } from '../styles/theme';

export type TabKey = 'home' | 'meals' | 'pantry' | 'profile';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { key: TabKey; label: string; icon: IconName; activeIcon: IconName }[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'meals', label: 'Meals', icon: 'calendar-outline', activeIcon: 'calendar' },
  { key: 'pantry', label: 'Pantry', icon: 'cart-outline', activeIcon: 'cart' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

interface BottomNavBarProps {
  activeTab: TabKey;
  bottomOffset: number;
  onTabPress?: (tab: TabKey) => void;
}

// Where each tab goes. Meals and Pantry have no screens yet, so they do nothing for now:
// add their route here when you build them (for example meals: '/meals').
const TAB_ROUTES: Partial<Record<TabKey, '/' | '/profile'>> = {
  home: '/',
  profile: '/profile',
};

export function BottomNavBar({ activeTab, bottomOffset, onTabPress }: BottomNavBarProps) {
  const router = useRouter();

  function handlePress(tab: TabKey) {
    onTabPress?.(tab);
    const route = TAB_ROUTES[tab];
    // replace (not push) so switching tabs does not pile up a back-button history.
    if (route && tab !== activeTab) router.replace(route);
  }

  return (
    <View style={[styles.bar, { bottom: bottomOffset }]}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => handlePress(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            style={styles.tab}
          >
            <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? colors.onPrimary : colors.textPrimary}
              />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
