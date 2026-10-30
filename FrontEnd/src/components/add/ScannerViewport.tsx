import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';

import { styles } from '../../styles/add/scannerViewport.styles';

interface ScannerViewportProps {
  guide: 'barcode' | 'date'; // shape of the white corner guide
  statusLabel: string; // chip in the top-left corner
  statusTone: 'searching' | 'busy' | 'success';
  torchOn: boolean;
  onToggleTorch: () => void;
  children: ReactNode; // the <CameraView> (or the permission prompt)
}

const DOT_COLORS = { searching: '#FBBF24', busy: '#60A5FA', success: '#4ADE80' } as const;

// The rounded camera area: live preview, corner guide, status chip, flashlight button.
export function ScannerViewport({
  guide,
  statusLabel,
  statusTone,
  torchOn,
  onToggleTorch,
  children,
}: ScannerViewportProps) {
  // Blue line sweeping up and down inside the barcode guide (only while still searching).
  const sweep = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (guide !== 'barcode' || statusTone !== 'searching') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [guide, statusTone, sweep]);

  // Scanner guide UI
  const guideSize = guide === 'barcode' ? styles.guideBarcode : styles.guideDate;
  const cornerColor = statusTone === 'success' ? styles.guideSuccess : null;
  const guideHeight = guide === 'barcode' ? 130 : 72;

  return (
    <View style={styles.frame}>
      {children}

      <View style={styles.guideArea} pointerEvents="none">
        <View style={guideSize}>
          <View style={[styles.corner, styles.topLeft, cornerColor]} />
          <View style={[styles.corner, styles.topRight, cornerColor]} />
          <View style={[styles.corner, styles.bottomLeft, cornerColor]} />
          <View style={[styles.corner, styles.bottomRight, cornerColor]} />
          {guide === 'barcode' && statusTone === 'searching' && (
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: sweep.interpolate({ inputRange: [0, 1], outputRange: [8, guideHeight - 10] }) }] },
              ]}
            />
          )}
        </View>
      </View>

      <View style={styles.chip} pointerEvents="none">
        <View style={[styles.chipDot, { backgroundColor: DOT_COLORS[statusTone] }]} />
        <Text style={styles.chipText}>{statusLabel}</Text>
      </View>

      <Pressable
        style={[styles.torch, torchOn && styles.torchOn]}
        onPress={onToggleTorch}
        accessibilityRole="button"
        accessibilityLabel={torchOn ? 'Turn flashlight off' : 'Turn flashlight on'}
      >
        <Ionicons name={torchOn ? 'flashlight' : 'flashlight-outline'} size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
