import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { styles } from '../styles/bottomNavBar.styles';
import { CreateMenuFab } from './CreateMenuFab';
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
  /** Set false to hide the blue + button (Home does this while removing items). */
  showCreateButton?: boolean;
}

// Where each tab goes. Pantry has no screen yet, so it does nothing for now:
// add its route here when you build it (for example pantry: '/pantry').
const TAB_ROUTES: Partial<Record<TabKey, '/' | '/meals' | '/profile'>> = {
  home: '/',
  meals: '/meals',
  profile: '/profile',
};

export function BottomNavBar({ activeTab, bottomOffset, onTabPress, showCreateButton = true }: BottomNavBarProps) {
  const router = useRouter();

  function handlePress(tab: TabKey) {
    onTabPress?.(tab);
    const route = TAB_ROUTES[tab];
    // replace (not push) so switching tabs does not pile up a back-button history.
    if (route && tab !== activeTab) router.replace(route);
  }

  const renderTab = (tab: (typeof TABS)[number]) => {
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
  };

  // Two tabs, a gap for the + button, two tabs.
  return (
    <>
      <View style={[styles.bar, { bottom: bottomOffset }]}>
        <View style={styles.group}>{TABS.slice(0, 2).map(renderTab)}</View>
        <View style={styles.centerGap} />
        <View style={styles.group}>{TABS.slice(2).map(renderTab)}</View>
      </View>
      {showCreateButton && <CreateMenuFab bottomOffset={bottomOffset} />}
    </>
  );
}
