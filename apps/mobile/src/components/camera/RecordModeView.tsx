import { View, Text, StyleSheet, Platform } from 'react-native';
import { CameraView } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCamera } from '../../hooks/useCamera';
import { useAudioSession } from '../../hooks/useAudioSession';
import { RecordButton } from '../RecordButton';
import { DurationTimer } from '../DurationTimer';
import { ControlBar } from '../ControlBar';

export function RecordModeView() {
  const insets = useSafeAreaInsets();
  const audio = useAudioSession();
  const camera = useCamera();

  const isRecording = camera.recordingState === 'recording';
  const isSaving = camera.recordingState === 'saving';

  function handleRecordPress() {
    if (isRecording) {
      camera.stopRecording();
    } else {
      camera.startRecording();
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={camera.cameraRef}
        style={styles.camera}
        facing={camera.facing}
        flash={camera.flash}
        mode="video"
      />

      {/* Top controls */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidOverlay]} />
        )}
        <ControlBar
          onToggleFacing={camera.toggleFacing}
          disabled={isRecording}
        />
      </View>

      {/* Audio warning */}
      {audio.status === 'error' && (
        <View style={styles.audioWarning}>
          <Text style={styles.audioWarningText}>
            Audio mixing unavailable: {audio.error}
          </Text>
        </View>
      )}

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidOverlay]} />
        )}
        {isSaving && (
          <Text style={styles.savingText}>Saving to camera roll...</Text>
        )}

        <DurationTimer isRunning={isRecording} />

        <RecordButton
          isRecording={isRecording}
          onPress={handleRecordPress}
          disabled={isSaving || audio.status !== 'ready'}
        />

        {audio.status === 'initializing' && (
          <Text style={styles.hint}>Setting up audio session...</Text>
        )}

        {audio.status === 'ready' && !isRecording && !isSaving && (
          <Text style={styles.hint}>
            Start your music, then tap record
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  androidOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  audioWarning: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  audioWarningText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 20,
    overflow: 'hidden',
  },
  savingText: {
    color: '#4cd964',
    fontSize: 14,
    marginBottom: 12,
    zIndex: 1,
  },
  hint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
    zIndex: 1,
  },
});
