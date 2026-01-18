from flask import Flask, render_template, Response, jsonify, send_from_directory
import os
import time
import json

app = Flask(__name__)

# Global references to hardware singletons
camera_stream = None
gps_monitor = None
zone_monitor = None
config = {}

def configure_web_app(cam, gps, zone, cfg):
    global camera_stream, gps_monitor, zone_monitor, config
    camera_stream = cam
    gps_monitor = gps
    zone_monitor = zone
    config = cfg

@app.route('/')
def index():
    # Serves the PWA Mobile App
    return render_template('index.html')

@app.route('/manifest.json')
def manifest():
    return send_from_directory('static', 'manifest.json')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

def gen_frames():
    """Video streaming generator function."""
    while True:
        if camera_stream:
            # In a real GStreamer app, we would pull a buffer from appsink
            # For this prototype without hardware, we simulate mjpeg or wait
            # If camera_stream has a method get_frame() implemented
            frame = camera_stream.get_last_frame_bytes() # Needs implementation in CameraStream
            if frame:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        time.sleep(0.1)

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/status')
def status():
    """Returns JSON status of GPS and Zones for the UI overlay."""
    data = {"status": "Active", "time": time.strftime("%H:%M:%S")}
    
    if gps_monitor:
        gps_data = gps_monitor.get_data()
        data.update(gps_data)
        
        # Check Zone
        if zone_monitor:
            in_zone, zone_name = zone_monitor.check_zone(gps_data['latitude'], gps_data['longitude'])
            data['school_zone'] = in_zone
            data['zone_name'] = zone_name
            
    return jsonify(data)

@app.route('/evidence')
def list_evidence():
    """List files in evidence locker."""
    path = config['paths']['evidence_locker']
    try:
        files = os.listdir(path)
    except FileNotFoundError:
        files = []
    return jsonify(files)

# Run function
def run_server(host='0.0.0.0', port=5000):
    app.run(host=host, port=port, debug=False, use_reloader=False)
