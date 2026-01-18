import threading
import signal
import sys
import time
import yaml

# Ensure src is in path
sys.path.append("src")

from capture.camera_stream import CameraStream
from utils.ups_monitor import UPSMonitor
from utils.gps_monitor import GPSMonitor
from filters.zone_check import SchoolZoneMonitor
import web.server as web_server

def main():
    print("MapleCam Sentinel Starting...")
    
    # Load config
    with open("config.yaml", 'r') as f:
        config = yaml.safe_load(f)

    # Initialize components
    ups = UPSMonitor()
    gps = GPSMonitor()
    zones = SchoolZoneMonitor()
    camera = CameraStream()
    
    # Configure Web App
    web_server.configure_web_app(camera, gps, zones, config)
    
    # 1. Start Support Threads
    ups.setup()
    threading.Thread(target=ups.monitor, daemon=True).start()
    
    gps.start()
    
    # 2. Start Web Server (Threaded)
    # Flask run is blocking, so we put it in a thread. 
    # In production with gunicorn, this changes.
    web_thread = threading.Thread(target=web_server.run_server, kwargs={'host':'0.0.0.0', 'port':5000}, daemon=True)
    web_thread.start()
    print("Web Logic Started on port 5000")
    
    # 3. Start Camera Stream (Blocking Main Loop)
    try:
        camera.start()
    except KeyboardInterrupt:
        print("\nShutdown requested...")
    finally:
        camera.stop()
        gps.stop()
        ups.cleanup()
        print("MapleCam Sentinel Shutdown Complete.")

if __name__ == "__main__":
    main()
