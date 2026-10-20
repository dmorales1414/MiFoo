import { Text, View } from 'react-native';

import { styles } from '../styles/exploreScreen.styles';

// Placeholder screen so the "/explore" route exists. Replace it (or rename the route)
// when you decide what this screen is for.
export default function ExploreScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}
