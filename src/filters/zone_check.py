import datetime
from shapely.geometry import Point, Polygon
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SchoolZone")

class SchoolZoneMonitor:
    """
    Monitors vehicle location against known School Zones.
    Enforces logic: active only on School Days (Mon-Fri) between 08:00 and 17:00.
    """
    
    def __init__(self):
        self.zones = self.load_zones()
        
    def load_zones(self):
        """
        Loads school zone polygons. 
        In production, this would load a GeoJSON file.
        For Phase 1/Mockup, we define a box around a coordinate in 'Burnaby' or a generic test area.
        """
        # Mock Zone: A small square. 
        # Replace with Real DataBC loading logic later.
        # Example Test Coordinate: 49.2, -123.0
        mock_poly = Polygon([
            (49.199, -123.001),
            (49.199, -122.999),
            (49.201, -122.999),
            (49.201, -123.001)
        ])
        
        return [{"name": "Mock Elementary", "geometry": mock_poly}]

    def is_school_time(self):
        """Checks if current time is within school zone enforcement hours."""
        now = datetime.datetime.now()
        
        # 1. Check Day of Week (Mon=0, Sun=6)
        if now.weekday() > 4: # Sat or Sun
            return False
            
        # 2. Check Time (08:00 - 17:00)
        start_time = now.replace(hour=8, minute=0, second=0, microsecond=0)
        end_time = now.replace(hour=17, minute=0, second=0, microsecond=0)
        
        return start_time <= now <= end_time

    def check_zone(self, lat, lon):
        """
        Determines if the coordinate is in a zone during active hours.
        Returns: (InZone: bool, ZoneName: str)
        """
        if not self.is_school_time():
            return False, None
            
        point = Point(lat, lon)
        
        for zone in self.zones:
            if zone["geometry"].contains(point):
                logger.info(f"Entered School Zone: {zone['name']}")
                return True, zone["name"]
                
        return False, None

if __name__ == "__main__":
    # Test
    mon = SchoolZoneMonitor()
    # Mock date override for test if needed, but defaults to system time
    in_zone, name = mon.check_zone(49.2, -123.0)
    print(f"Zone Check (49.2, -123.0): {in_zone} ({name})")
