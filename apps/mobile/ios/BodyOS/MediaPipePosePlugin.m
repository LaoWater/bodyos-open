#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>

@interface MediaPipePosePlugin : FrameProcessorPlugin
@end

VISION_EXPORT_SWIFT_FRAME_PROCESSOR(MediaPipePosePlugin, detectPose)
