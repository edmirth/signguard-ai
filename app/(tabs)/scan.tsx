import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync } from 'expo-file-system/legacy';
import DocumentScanner, { ResponseType, ScanDocumentResponseStatus } from 'react-native-document-scanner-plugin';
import { colors, fontSizes, spacing, radius } from '@/constants/theme';
import { setPendingScan } from '@/lib/pendingScan';
import { trackEvent } from '@/lib/analytics';

type ScreenState = 'choose' | 'preview' | 'converting';

export default function ScanScreen() {
  const [state, setState] = useState<ScreenState>('choose');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string>('image/jpeg');

  const handleScanDocument = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'Document scanning requires a native build. Please use the upload option instead.');
      return;
    }
    try {
      const result = await DocumentScanner.scanDocument({
        croppedImageQuality: 90,
        responseType: ResponseType.Base64,
        maxNumDocuments: 1,
      });
      if (result.status === ScanDocumentResponseStatus.Success && result.scannedImages?.length) {
        const base64 = result.scannedImages[0];
        setPreviewBase64(base64);
        setPreviewUri(`data:image/jpeg;base64,${base64}`);
        setPreviewMime('image/jpeg');
        setState('preview');
      }
    } catch {
      // user cancelled or error — stay on choose screen
    }
  }, []);

  const handlePickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload a contract.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const b64 = asset.base64 ?? null;
      if (b64) {
        setPreviewBase64(b64);
        setPreviewUri(asset.uri);
        setPreviewMime(asset.mimeType ?? 'image/jpeg');
        setState('preview');
      }
    }
  }, []);

  const handlePickDocument = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setState('converting');
      try {
        const b64 = await readAsStringAsync(asset.uri, { encoding: 'base64' });
        setPreviewBase64(b64);
        setPreviewUri(asset.uri);
        setPreviewMime(asset.mimeType ?? 'image/jpeg');
        setState('preview');
      } catch {
        setState('choose');
        Alert.alert('Error', 'Failed to read the file. Please try a different file.');
      }
    }
  }, []);

  const handleRetake = useCallback(() => {
    setPreviewUri(null);
    setPreviewBase64(null);
    setPreviewMime('image/jpeg');
    setState('choose');
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!previewBase64) return;
    setPendingScan(previewBase64, previewMime);
    trackEvent('scan_started');
    router.push('/analyzing');
  }, [previewBase64, previewMime]);

  if (state === 'converting') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.convertingText}>Processing file…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state === 'preview' && previewUri) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>Contract Preview</Text>
        </View>
        <View style={styles.previewImageContainer}>
          <Image
            source={{ uri: previewUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
            <Text style={styles.analyzeText}>Analyze Contract</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.chooseContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Scan a Contract</Text>
        <Text style={styles.subheading}>
          Take a photo of any contract or upload from your device.
        </Text>

        {/* Scan with camera */}
        <TouchableOpacity style={styles.primaryOption} onPress={handleScanDocument} activeOpacity={0.8}>
          <Text style={styles.optionIcon}>📷</Text>
          <View style={styles.optionTextGroup}>
            <Text style={styles.optionTitle}>Scan Document</Text>
            <Text style={styles.optionDesc}>
              Use your camera with automatic edge detection
              {Platform.OS === 'web' ? ' (requires native build)' : ''}
            </Text>
          </View>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>

        <Text style={styles.orLabel}>or upload</Text>

        {/* Gallery */}
        <TouchableOpacity style={styles.secondaryOption} onPress={handlePickFromGallery} activeOpacity={0.8}>
          <Text style={styles.optionIcon}>🖼️</Text>
          <View style={styles.optionTextGroup}>
            <Text style={styles.optionTitle}>From Photo Library</Text>
            <Text style={styles.optionDesc}>Select an existing photo of a contract</Text>
          </View>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>

        {/* Files */}
        <TouchableOpacity style={styles.secondaryOption} onPress={handlePickDocument} activeOpacity={0.8}>
          <Text style={styles.optionIcon}>📄</Text>
          <View style={styles.optionTextGroup}>
            <Text style={styles.optionTitle}>From Files</Text>
            <Text style={styles.optionDesc}>Import a PDF or image from your device storage</Text>
          </View>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  convertingText: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    marginTop: spacing.sm,
  },
  // Choose state
  chooseContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  heading: {
    color: colors.text,
    fontSize: fontSizes['2xl'],
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subheading: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    marginBottom: spacing['2xl'],
    lineHeight: 22,
  },
  primaryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '22',
    borderColor: colors.accent + '66',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  secondaryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  optionIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  optionTextGroup: {
    flex: 1,
  },
  optionTitle: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDesc: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    lineHeight: 18,
  },
  optionArrow: {
    color: colors.textMuted,
    fontSize: 22,
    marginLeft: spacing.sm,
  },
  orLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
    letterSpacing: 0.5,
  },
  // Preview state
  previewHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  previewTitle: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: '700',
  },
  previewImageContainer: {
    flex: 1,
    marginHorizontal: spacing.xl,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xl,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  retakeText: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  analyzeButton: {
    flex: 2,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  analyzeText: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
});
