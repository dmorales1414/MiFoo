'use no memo'; // see FRONTEND.md section 14: keeps Light / Dark changes from being skipped by React Compiler
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
  // Home = house, Meals = plate with fork and knife, Pantry = storage basket, Profile = person.
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'meals', label: 'Meals', icon: 'restaurant-outline', activeIcon: 'restaurant' },
  { key: 'pantry', label: 'Pantry', icon: 'basket-outline', activeIcon: 'basket' },
  { key: 'profile', label: 'Profile', icon: 'person-circle-outline', activeIcon: 'person-circle' },
];

interface BottomNavBarProps {
  activeTab: TabKey;
  bottomOffset: number;
  onTabPress?: (tab: TabKey) => void;
  /** Set false to hide the blue + button (the Pantry hides it while you select items to remove). */
  showCreateButton?: boolean;
}

// Where each tab goes.
const TAB_ROUTES: Record<TabKey, '/' | '/meals' | '/pantry' | '/profile'> = {
  home: '/',
  meals: '/meals',
  pantry: '/pantry',
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
