import time
import os
import signal
import sys
import yaml
try:
    import RPi.GPIO as GPIO
except ImportError:
    # Fallback for development on non-Pi systems
    from unittest.mock import MagicMock
    GPIO = MagicMock()

class UPSMonitor:
    """
    Monitors the Geekworm X1202 UPS HAT for power loss/ignition off events.
    Triggers a graceful system shutdown to prevent SD card corruption.
    """

    def __init__(self, config_path="../config.yaml"):
        self.load_config(config_path)
        self.pl_pin = self.config['power'].get('pl_gpio_pin', 6)
        self.running = False

    def load_config(self, path):
        with open(path, 'r') as f:
            self.config = yaml.safe_load(f)

    def setup(self):
        """Initialize GPIO."""
        GPIO.setmode(GPIO.BCM)
        # Set up PLD pin as input with pull-up resistor if needed
        # Note: X1202 logic usually drives the pin high/low. 
        # Referencing typical Geekworm scripts: HIGH = Power present, LOW = Power Lost (Battery Mode)
        GPIO.setup(self.pl_pin, GPIO.IN, pull_up_down=GPIO.PUD_UP) 

    def monitor(self):
        """Main monitoring loop."""
        self.running = True
        print(f"UPS Monitor started on GPIO {self.pl_pin}")
        
        consecutive_lows = 0
        threshold = 3 # Number of checks to confirm power loss
        
        try:
            while self.running:
                # Read pin state
                state = GPIO.input(self.pl_pin)
                
                # Logic: If using X1202, consult manual. 
                # Assumption: Pin goes LOW when ACC is off and running on battery.
                if state == GPIO.LOW:
                    consecutive_lows += 1
                    print(f"Power Loss Detected! ({consecutive_lows}/{threshold})")
                else:
                    consecutive_lows = 0
                
                if consecutive_lows >= threshold:
                    self.initiate_shutdown()
                    break
                
                time.sleep(1)
        except KeyboardInterrupt:
            self.cleanup()

    def initiate_shutdown(self):
        """Executes graceful shutdown."""
        delay = self.config['power'].get('shutdown_delay', 5)
        print(f"Ignition OFF confirmed. System shutting down in {delay} seconds...")
        time.sleep(delay)
        
        # In a real deployment, call system shutdown
        # os.system("sudo poweroff") 
        print("SIMULATION: sudo poweroff executed.")
        self.cleanup()

    def cleanup(self):
        self.running = False
        GPIO.cleanup()
        print("UPS Monitor Stopped.")

if __name__ == "__main__":
    monitor = UPSMonitor()
    monitor.setup()
    monitor.monitor()
