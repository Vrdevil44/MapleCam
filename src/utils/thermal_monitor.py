import time
import os
try:
    import RPi.GPIO as GPIO
except ImportError:
    from unittest.mock import MagicMock
    GPIO = MagicMock()

class ThermalMonitor:
    """
    Monitors CPU temperature and controls the Active Cooler fan.
    """
    def __init__(self, fan_pin=14, target_temp=60):
        self.fan_pin = fan_pin
        self.target_temp = target_temp
        self.running = False
        self.pwm = None

    def get_cpu_temp(self):
        """Reads the CPU temperature from the system file."""
        try:
            with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
                temp = float(f.read()) / 1000.0
            return temp
        except FileNotFoundError:
            return 45.0 # Simulation value

    def start(self):
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.fan_pin, GPIO.OUT)
        self.pwm = GPIO.PWM(self.fan_pin, 100) # 100Hz
        self.pwm.start(0)
        self.running = True
        
        print("Thermal Monitor Started.")
        try:
            while self.running:
                temp = self.get_cpu_temp()
                duty_cycle = self.calculate_fan_speed(temp)
                self.pwm.ChangeDutyCycle(duty_cycle)
                time.sleep(2)
        except KeyboardInterrupt:
            self.stop()
            
    def calculate_fan_speed(self, temp):
        """Simple proportional control."""
        if temp < 50:
            return 0
        elif temp >= 75:
            return 100
        else:
            # Linear ramp from 50C (20%) to 75C (100%)
            return 20 + ((temp - 50) * 3.2)

    def stop(self):
        self.running = False
        if self.pwm:
            self.pwm.stop()
        GPIO.cleanup()
        print("Thermal Monitor Stopped.")

if __name__ == "__main__":
    mon = ThermalMonitor()
    mon.start()
