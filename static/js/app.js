// MapleCam PWA Logic - Phase 4: Tesla Vision & Sensor Fusion

// --- Constants ---
const SCHOOL_ZONES = [{ name: "Demo Elem", lat: 0, lon: 0, radius: 0.002 }];
const SAFE_CLASSES = ['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'person', 'traffic light', 'stop sign'];
const IMPACT_THRESHOLD = 2.0;

// --- State ---
let state = {
    speed: 0,
    gForce: 1.0,
    gpsFix: false,
    zone: null,
    recording: false,
    impactDetected: false,
    detections: []
};

let stream = null;
let mediaRecorder = null;
let recordedChunks = [];
let models = { obj: null, face: null };

// --- DOM References ---
const ui = {
    video: document.getElementById('webcam'),
    canvas: document.getElementById('overlay'),
    ctx: null,
    summary: document.getElementById('fusion-summary'),
    speed: document.getElementById('speed-display'),
    gForce: document.getElementById('g-display'),
    gps: document.getElementById('gps-status'),
    ai: document.getElementById('ai-status'),
    recBtn: document.getElementById('record-btn'),
    upload: document.getElementById('video-upload'),
    sensorBtn: document.getElementById('sensor-btn')
};
ui.ctx = ui.canvas.getContext('2d');

// --- Initialization ---
async function init() {
    console.log("MapleCam Phase 4 Starting...");
    try {
        await loadAI();
        await startCamera();
        startSensors();

        // Listeners
        ui.upload.addEventListener('change', handleUpload);
        ui.video.addEventListener('loadeddata', () => requestAnimationFrame(loop));

        // Sensor Fusion Loop (runs less frequent than render)
        setInterval(sensorFusion, 200);

    } catch (e) { console.error("Init Failed", e); }
}

async function loadAI() {
    ui.ai.innerText = "LOAD";
    try {
        models.obj = await cocoSsd.load();
        models.face = await blazeface.load();
        ui.ai.innerText = "ACTIVE";
    } catch (e) { ui.ai.innerText = "ERR"; }
}

async function startCamera() {
    const constraints = { video: { facingMode: "environment", width: { ideal: 1280 } } };
    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        ui.video.srcObject = stream;
        ui.video.removeAttribute('src');
    } catch (e) { console.warn("Cam Init Err", e); }
}

// --- Sensor Core ---

function startSensors() {
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(
            p => {
                state.speed = (p.coords.speed || 0) * 3.6;
                state.gpsFix = true;
                checkZone(p.coords.latitude, p.coords.longitude);
                ui.gps.innerText = "FIX";
            },
            () => { state.gpsFix = false; ui.gps.innerText = "LOST"; },
            { enableHighAccuracy: true }
        );
    }

    if (window.DeviceMotionEvent) {
        // Show permission button for iOS
        if (typeof DeviceMotionEvent.requestPermission === 'function') ui.sensorBtn.style.display = 'inline-block';
        else window.addEventListener('devicemotion', handleMotion);
    }
}

function handleMotion(e) {
    const acc = e.accelerationIncludingGravity;
    if (acc) {
        const total = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2) / 9.8;
        state.gForce = total;

        if (total > IMPACT_THRESHOLD && !state.impactDetected) {
            state.impactDetected = true;
            triggerImpactProtocol();
            setTimeout(() => state.impactDetected = false, 5000); // Cool down
        }
    }
}

function checkZone(lat, lon) {
    // Mock Init
    if (SCHOOL_ZONES[0].lat === 0) { SCHOOL_ZONES[0].lat = lat + 0.0005; SCHOOL_ZONES[0].lon = lon; }

    let active = null;
    SCHOOL_ZONES.forEach(z => {
        const d = Math.sqrt((z.lat - lat) ** 2 + (z.lon - lon) ** 2);
        if (d < z.radius) active = z.name;
    });
    state.zone = active;
}

// --- Sensor Fusion Engine ---

function sensorFusion() {
    // Aggregates data into a meaningful summary
    const s = state;
    let msg = "CRUISING - ALL SYSTEMS NOMINAL";
    let color = "#3498db"; // Blue default

    ui.speed.innerText = Math.round(s.speed);
    ui.gForce.innerText = s.gForce.toFixed(2);

    // Hierarchy of Importance:
    // 1. Impact / Hard Braking
    if (s.gForce > 1.8) {
        msg = "⚠️ HARD BRAKING DETECTED";
        color = "#e74c3c"; // Red
    }
    // 2. School Zone Violation
    else if (s.zone && s.speed > 30) {
        msg = `⚠️ SPEEDING IN ${s.zone} (${Math.round(s.speed)} km/h)`;
        color = "#e74c3c";
    }
    // 3. School Zone Caution
    else if (s.zone) {
        msg = `CAUTION: ${s.zone} - MAINTAIN 30`;
        color = "#f1c40f"; // Yellow
    }
    // 4. Object Detection Context
    else if (s.detections.length > 0) {
        // Find most prominent object
        const nearest = s.detections.sort((a, b) => b.bbox[2] * b.bbox[3] - a.bbox[2] * a.bbox[3])[0];
        if (nearest) {
            msg = `TRACKING: ${nearest.class.toUpperCase()} AHEAD`;
        }
    }

    ui.summary.innerText = msg;
    ui.summary.style.border = `1px solid ${color}`;
    ui.summary.style.color = color == "#3498db" ? "white" : color;
}

// --- Tesla Vision Rendering ---

async function loop() {
    if (ui.video.paused) return requestAnimationFrame(loop);

    // Match Dimensions
    if (ui.canvas.width !== ui.video.videoWidth) {
        ui.canvas.width = ui.video.videoWidth;
        ui.canvas.height = ui.video.videoHeight;
    }

    ui.ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);

    // AI Inference
    if (models.obj) {
        const preds = await models.obj.detect(ui.video);
        state.detections = preds.filter(p => SAFE_CLASSES.includes(p.class));
        drawVectorHUD(state.detections);
    }

    if (models.face) {
        const faces = await models.face.estimateFaces(ui.video, false);
        drawPrivacyMasks(faces);
    }

    requestAnimationFrame(loop);
}

function drawVectorHUD(objects) {
    const ctx = ui.ctx;

    // Draw Projected Path Lines (Simulation)
    const w = ui.canvas.width;
    const h = ui.canvas.height;

    ctx.beginPath();
    ctx.strokeStyle = "rgba(52, 152, 219, 0.3)";
    ctx.lineWidth = 2;
    // Left Line
    ctx.moveTo(w * 0.2, h);
    ctx.lineTo(w * 0.45, h * 0.55);
    // Right Line
    ctx.moveTo(w * 0.8, h);
    ctx.lineTo(w * 0.55, h * 0.55);
    ctx.stroke();

    objects.forEach(obj => {
        const [x, y, width, height] = obj.bbox;
        const score = Math.round(obj.score * 100);

        // Tesla Style: Semi-transparent fill + Corner Brackets
        ctx.fillStyle = "rgba(52, 152, 219, 0.1)";
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = "#3498db";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Floating Label
        ctx.fillStyle = "#3498db";
        ctx.fillRect(x, y - 18, width, 18);
        ctx.fillStyle = "black";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(`${obj.class.toUpperCase()} ${score}%`, x + 4, y - 5);

        // Distance Line (Simulated)
        ctx.beginPath();
        ctx.moveTo(w / 2, h); // From center bottom
        ctx.lineTo(x + width / 2, y + height); // To object bottom
        ctx.strokeStyle = "rgba(52, 152, 219, 0.2)";
        ctx.stroke();
    });
}

function drawPrivacyMasks(faces) {
    faces.forEach(face => {
        const [x, y] = face.topLeft;
        const [x2, y2] = face.bottomRight;
        const w = x2 - x;
        const h = y2 - y;

        ui.ctx.fillStyle = "rgba(0,0,0,0.95)";
        ui.ctx.fillRect(x, y, w, h);

        ui.ctx.fillStyle = "white";
        ui.ctx.font = "8px sans-serif";
        ui.ctx.fillText("PRIVACY", x, y - 2);
    });
}

// --- Utils ---

function requestSensors() {
    DeviceMotionEvent.requestPermission().then(r => {
        if (r == 'granted') { window.addEventListener('devicemotion', handleMotion); ui.sensorBtn.style.display = 'none'; }
    });
}

function handleUpload(e) {
    const file = e.target.files[0];
    if (file) {
        ui.video.srcObject = null;
        ui.video.src = URL.createObjectURL(file);
        ui.video.play();
    }
}

function triggerImpactProtocol() {
    if (!state.recording) {
        console.log("IMPACT START REC");
        toggleRecording();
        ui.summary.innerText = "⚠️ IMPACT RECORDING ACTIVE";
        ui.summary.style.backgroundColor = "red";
    }
}

async function triggerOCR() {
    ui.summary.innerText = "SCANNING TEXT...";
    const tmp = document.createElement('canvas');
    tmp.width = ui.video.videoWidth; tmp.height = ui.video.videoHeight;
    tmp.getContext('2d').drawImage(ui.video, 0, 0);
    try {
        const { data: { text } } = await Tesseract.recognize(tmp, 'eng');
        alert("OCR: " + text);
        ui.summary.innerText = "TEXT CAPTURED";
    } catch (e) { ui.summary.innerText = "OCR FAILED"; }
}

function toggleRecording() {
    if (state.recording) {
        mediaRecorder.stop();
        state.recording = false;
        ui.recBtn.classList.remove('recording');
    } else {
        recordedChunks = [];
        try { mediaRecorder = new MediaRecorder(stream || ui.video.captureStream()); }
        catch (e) { mediaRecorder = new MediaRecorder(ui.video.captureStream()); }
        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); }
        mediaRecorder.onstop = saveRec;
        mediaRecorder.start();
        state.recording = true;
        ui.recBtn.classList.add('recording');
    }
}

function saveRec() {
    const b = new Blob(recordedChunks, { type: 'video/webm' });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    document.body.appendChild(a); a.style = 'display:none'; a.href = u; a.download = 'evidence.webm'; a.click();
}

window.addEventListener('load', init);
