// MapleCam PWA Logic - Real AI & Sensors Edition

// --- Constants ---
let SCHOOL_ZONES = [{ name: "Test Zone", lat: 0, lon: 0, radius: 0.002 }];
const SAFE_CLASSES = ['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'person', 'traffic light', 'stop sign'];
const IMPACT_THRESHOLD = 2.5; // G-Force

// --- State ---
let stream = null;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let currentLocation = { lat: 0, lon: 0, speed: 0 };
let currentG = { x: 0, y: 0, z: 0, total: 1.0 };

// AI Models
let objectModel = null;
let faceModel = null;
let aiLoaded = false;

// --- DOM Elements ---
const video = document.getElementById('webcam');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const zoneAlert = document.getElementById('zone-alert');
const gpsStatus = document.getElementById('gps-status');
const aiStatus = document.getElementById('ai-status');
const speedDisplay = document.getElementById('speed-display');
const gDisplay = document.getElementById('g-display');
const recBtn = document.getElementById('record-btn');
const uploadInput = document.getElementById('video-upload');
const sensorBtn = document.getElementById('sensor-btn');

// --- Initialization ---
async function init() {
    try {
        // 1. Load Models
        loadModels();

        // 2. Start Camera
        startCamera();

        // 3. Start GPS
        if ("geolocation" in navigator) {
            navigator.geolocation.watchPosition(updateLocation, gpsError, { enableHighAccuracy: true });
        }

        // 4. Check for Sensor Permissions (iOS 13+)
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            sensorBtn.style.display = 'flex'; // Show button to ask permission
        } else {
            // Android/Older iOS usually allow by default
            window.addEventListener('devicemotion', handleMotion);
        }

        // 5. Listeners
        uploadInput.addEventListener('change', handleFileUpload);
        video.addEventListener('loadeddata', () => {
            requestAnimationFrame(gameLoop);
        });

    } catch (err) {
        console.error("Init Error:", err);
    }
}

async function loadModels() {
    aiStatus.innerText = "AI: Loading...";
    try {
        objectModel = await cocoSsd.load();
        faceModel = await blazeface.load();
        aiLoaded = true;
        aiStatus.innerText = "AI: Active";
        aiStatus.className = "hud-item status-ok";
    } catch (e) {
        console.error(e);
        aiStatus.innerText = "AI: Error";
        aiStatus.className = "hud-item status-warn";
    }
}

async function startCamera() {
    try {
        const constraints = {
            video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.removeAttribute('src');
    } catch (e) {
        console.warn("Camera failed");
    }
}

function requestSensors() {
    // Required for iOS 13+ to access Accelerometer
    DeviceMotionEvent.requestPermission()
        .then(response => {
            if (response === 'granted') {
                window.addEventListener('devicemotion', handleMotion);
                sensorBtn.style.display = 'none';
            } else {
                alert("Sensor permission denied");
            }
        })
        .catch(console.error);
}

function handleMotion(event) {
    // Gravity is usually included in accelerationIncludingGravity
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;

    // Calculate Total G (Earth = ~9.8 m/s^2)
    const totalForce = Math.sqrt(x * x + y * y + z * z) / 9.8;

    currentG.total = totalForce;
    gDisplay.innerText = "G: " + totalForce.toFixed(2);

    // Impact Detection
    if (totalForce > IMPACT_THRESHOLD) {
        gDisplay.style.backgroundColor = "red";
        if (!isRecording) {
            console.log("Impact Detected! Auto-Recording...");
            startRecording();
            setTimeout(stopUnknownRecording, 10000); // Record 10s post impact
        }
    } else {
        gDisplay.style.backgroundColor = "rgba(0,0,0,0.6)";
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        video.srcObject = null;
        video.src = url;
        video.play();
        aiStatus.innerText = "File Mode";
    }
}

// --- Loops ---

function updateLocation(pos) {
    const { latitude, longitude, speed } = pos.coords;
    currentLocation.speed = (speed || 0) * 3.6;

    // Create Test Zone around start point
    if (SCHOOL_ZONES[0].lat === 0) {
        SCHOOL_ZONES[0].lat = latitude + 0.0005;
        SCHOOL_ZONES[0].lon = longitude;
    }

    gpsStatus.innerText = "GPS: Fix";
    gpsStatus.className = "hud-item status-ok";
    speedDisplay.innerText = Math.round(currentLocation.speed) + " km/h";

    checkZones(latitude, longitude);
}

function gpsError() { gpsStatus.innerText = "GPS: Lost"; }

function checkZones(lat, lon) {
    let inZone = false;
    for (let zone of SCHOOL_ZONES) {
        const d = Math.sqrt(Math.pow(zone.lat - lat, 2) + Math.pow(zone.lon - lon, 2));
        if (d < zone.radius) {
            inZone = true;
            zoneAlert.querySelector('span').innerText = `Max 30 km/h - ${zone.name}`;
        }
    }
    zoneAlert.style.display = inZone ? 'block' : 'none';
}

async function gameLoop() {
    if (video.paused || video.ended) {
        requestAnimationFrame(gameLoop);
        return;
    }
    if (video.videoWidth > 0 && canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (aiLoaded) {
        await detectObjects();
        await detectFaces();
    }
    requestAnimationFrame(gameLoop);
}

async function detectObjects() {
    // COCO-SSD
    const predictions = await objectModel.detect(video);

    predictions.forEach(p => {
        if (SAFE_CLASSES.includes(p.class)) {
            ctx.strokeStyle = "#34c759";
            ctx.lineWidth = 4;
            ctx.strokeRect(p.bbox[0], p.bbox[1], p.bbox[2], p.bbox[3]);

            ctx.fillStyle = "#34c759";
            ctx.fillRect(p.bbox[0], p.bbox[1] - 25, p.bbox[2], 25);
            ctx.fillStyle = "black";
            ctx.font = "bold 16px sans-serif";
            ctx.fillText(`${p.class.toUpperCase()} ${Math.round(p.score * 100)}%`, p.bbox[0] + 5, p.bbox[1] - 7);
        }
    });
}

async function detectFaces() {
    // Blazeface
    const pass = await faceModel.estimateFaces(video, false);
    pass.forEach(p => {
        const start = p.topLeft;
        const end = p.bottomRight;
        const size = [end[0] - start[0], end[1] - start[1]];

        ctx.fillStyle = "black";
        ctx.fillRect(start[0], start[1], size[0], size[1]);
        ctx.fillStyle = "white";
        ctx.font = "12px sans-serif";
        ctx.fillText("PRIVACY", start[0], start[1] - 5);
    });
}

// --- Triggers ---

async function triggerOCR() {
    const tempCanvas = document.createElement('canvas'); // Temp snapshot
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempCanvas.getContext('2d').drawImage(video, 0, 0);

    aiStatus.innerText = "OCR...";
    try {
        const { data: { text } } = await Tesseract.recognize(tempCanvas, 'eng');
        alert("OCR Result: " + text);
    } catch (e) { }
    aiStatus.innerText = "AI: Active";
}

function toggleRecording() {
    if (isRecording) stopUnknownRecording();
    else startRecording();
}

function startRecording() {
    recBtn.classList.add("recording");
    recordedChunks = [];
    try {
        mediaRecorder = new MediaRecorder(stream || video.captureStream());
    } catch (e) {
        // Fallback for file playback
        mediaRecorder = new MediaRecorder(video.captureStream());
    }
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = saveRecording;
    mediaRecorder.start();
    isRecording = true;
}

function stopUnknownRecording() {
    recBtn.classList.remove("recording");
    mediaRecorder.stop();
    isRecording = false;
}

function saveRecording() {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = "maplecam_" + Date.now() + ".webm";
    a.click();
}

window.addEventListener('load', init);
