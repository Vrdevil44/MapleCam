// MapleCam PWA Logic - Phase 4.2: CACHE BUSTER EDITION

// --- Constants ---
const SCHOOL_ZONES = [{ name: "Demo Elem", lat: 0, lon: 0, radius: 0.002 }];
const SAFE_CLASSES = ['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'person', 'traffic light', 'stop sign'];
const IMPACT_THRESHOLD = 2.0;

// --- State ---
let state = {
    speed: 0,
    heading: 0,
    lat: 0,
    lon: 0,
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

// --- UI Cache ---
// We initialize this empty, then fill it in init()
let ui = {};

// --- Initialization ---
async function init() {
    console.log("MapleCam Phase 4.2 (New Version) Loaded - " + new Date().toLocaleTimeString());

    // Bind UI Elements safely inside Init
    const get = (id) => document.getElementById(id);
    ui = {
        video: get('webcam'),
        canvas: get('overlay'),
        ctx: null,
        summary: get('fusion-summary'),
        speed: get('speed-display'),
        gForce: get('g-display'),
        gps: get('gps-status'),
        ai: get('ai-status'),
        coords: get('coords'),
        heading: get('heading'),
        recBtn: get('record-btn'),
        upload: get('video-upload'),
        sensorBtn: get('sensor-btn')
    };

    if (ui.canvas) ui.ctx = ui.canvas.getContext('2d');

    try {
        await loadAI();
        await startCamera();
        startSensors();

        // Listeners
        if (ui.upload) ui.upload.addEventListener('change', handleUpload);
        if (ui.video) ui.video.addEventListener('loadeddata', () => requestAnimationFrame(loop));

        // Sensor Fusion Loop
        setInterval(sensorFusion, 200);

    } catch (e) { console.error("Init Failed", e); }
}

async function loadAI() {
    if (ui.ai) ui.ai.innerText = "LOAD";
    try {
        models.obj = await cocoSsd.load();
        models.face = await blazeface.load();
        if (ui.ai) ui.ai.innerText = "ACTIVE";
    } catch (e) { if (ui.ai) ui.ai.innerText = "ERR"; }
}

async function startCamera() {
    const constraints = { video: { facingMode: "environment", width: { ideal: 1280 } } };
    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (ui.video) {
            ui.video.srcObject = stream;
            ui.video.removeAttribute('src');
        }
    } catch (e) { console.warn("Cam Init Err", e); }
}

// --- Sensor Core ---

function startSensors() {
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(
            p => {
                const c = p.coords;
                state.speed = (c.speed || 0) * 3.6;
                state.heading = c.heading || 0;
                state.lat = c.latitude;
                state.lon = c.longitude;
                state.gpsFix = true;

                checkZone(c.latitude, c.longitude);

                // Update GPS UI immediately
                if (ui.gps) ui.gps.innerText = "FIX";
                if (ui.coords) ui.coords.innerText = `${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`;
                if (ui.heading) ui.heading.innerText = `${Math.round(state.heading || 0)}°`;
            },
            () => {
                state.gpsFix = false;
                if (ui.gps) ui.gps.innerText = "LOST";
            },
            { enableHighAccuracy: true }
        );
    }

    if (window.DeviceMotionEvent) {
        if (typeof DeviceMotionEvent.requestPermission === 'function' && ui.sensorBtn) ui.sensorBtn.style.display = 'inline-block';
        else window.addEventListener('devicemotion', handleMotion);
    }
}

function handleMotion(e) {
    const acc = e.accelerationIncludingGravity;
    if (acc) {
        // Simple G Calculation
        const total = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2) / 9.8;
        state.gForce = total;

        if (total > IMPACT_THRESHOLD && !state.impactDetected) {
            state.impactDetected = true;
            triggerImpactProtocol();
            setTimeout(() => state.impactDetected = false, 5000);
        }
    }
}

function checkZone(lat, lon) {
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
    // CRITICAL FIX: Ensure summary element exists before touching it
    if (!ui.summary) return;

    const s = state;
    let msg = "SYSTEM READY";
    let color = "#3498db";

    if (ui.speed) ui.speed.innerText = Math.round(s.speed);
    if (ui.gForce) ui.gForce.innerText = s.gForce.toFixed(2);

    // Context Logic
    if (s.gForce > 1.8) {
        msg = "⚠️ HARD BRAKING";
        color = "#e74c3c";
    }
    else if (s.zone && s.speed > 30) {
        msg = `⚠️ SPEEDING IN ${s.zone}`;
        color = "#e74c3c";
    }
    else if (s.zone) {
        msg = `SCHOOL ZONE: ${s.zone}`;
        color = "#f1c40f";
    }
    else if (s.speed < 3 && s.gpsFix) {
        msg = "STATIONARY - MONITORING";
        color = "#95a5a6";
    }
    else if (s.speed > 80) {
        msg = "HIGHWAY CRUISE";
    }
    else if (s.detections.length > 0) {
        const nearest = s.detections.sort((a, b) => b.bbox[2] * b.bbox[3] - a.bbox[2] * a.bbox[3])[0];
        if (nearest) {
            msg = `TRACKING: ${nearest.class.toUpperCase()}`;
        }
    }
    else if (!s.gpsFix) {
        msg = "ACQUIRING GPS...";
        color = "#e67e22";
    }
    else {
        msg = "CRUISING - ALL CLEAR";
    }

    if (ui.summary) {
        ui.summary.innerText = msg;
        ui.summary.style.border = `1px solid ${color}`;
        ui.summary.style.color = color == "#3498db" ? "white" : color;
    }
}

// --- Tesla Vision Rendering ---

async function loop() {
    if (ui.video && ui.video.paused) return requestAnimationFrame(loop);
    if (!ui.canvas || !ui.ctx) return requestAnimationFrame(loop);

    if (ui.canvas.width !== ui.video.videoWidth) {
        ui.canvas.width = ui.video.videoWidth;
        ui.canvas.height = ui.video.videoHeight;
    }

    ui.ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);

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
    if (!ui.ctx) return;
    const ctx = ui.ctx;
    const w = ui.canvas.width;
    const h = ui.canvas.height;

    // Path Lines
    ctx.beginPath();
    ctx.strokeStyle = "rgba(52, 152, 219, 0.3)";
    ctx.lineWidth = 2;
    ctx.moveTo(w * 0.2, h); ctx.lineTo(w * 0.45, h * 0.55);
    ctx.moveTo(w * 0.8, h); ctx.lineTo(w * 0.55, h * 0.55);
    ctx.stroke();

    objects.forEach(obj => {
        const [x, y, width, height] = obj.bbox;
        const score = Math.round(obj.score * 100);

        // Tesla Style
        ctx.fillStyle = "rgba(52, 152, 219, 0.1)";
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = "#3498db";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = "#3498db";
        ctx.fillRect(x, y - 18, width, 18);
        ctx.fillStyle = "black";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(`${obj.class.toUpperCase()} ${score}%`, x + 4, y - 5);

        ctx.beginPath();
        ctx.moveTo(w / 2, h);
        ctx.lineTo(x + width / 2, y + height);
        ctx.strokeStyle = "rgba(52, 152, 219, 0.2)";
        ctx.stroke();
    });
}

function drawPrivacyMasks(faces) {
    if (!ui.ctx) return;
    faces.forEach(face => {
        const [x, y] = face.topLeft;
        const [x2, y2] = face.bottomRight;
        ui.ctx.fillStyle = "rgba(0,0,0,0.95)";
        ui.ctx.fillRect(x, y, x2 - x, y2 - y);
        ui.ctx.fillStyle = "white";
        ui.ctx.font = "8px sans-serif";
        ui.ctx.fillText("PRIVACY", x, y - 2);
    });
}

// --- Utils ---

function requestSensors() {
    DeviceMotionEvent.requestPermission().then(r => {
        if (r == 'granted') { window.addEventListener('devicemotion', handleMotion); if (ui.sensorBtn) ui.sensorBtn.style.display = 'none'; }
    });
}

function handleUpload(e) {
    const file = e.target.files[0];
    if (file && ui.video) {
        ui.video.srcObject = null;
        ui.video.src = URL.createObjectURL(file);
        ui.video.play();
    }
}

function triggerImpactProtocol() {
    if (!state.recording) {
        toggleRecording();
        if (ui.summary) {
            ui.summary.innerText = "⚠️ IMPACT RECORDING ACTIVE";
            ui.summary.style.backgroundColor = "red";
        }
    }
}

async function triggerOCR() {
    if (ui.summary) ui.summary.innerText = "SCANNING TEXT...";
    const tmp = document.createElement('canvas');
    tmp.width = ui.video.videoWidth; tmp.height = ui.video.videoHeight;
    tmp.getContext('2d').drawImage(ui.video, 0, 0);
    try {
        const { data: { text } } = await Tesseract.recognize(tmp, 'eng');
        alert("OCR: " + text);
        if (ui.summary) ui.summary.innerText = "TEXT CAPTURED";
    } catch (e) { if (ui.summary) ui.summary.innerText = "OCR FAILED"; }
}

function toggleRecording() {
    if (state.recording) {
        if (mediaRecorder) mediaRecorder.stop();
        state.recording = false;
        if (ui.recBtn) ui.recBtn.classList.remove('recording');
    } else {
        recordedChunks = [];
        try { mediaRecorder = new MediaRecorder(stream || ui.video.captureStream()); }
        catch (e) { mediaRecorder = new MediaRecorder(ui.video.captureStream()); }
        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); }
        mediaRecorder.onstop = saveRec;
        mediaRecorder.start();
        state.recording = true;
        if (ui.recBtn) ui.recBtn.classList.add('recording');
    }
}

function saveRec() {
    const b = new Blob(recordedChunks, { type: 'video/webm' });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    document.body.appendChild(a); a.style = 'display:none'; a.href = u; a.download = 'evidence.webm'; a.click();
}

if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', init);
}
