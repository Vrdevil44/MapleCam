import threading
import time
import logging
import random # For simulation

# Try importing pyserial, mock if missing
try:
    import serial
    import pynmea2
except ImportError:
    serial = None
    pynmea2 = None

logger = logging.getLogger("GPS")

class GPSMonitor:
    """
    Reads from GPS Serial module.
    Updates shared state with current Loc/Speed.
    """
    
    def __init__(self, port='/dev/ttyUSB0', baudrate=9600):
        self.port = port
        self.baudrate = baudrate
        self.running = False
        self.current_data = {
            "latitude": 0.0,
            "longitude": 0.0,
            "speed_kmh": 0.0,
            "fix": False
        }
        self.lock = threading.Lock()

    def start(self):
        self.running = True
        t = threading.Thread(target=self._run, daemon=True)
        t.start()
        print("GPS Monitor Started.")

    def _run(self):
        if serial:
            try:
                with serial.Serial(self.port, self.baudrate, timeout=1) as ser:
                    while self.running:
                        line = ser.readline().decode('ascii', errors='replace').strip()
                        if line.startswith('$GPRMC') or line.startswith('$GNRMC'):
                             self._parse_nmea(line)
            except Exception as e:
                logger.error(f"GPS Error: {e}")
                # Fallback to simulation loop if hardware fails
                self._run_simulation()
        else:
            self._run_simulation()

    def _parse_nmea(self, line):
        if not pynmea2: return
        try:
            msg = pynmea2.parse(line)
            with self.lock:
                self.current_data["latitude"] = msg.latitude
                self.current_data["longitude"] = msg.longitude
                self.current_data["speed_kmh"] = (msg.spd_over_grnd * 1.852) if msg.spd_over_grnd else 0
                self.current_data["fix"] = (msg.status == 'A')
        except pynmea2.ParseError:
            pass

    def _run_simulation(self):
        """Simulate driving through the test point."""
        print("Running GPS Simulation Mode...")
        # Start near Mock Zone (49.2, -123.0)
        lat = 49.198
        lon = -123.000
        
        while self.running:
            # Move North
            lat += 0.0001 
            
            with self.lock:
                self.current_data["latitude"] = lat
                self.current_data["longitude"] = lon
                self.current_data["speed_kmh"] = random.uniform(30, 50)
                self.current_data["fix"] = True
            
            time.sleep(1)

    def get_data(self):
        with self.lock:
            return self.current_data.copy()

    def stop(self):
        self.running = False

if __name__ == "__main__":
    gps = GPSMonitor()
    gps.start()
    try:
        while True:
            print(gps.get_data())
            time.sleep(2)
    except KeyboardInterrupt:
        gps.stop()
