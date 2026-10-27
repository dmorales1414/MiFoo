import { StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme';

const CORNER = 30;
const CORNER_THICKNESS = 4;

export const styles = StyleSheet.create({
  frame: {
    height: 300,
    marginHorizontal: spacing.xl,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.scannerBackground,
  },
  guideArea: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  guideBarcode: { width: '74%', height: 130 },
  guideDate: { width: '88%', height: 72 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#FFFFFF' },
  topLeft: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 10 },
  topRight: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 10 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 10 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 10 },
  guideSuccess: { borderColor: '#4ADE80' },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: colors.primary },
  chip: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  torch: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchOn: { backgroundColor: colors.primary },
});
