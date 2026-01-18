import gi
import sys
import time
import os
import yaml

gi.require_version('Gst', '1.0')
from gi.repository import Gst, GLib

class CameraStream:
    """
    Manages the GStreamer pipeline for MapleCam Sentinel.
    Splits input from libcamerasrc into 3 branches:
    1. Evidence Recording (High Res, H.264, SplitMuxSink)
    2. AI Inference (Low Res, RGB, HailoNet)
    3. Live Preview (Low Res, MJPEG, AppSink)
    """

    def __init__(self, config_path="../config.yaml"):
        Gst.init(None)
        self.load_config(config_path)
        self.pipeline = None
        self.loop = GLib.MainLoop()
        
        # Ensure recording directory exists
        os.makedirs(self.config['paths']['raw_recordings'], exist_ok=True)

    def load_config(self, path):
        with open(path, 'r') as f:
            self.config = yaml.safe_load(f)

    def build_pipeline(self):
        """Constructs the GStreamer pipeline string."""
        
        # Camera Source
        width = self.config['camera']['width']
        height = self.config['camera']['height']
        framerate = self.config['camera']['framerate']
        bitrate = self.config['camera']['encoding_bitrate']
        rec_path = os.path.join(self.config['paths']['raw_recordings'], "evidence_%04d.mp4")
        
        source = f"libcamerasrc ! video/x-raw,width={width},height={height},framerate={framerate}/1,format=NV12 ! tee name=t"

        # Branch A: Evidence Recording
        # Uses splitmuxsink to create chunks of video (e.g., 60s)
        branch_evidence = (
            f"t. ! queue ! v4l2h264enc bitrate={bitrate} ! h264parse ! "
            f"splitmuxsink location={rec_path} max-size-time={self.config['system']['loop_buffer_seconds']}000000000"
        )

        # Branch B: AI Inference (Stub for now)
        # Downscales to 640x640 for YOLO
        # Note: We use fakesink for now until Hailo is fully integrated
        branch_ai = (
            "t. ! queue leaky=2 ! videoscale ! video/x-raw,width=640,height=640 ! "
            "videoconvert ! fakesink name=ai_sink" 
        )

        # Branch C: Live Preview
        # Downscales for web streaming (MJPEG)
        branch_preview = (
            "t. ! queue leaky=2 ! videoscale ! video/x-raw,width=640,height=480 ! "
            "jpegenc ! appsink name=preview_sink emit-signals=True max-buffers=1 drop=True"
        )

        pipeline_str = f"{source} {branch_evidence} {branch_ai} {branch_preview}"
        print(f"Building Pipeline: {pipeline_str}")
        
        try:
            self.pipeline = Gst.parse_launch(pipeline_str)
        except Exception as e:
            print(f"Error building pipeline: {e}")
            sys.exit(1)

    def start(self):
        if not self.pipeline:
            self.build_pipeline()
        
        ret = self.pipeline.set_state(Gst.State.PLAYING)
        if ret == Gst.StateChangeReturn.FAILURE:
            print("Unable to set the pipeline to the playing state.")
            sys.exit(1)
        
        # Listen for bus messages (errors, EOS)
        bus = self.pipeline.get_bus()
        bus.add_signal_watch()
        bus.connect("message", self.on_message)
        
        print("Camera Stream Started.")
        try:
            self.loop.run()
        except KeyboardInterrupt:
            self.stop()

    def stop(self):
        print("Stopping Camera Stream...")
        if self.pipeline:
            self.pipeline.set_state(Gst.State.NULL)
        self.loop.quit()

    def on_message(self, bus, message):
        t = message.type
        if t == Gst.MessageType.ERROR:
            err, debug = message.parse_error()
            print(f"Error: {err}, {debug}")
            self.stop()
        elif t == Gst.MessageType.EOS:
            print("End-Of-Stream reached.")
            self.stop()

if __name__ == "__main__":
    # Test runner
    cam = CameraStream()
    cam.start()
