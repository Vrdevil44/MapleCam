// MapleCam PWA Logic

// --- Constants ---
// Mock School Zone (A box around the user's starting location for demo purposes)
let SCHOOL_ZONES = [
    { name: "Demo Elementary", lat: 0, lon: 0, radius: 0.002 } // ~200m
];

// --- State ---
let stream = null;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let simulationMode = false;
let currentLocation = { lat: 0, lon: 0, speed: 0 };

// --- DOM Elements ---
const video = document.getElementById('webcam');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const zoneAlert = document.getElementById('zone-alert');
const gpsStatus = document.getElementById('gps-status');
const speedDisplay = document.getElementById('speed-display');
const recBtn = document.getElementById('record-btn');

// --- Initialization ---
async function init() {
    try {
        // 1. Start Camera
        // Request back camera specifically
        const constraints = { 
            video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false 
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        // 2. Start GPS
        if ("geolocation" in navigator) {
            navigator.geolocation.watchPosition(updateLocation, gpsError, {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 5000
            });
        } else {
            gpsStatus.innerText = "GPS: Not Supported";
            gpsStatus.className = "hud-item status-warn";
        }

        // 3. Start Loop
        requestAnimationFrame(gameLoop);

    } catch (err) {
        console.error("Init Error:", err);
        alert("Camera access denied or failed. Please allow camera permissions.");
    }
}

// --- Core Loops ---

function updateLocation(pos) {
    const { latitude, longitude, speed } = pos.coords;
    currentLocation.lat = latitude;
    currentLocation.lon = longitude;
    currentLocation.speed = (speed || 0) * 3.6; // m/s to km/h

    // Update Init Zone if 0,0
    if (SCHOOL_ZONES[0].lat === 0) {
        SCHOOL_ZONES[0].lat = latitude + 0.0005; // Place a mock zone slightly north
        SCHOOL_ZONES[0].lon = longitude;
        console.log("Mock Zone Placed at:", SCHOOL_ZONES[0]);
    }

    // Update UI
    gpsStatus.innerText = "GPS: Active";
    gpsStatus.className = "hud-item status-ok";
    speedDisplay.innerText = Math.round(currentLocation.speed) + " km/h";

    checkZones(latitude, longitude);
}

function gpsError(err) {
    gpsStatus.innerText = "GPS: Error";
    gpsStatus.className = "hud-item status-warn";
    console.warn("GPS Error", err);
}

function checkZones(lat, lon) {
    let inZone = false;
    for (let zone of SCHOOL_ZONES) {
        // Simple Euclidean distance for demo (not geo-accurate but fast)
        const d = Math.sqrt(Math.pow(zone.lat - lat, 2) + Math.pow(zone.lon - lon, 2));
        if (d < zone.radius) {
            inZone = true;
            zoneAlert.querySelector('span').innerText = `Max 30 km/h - ${zone.name}`;
        }
    }
    
    zoneAlert.style.display = inZone || simulationMode ? 'block' : 'none';
}

function gameLoop() {
    // 1. Resize Canvas to match Video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 2. Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3. Draw AI Simulation
    if (simulationMode) {
        drawSimulatedAI();
    }

    requestAnimationFrame(gameLoop);
}

function drawSimulatedAI() {
    // Draw a fake bounding box that drifts
    const t = Date.now() / 1000;
    const cw = canvas.width;
    const ch = canvas.height;
    
    // Box 1: "Car"
    const bx = (cw * 0.4) + Math.sin(t) * 50;
    const by = (ch * 0.5);
    const bw = cw * 0.2;
    const bh = ch * 0.2;

    ctx.strokeStyle = "#34c759";
    ctx.lineWidth = 4;
    ctx.strokeRect(bx, by, bw, bh);
    
    // Label
    ctx.fillStyle = "#34c759";
    ctx.fillRect(bx, by - 25, bw, 25);
    ctx.fillStyle = "black";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("Car: 98%", bx + 5, by - 7);
}

// --- Controls ---

function toggleSim() {
    simulationMode = !simulationMode;
    // Also toggle the zone alert for visual effect
    if(simulationMode) zoneAlert.style.display = 'block';
    else zoneAlert.style.display = 'none';
}

function toggleRecording() {
    if (isRecording) {
        stopUnknownRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    recBtn.classList.add("recording");
    recordedChunks = [];
    const options = { mimeType: 'video/webm;codecs=vp9' };
    
    try {
        mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
        mediaRecorder = new MediaRecorder(stream); // Fallback
    }

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    isRecording = true;
    console.log("Recording Started");
}

function stopUnknownRecording() {
    recBtn.classList.remove("recording");
    mediaRecorder.stop();
    isRecording = false;
    console.log("Recording Stopped");
    // Auto download handles in onstop usually, but simple approach here:
    setTimeout(saveRecording, 500); 
}

function handleDataAvailable(event) {
    if (event.data.size > 0) {
        recordedChunks.push(event.data);
    }
}

function saveRecording() {
    const blob = new Blob(recordedChunks, {
        type: "video/webm"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = "maplecam_evidence_" + Date.now() + ".webm";
    a.click();
    window.URL.revokeObjectURL(url);
}

function exportData() {
    alert("Exporting Incident Report...\n(This would generate the PDF in the full version)");
}

// Start
window.addEventListener('load', init);
