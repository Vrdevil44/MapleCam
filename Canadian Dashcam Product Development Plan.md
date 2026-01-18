# **MapleCam Sentinel: Comprehensive Product Development and Strategic Implementation Plan for the British Columbia Automotive Market**

## **Executive Summary**

The automotive technology sector stands at a critical juncture where generic global solutions are increasingly insufficient for meeting the nuanced regulatory, environmental, and evidentiary requirements of specific regional markets. This report presents a detailed product development roadmap for **MapleCam Sentinel**, a bespoke Artificial Intelligence (AI) dashcam engineered specifically for the province of British Columbia (BC), Canada. Unlike standard market offerings that function primarily as passive recording devices, MapleCam Sentinel is conceptualized as an intelligent, active driving assistant and legal compliance tool. Its architecture is rigorously aligned with the British Columbia Motor Vehicle Act (MVA), the Personal Information Protection and Electronic Documents Act (PIPEDA), and the evidentiary standards of the Insurance Corporation of British Columbia (ICBC).

The central value proposition of MapleCam Sentinel lies in its ability to bridge the gap between raw data capture and actionable, legally admissible evidence. By leveraging the computational power of the **Raspberry Pi 5** and the edge-inference capabilities of the **Hailo-8L AI accelerator**, the device moves beyond simple video storage to perform real-time environmental analysis. This allows for features such as winter-optimized lane detection—crucial for BC's severe mountain highway conditions—and automated redaction of personally identifiable information (PII) to satisfy federal privacy mandates. Furthermore, the system integrates geospatial data from DataBC to provide context-aware alerts for school zones, directly addressing provincial safety priorities.

This document serves as a master plan for engineering, legal compliance, software architecture, and manufacturing. It details the selection of specific hardware components like the **Sony IMX296 Global Shutter** sensor to eliminate motion artifacts, the implementation of a **Geekworm X1202 UPS** for robust automotive power management, and the deployment of a **Flask-based captive portal** for secure, screen-free interaction. Through this exhaustive analysis, we demonstrate that MapleCam Sentinel is not merely a consumer gadget, but a necessary evolution in automotive safety technology for the Canadian market.

## ---

**1\. Regulatory Framework and Market Constraints**

The development of surveillance and safety devices for the British Columbia market requires a sophisticated understanding of the intersection between traffic safety laws, privacy legislation, and insurance procedures. The design philosophy of MapleCam Sentinel is "Compliance by Default," ensuring that the mere operation of the device helps, rather than hinders, the user's legal standing.

### **1.1 British Columbia Motor Vehicle Act (MVA) Compliance**

The most immediate constraint on automotive technology in BC is the strict regulation regarding "Distracted Driving" under the Motor Vehicle Act. Designing a user interface (UI) that adheres to these laws is not an option but a requirement for market entry.

#### **1.1.1 The "Voice-Activated" Mandate**

Section 214.2 of the MVA and its associated regulations create a binary distinction for electronic devices: they must be either securely mounted and "one-touch" operated, or entirely voice-activated.1 The legislation explicitly prohibits holding, operating, or watching the screen of an electronic device unless specific exemptions are met.

* **Regulatory Nuance:** The law permits the use of hands-free devices only if they operate via voice command or require a single touch to initiate or end a function. This effectively bans complex touch-screen interactions such as scrolling through video files or typing in navigation data while the vehicle is in motion.2  
* **Design Implication:** MapleCam Sentinel eliminates the traditional LCD touchscreen found on most dashcams. Instead, the primary interface is auditory. A high-fidelity microphone array and an offline Natural Language Processing (NLP) engine allow drivers to issue commands ("Save Evidence," "Report Hazard") without removing their hands from the wheel. This design decision directly indemnifies the user against the $368 fine and four penalty points associated with distracted driving offenses.4

#### **1.1.2 Visual Display Restrictions**

The MVA further prohibits operating a motor vehicle if the screen of a computer or other device is visible to the driver, unless that screen displays information solely related to the vehicle's operation, navigation, or safety systems.1 Video playback is strictly forbidden while driving.

* **Operational Protocol:** To ensure compliance, MapleCam Sentinel implements a "Black Screen" protocol. If the device is connected to a vehicle display (e.g., via HDMI or a small status screen), the video feed is disabled the moment the GPS detects movement (\>5 km/h). The screen reverts to a minimalist status dashboard showing only lawful information: recording status, GPS lock verification, and safety alerts (e.g., "School Zone Active"). This ensures that even if a police officer peers into the vehicle, the device is visibly compliant with the "safety systems" exemption of the MVA.5

### **1.2 Privacy Compliance (PIPEDA)**

As a product intended for potential use by commercial fleets and businesses (e.g., delivery drivers, trucking logistics), MapleCam Sentinel falls under the jurisdiction of the federal Personal Information Protection and Electronic Documents Act (PIPEDA).

#### **1.2.1 The Trimac Transportation Precedent**

The Office of the Privacy Commissioner of Canada (OPC) provided critical guidance in its findings regarding *Trimac Transportation Services Inc.* (PIPEDA Findings \#2022-006). The OPC ruled that continuous audio recording in a workplace (such as a truck cabin) is highly invasive and often lacks proportionality. While video recording for safety purposes is generally accepted, the constant monitoring of driver conversations was deemed excessive.6

* **Architectural Response:** MapleCam Sentinel adopts a "Privacy First" audio policy. By default, internal cabin audio recording is **disabled**. Audio data is buffered in Random Access Memory (RAM) but is never committed to non-volatile storage unless a specific "Trigger Event" occurs. These triggers are limited to:  
  1. **G-Force Impact:** Detection of a collision.  
  2. **Voice Command:** The driver explicitly saying "Save Audio" or "Record Statement."  
  3. Panic Button: Activation of the physical emergency button.  
     This architecture directly aligns with the Trimac recommendation to limit audio collection to necessary and specific instances, protecting the driver's reasonable expectation of privacy while maintaining the utility of the device for evidence gathering.6

#### **1.2.2 Public Space Surveillance and Anonymization**

Recording in public spaces involves balancing the safety benefits of a dashcam against the privacy rights of pedestrians and other drivers. Although consent is often implied for photography in public, the aggregation of high-resolution facial data raises concerns under PIPEDA's "Appropriate Purposes" test.8

* **Automated Redaction:** To mitigate privacy loss, MapleCam Sentinel incorporates a lightweight AI model specifically for face and license plate detection. The system offers two recording modes:  
  * **Evidence Mode (Encrypted):** Saves raw footage, accessible only via a secure key. This is for court and insurance purposes where identifying details are necessary.  
  * **Public Mode (Redacted):** Applies a Gaussian blur to detected faces and license plates in real-time. This allows users to share footage on social media or community safety platforms without violating the privacy of bystanders.9

### **1.3 ICBC Evidence Standards**

The Insurance Corporation of British Columbia (ICBC) operates as the sole provider of basic auto insurance in the province. Aligning the product with ICBC's claims process creates a massive competitive advantage and user convenience.

#### **1.3.1 Admissibility and Formatting**

ICBC encourages the submission of digital evidence to determine fault, particularly in "he said, she said" scenarios. However, the submission portal has specific technical constraints: it accepts standard formats (mp4, mov, avi) and has a file size limit of 2GB per upload.10

* **Automated Packaging:** MapleCam Sentinel features an "ICBC Export" function. Upon user request, the system automatically segments the relevant footage (e.g., 2 minutes before and 1 minute after an incident) into a compliant .mp4 file. It ensures the file size remains well under the 2GB limit by optimizing the bitrate if necessary, preventing the frustration of rejected uploads during the stressful claims process.10

#### **1.3.2 Chain of Custody and Authentication**

For digital evidence to be given full weight in court or arbitration, its integrity must be guaranteed. The legal concept of "Chain of Custody" requires proof that the evidence has not been altered or tampered with from the moment of capture.12

* **Cryptographic Verification:** The device implements immediate hashing. As soon as a video file is closed, the system generates a SHA-256 hash of the file content. This hash, along with the GPS coordinates and timestamp, is written to a separate metadata log which is digitally signed by the device's unique private key. This creates a tamper-evident seal. If a user attempts to edit the video (e.g., to hide their own speed), the hash will no longer match the signed log, invalidating the file. This feature provides the "rigorous scrutiny of reliability" required by Canadian courts for electronic documents.14

## ---

**2\. Hardware Architecture and Engineering**

The hardware platform for MapleCam Sentinel must be robust enough to handle simultaneous AI processing, high-definition video encoding, and the rigorous environmental extremes of the Canadian climate. The selection of components prioritizes reliability, open-source compatibility, and performance per watt.

### **2.1 Core Compute Module: Raspberry Pi 5**

The **Raspberry Pi 5 (8GB RAM Model)** is selected as the central processing unit (CPU).

* **Performance Justification:** The Pi 5 features a Broadcom BCM2712 quad-core Arm Cortex-A76 processor running at 2.4GHz. This represents a 2-3x performance increase over the previous generation, which is critical for handling the throughput of high-resolution global shutter video while simultaneously managing AI inference threads. The 8GB of LPDDR4X SDRAM is essential to maintain a large ring buffer for video pre-recording (the "look-back" cache) without needing to write to the SD card constantly, which would degrade flash storage.15  
* **Interface Capabilities:** Crucially, the Pi 5 introduces a PCIe 2.0 x1 interface. This high-bandwidth lane allows for the integration of dedicated AI accelerators or high-speed NVMe storage, removing the USB bottleneck that plagued previous iterations.17

### **2.2 AI Acceleration: Hailo-8L**

To achieve real-time inference without thermally throttling the CPU, the **Hailo-8L AI Accelerator** is integrated via the Raspberry Pi AI Kit.

* **Neural Processing Power:** The Hailo-8L provides 13 Tera-Operations Per Second (TOPS) of int8 performance. While less than the 26 TOPS of the full Hailo-8, the 8L is perfectly dimensioned for the specific tasks of lane segmentation and object detection at 30 frames per second (FPS). It utilizes a dataflow architecture that is significantly more power-efficient than GPU-based solutions like the Jetson Nano, a critical factor for a device running off a car battery.18  
* **Thermal Efficiency:** By offloading the heavy matrix multiplication operations to the Neural Processing Unit (NPU), the Pi 5's CPU is left free to handle video encoding and system logic. This distributed thermal load prevents the "hotspot" issues common in all-in-one SoCs, allowing the device to operate reliably in a dashboard environment.20

### **2.3 Camera Sensors: Global Shutter Technology**

Standard commercial dashcams almost universally use "rolling shutter" sensors. While cheaper, these sensors expose the image line-by-line, causing significant distortion (the "jelly effect") when recording fast-moving objects or during the high-frequency vibrations of driving. For evidentiary quality, **Global Shutter** technology is a non-negotiable requirement.

* **Primary Sensor:** **Raspberry Pi Global Shutter Camera (Sony IMX296)**.  
  * **Motion Fidelity:** The Global Shutter exposes every pixel simultaneously. This ensures that a freeze-frame of a speeding vehicle shows a crisp, readable license plate rather than a blurred or slanted smear. This fidelity is paramount for proving liability in high-speed highway accidents.22  
  * **Low-Light Sensitivity:** The IMX296 has a relatively low resolution of 1.6 Megapixels (1456x1088). However, this is a strategic advantage. The large pixel size (3.45μm × 3.45μm) allows for vastly superior photon collection compared to high-megapixel sensors with tiny pixels. This results in far better performance in the dark, rainy conditions typical of BC winters, where identifying details is often impossible with standard 4K dashcams.23  
  * **Optics:** The sensor is paired with a wide-angle (approx. 130-160° FOV) C-Mount lens to ensure full coverage of the hood and adjacent lanes, capturing peripheral events like pedestrians entering a crosswalk.23

### **2.4 Power Management and UPS (Uninterruptible Power Supply)**

Automotive electrical systems are hostile environments for precision electronics. Voltage sags during engine cranking (cold cranking) and inductive spikes from the alternator can corrupt file systems or damage hardware. Furthermore, the abrupt loss of power when the ignition is turned off guarantees the loss of the most critical video file—the one recording the seconds leading up to the shutdown.

* **Selected Solution:** **Geekworm X1202 UPS HAT**.  
  * **Wide Voltage Input:** The X1202 supports a DC input range of 6-18V, allowing it to be hardwired directly to the vehicle's fuse box without complex external regulators. It filters the noisy automotive power into a clean 5.1V 5A supply for the Pi.25  
  * **Ignition Logic & Safe Shutdown:** The HAT features sophisticated power management logic (PLD \- Power Loss Detection). It monitors the vehicle's ignition line (ACC). When the ignition is turned off, the UPS maintains power to the Pi via its onboard 18650 Li-Ion batteries and sends a signal via GPIO to the software daemon. The Pi then performs a graceful shutdown—closing databases, flushing video buffers to disk, and syncing logs—before the UPS cuts the power. This completely eliminates SD card corruption.27  
  * **Battery Safety:** Standard Li-Ion batteries degrade in extreme heat. The X1202 design accommodates 18650 cells. We specify the use of industrial-grade cells with extended temperature ranges or advise users to remove the unit during extreme summer heatwaves to prevent thermal runaway.26

### **2.5 Storage Strategy**

* **Primary Loop Recording:** **Samsung PRO Endurance microSD (128GB)**.  
  * **Endurance Matters:** Standard consumer SD cards use Triple-Level Cell (TLC) or Quad-Level Cell (QLC) NAND, which wears out quickly under the constant write pressure of loop recording. The PRO Endurance series uses enterprise-grade NAND rated for up to 43,800 hours of continuous recording. 128GB provides a buffer of approximately 12-14 hours of 1080p footage before overwriting occurs, sufficient for multiple days of driving.30  
* **Pro Tier Option:** The Pi 5's PCIe interface theoretically supports NVMe SSDs. However, the Hailo-8L AI Kit already occupies the M.2 slot. While PCIe bifurcation (splitting the lane) is technically possible, it adds significant complexity and cost. Therefore, the high-endurance microSD remains the primary storage medium for the base model, offering a balance of reliability and cost-effectiveness.33

### **2.6 Thermal Management and Enclosure**

BC's climate varies wildly, from \-30°C in the northern interior to \+40°C in the interior summers. A device mounted on a dashboard behind a windshield is subject to the "greenhouse effect," where temperatures can easily exceed 60-70°C.

* **Active Cooling:** Passive cooling is insufficient for the Pi 5 when the NPU is active. The **Raspberry Pi Active Cooler** is mandatory. This combines an aluminum heatsink with a temperature-controlled PWM fan. The fan remains off or low-speed during normal operation but ramps up if the CPU core temperature approaches 60°C, ensuring the device never throttles during critical recording.34  
* **Enclosure Design:** The device is housed in a custom CNC-machined aluminum enclosure. This case acts as a secondary thermal mass, dissipating heat from the internal components. The design includes a Gore-Tex breather vent to allow pressure equalization (preventing seal failure) while blocking moisture ingress—critical for preventing lens fogging in BC's humid coastal environment.36  
* **Cold Start Logic:** In extreme cold (-20°C), electronics can fail to boot. The system firmware includes a "Pre-Heat" routine. Upon detecting low temperature via the onboard sensors, the CPU runs a dummy computational load to generate waste heat, warming the board and the battery to a safe operating temperature before initializing the camera pipeline.38

## ---

**3\. Software Architecture**

The software stack is built on a robust Linux foundation, utilizing a microservices architecture. This ensures that the mission-critical recording function is isolated from the AI and UI layers—if the AI crashes, the camera must keep recording.

### **3.1 Operating System and Drivers**

* **OS:** Raspberry Pi OS Lite (64-bit). Using a "headless" (no desktop environment) OS minimizes overhead, dedicating maximum resources to the video pipeline and AI.  
* **Drivers:** The system utilizes the custom **HailoRT** PCIe driver and firmware for the AI accelerator.39 Specific kernel device tree overlays are enabled for the Sony IMX296 to unlock its global shutter features and external trigger capabilities.

### **3.2 The Multimedia Pipeline (GStreamer)**

GStreamer is the industry standard for handling complex multimedia flows. It allows for a modular pipeline where video buffers are passed between elements without expensive memory copying.

Pipeline Construction:  
The pipeline is designed with a "Tee" structure, splitting the single camera source into three distinct parallel streams:

1. **Source:** libcamerasrc captures raw video frames from the IMX296 sensor.  
2. **Branch A (Evidence Recording):**  
   * This is the highest priority thread.  
   * v4l2h264enc: Hardware-accelerated H.264 encoding on the Pi's GPU.  
   * splitmuxsink: Saves video to a ring buffer in RAM. Every 60 seconds (or upon trigger), the buffer is flushed to the SD card as a timestamped .mp4 file. This ensures that SD card wear is minimized and write latency does not drop frames.  
3. **Branch B (AI Inference):**  
   * videoscale: Downscales the high-res frame to 640x640 resolution required by the YOLO model.  
   * videoconvert: Converts the color space to RGB.  
   * hailonet: Passes the buffer to the Hailo-8L for inference. The inference results (metadata) are attached to the buffer for downstream processing.40  
4. **Branch C (Preview/Web):**  
   * Encodes a low-resolution, low-framerate MJPEG stream.  
   * This stream is piped to a local socket, where the Flask web application picks it up to display a live view on the user's smartphone.42

**Conceptual Pipeline Code:**

Python

\# GStreamer Pipeline Definition  
pipeline\_str \= """  
    libcamerasrc\! video/x-raw,format=NV12,width=1456,height=1088\! tee name=t  
    \# Branch A: Evidence Recording  
    t.\! queue\! v4l2h264enc bitrate=15000000\! h264parse\! splitmuxsink location=/mnt/storage/video\_%04d.mp4 max-size-time=60000000000  
    \# Branch B: AI Inference  
    t.\! queue leaky=2\! videoscale\! video/x-raw,width=640,height=640\! videoconvert\! hailonet hef-path=yolov8\_winter.hef\! hailofilter\! fakesink  
    \# Branch C: Live Preview  
    t.\! queue leaky=2\! videoscale\! video/x-raw,width=640,height=480\! jpegenc\! appsink name=flask\_sink  
"""

Note: The use of hailomuxer and separate queue elements ensures that heavy AI processing does not block the recording thread. If the AI lags, frames are dropped from the inference branch only, preserving the integrity of the evidence recording.41

### **3.3 Application Layer: Flask Captive Portal**

Since the device has no screen, user interaction is managed via a smartphone connection. MapleCam functions as a Wi-Fi Hotspot.

* **Connectivity:** The Pi's Wi-Fi chip hosts a secure Access Point (SSID: MapleCam\_Secure).  
* **Captive Portal:** Using dnsmasq and flask, the system intercepts all HTTP requests. When a user connects their phone, they are automatically redirected to http://maple.cam (the device's local IP). This mimics the login experience of hotel Wi-Fi, making connection seamless.42  
* **Web App Functionality:**  
  * **Live View:** Displays the MJPEG stream from the GStreamer pipeline.  
  * **Evidence Locker:** A file browser interface allowing users to view, download, and delete hashed MP4 files.  
  * **ICBC Wizard:** A guided flow where the user selects a specific video clip. The system then prompts for witness details and generates a comprehensive ZIP package containing the video, a metadata.json file (GPS, Speed, Hash), and a formatted PDF witness report.44

## ---

**4\. Artificial Intelligence Development Plan**

The "brain" of MapleCam Sentinel is what distinguishes it from a generic action camera. The AI strategy focuses on two critical areas where standard dashcams fail: winter road perception and privacy protection.

### **4.1 Winter-Optimized Road Detection**

Standard Lane Departure Warning Systems (LDWS) rely on detecting high-contrast white or yellow lines. In a BC winter, these lines are often obscured by snow, slush, or salt, rendering standard AI useless.

* **Dataset Curation:** To overcome this, we train our models on the **SnowyLane** and **Boreas** datasets. These datasets are specifically collected in adverse winter conditions (Canada/Germany) and contain annotated frames of snow-covered roads. They include labels not just for lane lines, but for road edges defined by snowbanks, tire tracks in fresh snow, and vertical delineator posts.45  
* **Model Architecture:** We utilize a **YOLOv8-Seg** (Segmentation) model rather than a simple bounding box detector. Semantic segmentation classifies every pixel in the image as "Drivable Road," "Snow," "Lane Marking," or "Obstacle." This allows the system to infer the lane geometry even when lines are invisible, by following the "negative space" between snowbanks or the ruts left by previous vehicles.48  
* **Training Pipeline:**  
  1. **Transfer Learning:** Start with a YOLOv8 model pre-trained on the massive COCO dataset for general feature extraction.  
  2. **Fine-Tuning:** Train the segmentation head on the SnowyLane dataset.  
  3. **Augmentation:** Apply specific winter augmentations during training: simulated fog, lower contrast (whiteout), and "salt noise" on the lens.  
  4. **Compilation:** The trained model is compiled to the Hailo Executable Format (HEF) using the Hailo Dataflow Compiler (DFC), optimizing the neural network weights for the specific architecture of the Hailo-8L NPU.49

### **4.2 School Zone & Hazard Awareness**

BC enforces strict 30km/h speed limits in school zones on school days (8 AM \- 5 PM). Missing a sign in bad weather is a common cause of tickets.

* **Geospatial Logic:**  
  * **Data Source:** We utilize the **DataBC** open data portal, which provides accurate geospatial coordinates (latitude/longitude) for every public school in the province.50  
  * **Geofencing Engine:** Using Python's Shapely and GeoPandas libraries, we create a static database of polygonal buffers (approx. 300m radius) around these coordinates.  
  * **Runtime Check:** A lightweight background thread constantly compares the vehicle's live GPS position against this spatial index.  
  * **Temporal Filter:** If the vehicle enters a polygon, the system checks the current time and date. It cross-references against a calendar of BC statutory holidays. Only if Inside(Zone) AND Time(0800-1700) AND Is\_School\_Day is true does the system trigger the alert.52  
* **Alert:** The driver receives a spoken warning: *"Entering School Zone. Speed Limit 30."*

### **4.3 Offline Voice Control**

To comply with the MVA "voice-activated" requirement and ensure privacy, all voice processing is performed locally on the device.

* **Wake Word Engine:** We employ **Porcupine** (by Picovoice) for wake-word detection. It is highly optimized for embedded systems, offering high accuracy detection of the phrase "Hey MapleCam" with negligible CPU usage.54  
* **Command Recognition:** Once the wake word is detected, the audio stream is passed to **Vosk**, an offline, open-source speech recognition toolkit. Vosk models are compact (\~50MB) and do not require an internet connection. This is vital for BC highways like the Coquihalla or Highway 16, where cellular service is intermittent or non-existent.56  
* **Commands:**  
  * *"Hey MapleCam, Save That"* \-\> Locks the current video loop to the read-only "Incident" folder.  
  * *"Hey MapleCam, Screen Off"* \-\> Disables all status LEDs for distraction-free night driving.  
  * *"Hey MapleCam, Report"* \-\> Initiates a 60-second audio recording for the driver to dictate a witness statement immediately after an event.

### **4.4 Multi-Model Scheduling**

Running Lane Detection (YOLO), Face Anonymization, and Voice Recognition simultaneously requires careful resource management.

* **Scheduler:** The **HailoRT** scheduler is configured to manage multi-network inference. We prioritize safety-critical models (Lane Detection) over privacy models (Face Blur). The scheduler time-slices the NPU resources, ensuring the lane detection maintains a steady frame rate. Voice recognition (Vosk) is routed to run on the Pi's Cortex-A76 CPU, leaving the Hailo NPU dedicated entirely to computer vision tasks.58

## ---

**5\. Detailed Product Features & Implementation**

### **5.1 The "ICBC Evidence Package" Feature**

This feature is the primary market differentiator, turning the device into a comprehensive accident management tool.

* **The Problem:** Post-accident, drivers are often in shock. They forget to record witness names, take photos of the scene, or note the exact time.  
* **The Solution:**  
  1. **Trigger:** An impact detected by the G-Sensor OR the voice command "Save Incident".  
  2. **Immediate Action:** The system locks the previous 2 minutes and next 1 minute of video to a separate, read-only partition on the SD card to prevent overwriting.  
  3. **Audio Guidance:** The device prompts the driver via the speaker: *"Incident recorded. Please dictate the date, time, and location if safe."* It then records the driver's verbal notes.  
  4. **Witness Collection:** A follow-up prompt asks: *"Read out any license plates or witness phone numbers now."* This captures crucial data that might otherwise be lost.  
  5. **Digital Export:** When the user connects via the app later, they are presented with a "Submit Claim" workflow. This aggregates the video clips, the audio notes (transcribed to text via Vosk if possible), and the GPS data into a standardized digital package formatted specifically for the ICBC upload portal.12

### **5.2 Privacy Mode (Face Redaction)**

* **Mechanism:** A secondary neural network, **YOLOv8-Face**, runs in parallel on the video stream.  
* **Implementation:**  
  * The model detects bounding boxes for classes Face and License\_Plate.  
  * For the "Public/Shareable" video stream, a Gaussian Blur filter is applied to these coordinate regions *before* the video is encoded.  
  * **Dual-Stream Option:** The system can be configured to record two streams: one "Raw" (encrypted) for legal evidence, and one "Redacted" for public sharing. This satisfies the need for evidence (Raw) while respecting the privacy of individuals in shared footage (Redacted), aligning with the OPC's recommendations for public surveillance.8

### **5.3 Winter Resilience Features**

* **Condensation Management:** To prevent the lens from fogging up during rapid temperature changes (e.g., a cold car heating up), the enclosure includes a Gore-Tex membrane vent. This allows air pressure to equalize while blocking liquid moisture.  
* **Low-Light Tuning:** The camera's libcamera tuning file is customized for high-contrast night scenarios. The auto-exposure algorithm is weighted to prioritize faster shutter speeds over brightness. This results in a darker overall image, but one where illuminated objects (like license plates) are not washed out by motion blur, ensuring readability.24

## ---

**6\. Manufacturing and Cost Analysis (BOM)**

The following Bill of Materials (BOM) estimates the component cost for low-volume production.

| Component | Description | Estimated Cost (CAD) | Source Ref |
| :---- | :---- | :---- | :---- |
| **Compute** | Raspberry Pi 5 (8GB) | $110.00 | 17 |
| **AI Module** | Raspberry Pi AI Kit (Hailo-8L) | $95.00 | 61 |
| **Camera** | Raspberry Pi Global Shutter Cam | $75.00 | 62 |
| **Power** | Geekworm X1202 UPS HAT \+ Cells | $65.00 | 63 |
| **Storage** | Samsung PRO Endurance 128GB | $40.00 | 64 |
| **Cooling** | Active Cooler | $8.00 | 65 |
| **Lens** | Wide Angle C-Mount Lens | $25.00 | 23 |
| **GPS** | USB GPS Module (u-blox) | $20.00 | N/A |
| **Enclosure** | Custom Aluminum Case (CNC) | $35.00 | 37 |
| **Misc** | Cables, Screws, Packaging | $15.00 | N/A |
| **Total BOM** |  | **\~$488.00 CAD** |  |

*Strategic Note:* While a BOM of \~$488 is high for a consumer dashcam, MapleCam Sentinel is positioned as a prosumer/commercial device. The target retail price of approximately $699 CAD places it in competition with high-end units from brands like BlackVue or Thinkware. However, its unique value proposition—open programmability, superior AI winter performance, and direct ICBC integration—justifies the premium for BC drivers. Volume manufacturing (1000+ units) could reduce component costs by 20-30%, improving margins.

## ---

**7\. Development Roadmap**

### **Phase 1: Prototyping and Validation (Months 1-3)**

* **Objective:** Validate hardware integration and thermal performance.  
* **Actions:**  
  * Assemble the Pi 5, Hailo Kit, and Global Shutter camera stack.  
  * Develop the initial GStreamer pipeline for recording and inference.  
  * Conduct rigorous thermal testing: running stress-ng and AI inference simultaneously inside a thermal chamber at 60°C to validate the cooling solution.

### **Phase 2: AI Training and Software Core (Months 4-6)**

* **Objective:** Develop the "Brain" of the device.  
* **Actions:**  
  * Aggregate SnowyLane and Boreas datasets. Train the YOLOv11n segmentation model on a GPU workstation.  
  * Compile the model to HEF and optimize for the Hailo-8L (Target: Stable \>30 FPS).  
  * Implement the Voice Control stack (Vosk/Porcupine) and tune microphone sensitivity for cabin noise.  
  * Build the Geospatial engine for School Zone alerts.

### **Phase 3: Field Testing and UX Refinement (Months 7-9)**

* **Objective:** Real-world validation in BC conditions.  
* **Actions:**  
  * Deploy beta units to test drivers in the BC Interior (e.g., Coquihalla Highway) during winter months.  
  * Monitor for cold-start failures, condensation issues, and battery performance.  
  * Refine the "Black Screen" logic to ensure it meets the specific "non-distracting" requirements of local law enforcement.

### **Phase 4: Certification and Launch (Month 10\)**

* **Objective:** Market Entry.  
* **Actions:**  
  * Complete IC/FCC emissions testing.  
  * Engage with a privacy lawyer to finalize the "Privacy Mode" terms of service.  
  * Launch marketing campaigns targeting driving schools, insurance brokers, and fleet managers, highlighting the "ICBC Evidence" feature as the key selling point.

## ---

**8\. Conclusion**

**MapleCam Sentinel** represents a paradigm shift in the dashcam market. It moves beyond the concept of a passive recording device to become an active, intelligent, and legally compliant driving assistant tailored to the unique challenges of British Columbia. By integrating the **Hailo-8L**'s edge AI capabilities with the versatile **Raspberry Pi 5** platform, the device delivers features that generic global competitors cannot match: real-time winter road analysis, automated privacy redaction, and seamless ICBC evidence packaging.

While the engineering challenges—particularly regarding power management and thermal regulation in an automotive environment—are significant, the proposed architecture offers robust solutions to each. The Geekworm UPS, the Active Cooler, and the Global Shutter sensor combine to form a hardware platform that is as reliable as it is intelligent. For the professional driver, the fleet operator, or the safety-conscious commuter in BC, MapleCam Sentinel offers an invaluable service: an intelligent, unblinking witness that understands the road, the weather, and the law.

The recommended path forward is to proceed immediately with Phase 1 prototyping, specifically targeting the thermal and winter-detection proofs of concept to validate the core technological hypotheses.

#### **Works cited**

1. Distracted-driving-legislation-chart-2022.docx \- Parachute.ca, accessed January 16, 2026, [https://parachute.ca/wp-content/uploads/2022/10/Distracted-driving-legislation-chart-2022.docx](https://parachute.ca/wp-content/uploads/2022/10/Distracted-driving-legislation-chart-2022.docx)  
2. Distracted Driving Canadian Legislation Chart | Parachute.ca, accessed January 16, 2026, [https://parachute.ca/wp-content/uploads/2019/08/Distracted-Driving-Canadian-Legislation-Chart.pdf](https://parachute.ca/wp-content/uploads/2019/08/Distracted-Driving-Canadian-Legislation-Chart.pdf)  
3. Use of electronic devices while driving \- Province of British Columbia, accessed January 16, 2026, [https://www2.gov.bc.ca/gov/content?id=338701D1967B48CD920F07B36AF64906](https://www2.gov.bc.ca/gov/content?id=338701D1967B48CD920F07B36AF64906)  
4. Distracted Driving in Canada: Laws & Penalties Per Province, accessed January 16, 2026, [https://www.canadadrives.ca/blog/driving-tips/distracted-driving-laws-penalties-canada](https://www.canadadrives.ca/blog/driving-tips/distracted-driving-laws-penalties-canada)  
5. Distracted Driving \- The Law in British Columbia \- Road Safety at Work, accessed January 16, 2026, [https://roadsafetyatwork.ca/wp-content/uploads/2022/06/RSAW-Webinar-Distracted-Driving-More-than-Just-Phones.pdf](https://roadsafetyatwork.ca/wp-content/uploads/2022/06/RSAW-Webinar-Distracted-Driving-More-than-Just-Phones.pdf)  
6. PIPEDA Findings \#2022-006: Investigation into Trimac's use of an audio and video surveillance device in its truck cabins, accessed January 16, 2026, [https://www.priv.gc.ca/en/opc-actions-and-decisions/investigations/investigations-into-businesses/2022/pipeda-2022-006/](https://www.priv.gc.ca/en/opc-actions-and-decisions/investigations/investigations-into-businesses/2022/pipeda-2022-006/)  
7. Privacy in the Workplace, accessed January 16, 2026, [https://www.priv.gc.ca/en/privacy-topics/employers-and-employees/02\_05\_d\_17/](https://www.priv.gc.ca/en/privacy-topics/employers-and-employees/02_05_d_17/)  
8. Automated Facial Recognition in the Public and Private Sectors \- Office of the Privacy Commissioner of Canada, accessed January 16, 2026, [https://www.priv.gc.ca/en/opc-actions-and-decisions/research/explore-privacy-research/2013/fr\_201303/](https://www.priv.gc.ca/en/opc-actions-and-decisions/research/explore-privacy-research/2013/fr_201303/)  
9. Can PIPEDA 'Face' the Challenge? An Analysis of the Adequacy of Canada's Private Sector Privacy Legislation against Facial \- Schulich Law Scholars, accessed January 16, 2026, [https://digitalcommons.schulichlaw.dal.ca/cgi/viewcontent.cgi?article=1262\&context=cjlt](https://digitalcommons.schulichlaw.dal.ca/cgi/viewcontent.cgi?article=1262&context=cjlt)  
10. Get help with your claim \- ICBC, accessed January 16, 2026, [https://www.icbc.com/claims/report-view/get-help-with-your-claim](https://www.icbc.com/claims/report-view/get-help-with-your-claim)  
11. A Step-by-Step Guide to Filing an ICBC Claim After a Collision \- Sopron Autobody, accessed January 16, 2026, [https://sopronautobody.ca/blog/a-step-by-step-guide-to-filing-an-icbc-claim-after-a-collision](https://sopronautobody.ca/blog/a-step-by-step-guide-to-filing-an-icbc-claim-after-a-collision)  
12. What is the Chain of Custody in Digital Forensics? \- Champlain College Online, accessed January 16, 2026, [https://online.champlain.edu/blog/chain-custody-digital-forensics](https://online.champlain.edu/blog/chain-custody-digital-forensics)  
13. The Fragility of Chain of Custody in the Era of Digital Evidence | Pagefreezer \- JDSupra, accessed January 16, 2026, [https://www.jdsupra.com/legalnews/the-fragility-of-chain-of-custody-in-8368701/](https://www.jdsupra.com/legalnews/the-fragility-of-chain-of-custody-in-8368701/)  
14. Electronic Documents and Records \- Criminal Law Notebook, accessed January 16, 2026, [https://criminalnotebook.ca/index.php/Electronic\_Documents\_and\_Records](https://criminalnotebook.ca/index.php/Electronic_Documents_and_Records)  
15. Jetson Nano vs Raspberry Pi 5 for AI: The Ultimate Performance and Val \- Think Robotics, accessed January 16, 2026, [https://thinkrobotics.com/blogs/learn/jetson-nano-vs-raspberry-pi-5-for-ai-the-ultimate-performance-and-value-comparison](https://thinkrobotics.com/blogs/learn/jetson-nano-vs-raspberry-pi-5-for-ai-the-ultimate-performance-and-value-comparison)  
16. Raspberry Pi 5 8GB \- CanaKit, accessed January 16, 2026, [https://www.canakit.com/raspberry-pi-5-8gb.html](https://www.canakit.com/raspberry-pi-5-8gb.html)  
17. Raspberry Pi 5 Single Board Computers – Mouser Canada, accessed January 16, 2026, [https://www.mouser.ca/c/?form%20factor=Raspberry%20Pi%205](https://www.mouser.ca/c/?form+factor=Raspberry+Pi+5)  
18. Benchmarking Edge AI Platforms: Performance Analysis of NVIDIA Jetson and Raspberry Pi 5 with Coral TPU \- Georgia Southern Scholars, accessed January 16, 2026, [https://scholars.georgiasouthern.edu/en/publications/benchmarking-edge-ai-platforms-performance-analysis-of-nvidia-jet/](https://scholars.georgiasouthern.edu/en/publications/benchmarking-edge-ai-platforms-performance-analysis-of-nvidia-jet/)  
19. Hailo-8L Entry-Level AI Accelerator Solutions, accessed January 16, 2026, [https://hailo.ai/products/ai-accelerators/hailo-8l-ai-accelerator-for-ai-light-applications/](https://hailo.ai/products/ai-accelerators/hailo-8l-ai-accelerator-for-ai-light-applications/)  
20. Hailo 8 Raspberry Pi Setup Guide for Real-Time AI Inference, accessed January 16, 2026, [https://www.ridgerun.ai/post/how-to-set-up-hailo-8-on-raspberry-pi-5-for-real-time-edge-ai-inference](https://www.ridgerun.ai/post/how-to-set-up-hailo-8-on-raspberry-pi-5-for-real-time-edge-ai-inference)  
21. Benefits of HAILO-8 AI Accelerators for Edge Computing | Things Embedded USA, accessed January 16, 2026, [https://things-embedded.com/us/white-paper/benefits-of-hailo-8-ai-accelerators-for-edge-computing/](https://things-embedded.com/us/white-paper/benefits-of-hailo-8-ai-accelerators-for-edge-computing/)  
22. Buy a Raspberry Pi Global Shutter Camera, accessed January 16, 2026, [https://www.raspberrypi.com/products/raspberry-pi-global-shutter-camera/](https://www.raspberrypi.com/products/raspberry-pi-global-shutter-camera/)  
23. Raspberry Pi Original Global Shutter Camera Module, Supports C/CS mount lenses, 1.6 MP, High-speed Motion photography \- Waveshare, accessed January 16, 2026, [https://www.waveshare.com/raspberry-pi-global-shutter-camera.htm](https://www.waveshare.com/raspberry-pi-global-shutter-camera.htm)  
24. What's the Best Raspberry Pi Camera For Your Project? \- Random Nerd Tutorials, accessed January 16, 2026, [https://randomnerdtutorials.com/best-raspberry-pi-camera-for-your-project/](https://randomnerdtutorials.com/best-raspberry-pi-camera-for-your-project/)  
25. Geekworm X1202 UPS & Power Management Board with 4 cell 18650 battery holder for Raspberry Pi 5 \- AliExpress, accessed January 16, 2026, [https://www.aliexpress.com/item/1005006440423204.html](https://www.aliexpress.com/item/1005006440423204.html)  
26. X1202 \- Geekworm Wiki, accessed January 16, 2026, [https://wiki.geekworm.com/X1202](https://wiki.geekworm.com/X1202)  
27. Powering Pi5 with Automotive Power and Graceful Shutdown \- Open Source Schematic : r/raspberry\_pi \- Reddit, accessed January 16, 2026, [https://www.reddit.com/r/raspberry\_pi/comments/1lbh296/powering\_pi5\_with\_automotive\_power\_and\_graceful/](https://www.reddit.com/r/raspberry_pi/comments/1lbh296/powering_pi5_with_automotive_power_and_graceful/)  
28. Geekworm X1202 4-Cell 18650 5.1V 5A UPS HAT for Raspberry Pi 5 Series, accessed January 16, 2026, [https://geekworm.com/products/x1202](https://geekworm.com/products/x1202)  
29. Geekworm X1202 4-Cell 18650 5.1V 5A UPS HAT for Raspberry Pi 5 Series, accessed January 16, 2026, [https://www.centralcomputer.com/geekworm-x1202-4-cell-18650-5-1v-5a-ups-hat-for-raspberry-pi-5-series.html](https://www.centralcomputer.com/geekworm-x1202-4-cell-18650-5-1v-5a-ups-hat-for-raspberry-pi-5-series.html)  
30. High-Endurance MicroSD Cards Matter: See the Problematic Cards Returned by Customers, accessed January 16, 2026, [https://www.viofo.com/blogs/viofo-car-dash-camera-guide-faq-and-news/high-endurance-microsd-cards-matter-see-the-problematic-cards-returned-by-customers](https://www.viofo.com/blogs/viofo-car-dash-camera-guide-faq-and-news/high-endurance-microsd-cards-matter-see-the-problematic-cards-returned-by-customers)  
31. Best Micro SD for Dashcam. I Burned Through 4 Cards in 3 Months —… | by Ibrahim, accessed January 16, 2026, [https://medium.com/@muteebhussain1310/best-micro-sd-for-dashcam-9ee98af8cfb8](https://medium.com/@muteebhussain1310/best-micro-sd-for-dashcam-9ee98af8cfb8)  
32. Samsung Pro Endurance MicroSD 128GB, accessed January 16, 2026, [https://www.samsung.com/ca/memory-storage/memory-card/memory-card-pro-endurance-128gb-mb-mj128ka-am/](https://www.samsung.com/ca/memory-storage/memory-card/memory-card-pro-endurance-128gb-mb-mj128ka-am/)  
33. How Do You Choose the Right Dash Cam Storage: SD Card, Hard Drive, or Cloud?, accessed January 16, 2026, [https://visionsafetys.com/how-do-you-choose-the-right-dash-cam-storage-sd-card-hard-drive-or-cloud/](https://visionsafetys.com/how-do-you-choose-the-right-dash-cam-storage-sd-card-hard-drive-or-cloud/)  
34. Exploring Raspberry Pi 5 Thermal Performance \- Latest News from Seeed Studio, accessed January 16, 2026, [https://www.seeedstudio.com/blog/2023/10/19/exploring-raspberry-pi-5-thermal-performance/](https://www.seeedstudio.com/blog/2023/10/19/exploring-raspberry-pi-5-thermal-performance/)  
35. Heating and cooling Raspberry Pi 5, accessed January 16, 2026, [https://www.raspberrypi.com/news/heating-and-cooling-raspberry-pi-5/](https://www.raspberrypi.com/news/heating-and-cooling-raspberry-pi-5/)  
36. Raspberry Pi 5 Cases & Cooling Accessories \- PiShop.us, accessed January 16, 2026, [https://www.pishop.us/product-category/raspberry-pi/raspberry-pi-5/raspberry-pi-5-cases-cooling/](https://www.pishop.us/product-category/raspberry-pi/raspberry-pi-5/raspberry-pi-5-cases-cooling/)  
37. Vilros Duo Deluxe Raspberry Pi 5 Case- The Deluxe Passive and Active C, accessed January 16, 2026, [https://vilros.com/products/vilros-aluminum-alloy-passive-and-active-cooling-cooling-raspberry-pi-5-case-cnc-crafted](https://vilros.com/products/vilros-aluminum-alloy-passive-and-active-cooling-cooling-raspberry-pi-5-case-cnc-crafted)  
38. Outdoor Raspberry Pi Project: Temperature Management Challenge \- Arduino Forum, accessed January 16, 2026, [https://forum.arduino.cc/t/outdoor-raspberry-pi-project-temperature-management-challenge/1380247](https://forum.arduino.cc/t/outdoor-raspberry-pi-project-temperature-management-challenge/1380247)  
39. Benchmark of Multistream Inference on Raspberrypi 5 with Hailo8 \- Seeed Wiki, accessed January 16, 2026, [https://wiki.seeedstudio.com/benchmark\_of\_multistream\_inference\_on\_raspberrypi5\_with\_hailo8/](https://wiki.seeedstudio.com/benchmark_of_multistream_inference_on_raspberrypi5_with_hailo8/)  
40. hailo-rpi5-examples/doc/basic-pipelines.md at main \- GitHub, accessed January 16, 2026, [https://github.com/hailo-ai/hailo-rpi5-examples/blob/main/doc/basic-pipelines.md](https://github.com/hailo-ai/hailo-rpi5-examples/blob/main/doc/basic-pipelines.md)  
41. Hailo 8L Raspberry pi gstreamer parallel inference \- General Discussion, accessed January 16, 2026, [https://community.hailo.ai/t/hailo-8l-raspberry-pi-gstreamer-parallel-inference/11482](https://community.hailo.ai/t/hailo-8l-raspberry-pi-gstreamer-parallel-inference/11482)  
42. Host a Wi-Fi hotspot with a Raspberry Pi, accessed January 16, 2026, [https://www.raspberrypi.com/tutorials/host-a-hotel-wifi-hotspot/](https://www.raspberrypi.com/tutorials/host-a-hotel-wifi-hotspot/)  
43. Splines/raspi-captive-portal: A Captive Portal & Access Point setup for use with the Raspberry Pi (no Internet access) \- GitHub, accessed January 16, 2026, [https://github.com/Splines/raspi-captive-portal](https://github.com/Splines/raspi-captive-portal)  
44. Using Flask to Send Data to a Raspberry Pi \- SparkFun Learn, accessed January 16, 2026, [https://learn.sparkfun.com/tutorials/using-flask-to-send-data-to-a-raspberry-pi/all](https://learn.sparkfun.com/tutorials/using-flask-to-send-data-to-a-raspberry-pi/all)  
45. SnowyLane: Robust Lane Detection on Snow-covered Rural Roads Using Infrastructural Elements \- arXiv, accessed January 16, 2026, [https://arxiv.org/html/2511.05108v1](https://arxiv.org/html/2511.05108v1)  
46. Snowy-Lane, accessed January 16, 2026, [https://ekut-es.github.io/snowy-lane](https://ekut-es.github.io/snowy-lane)  
47. The Boreas Dataset, accessed January 16, 2026, [https://www.boreas.utias.utoronto.ca/](https://www.boreas.utias.utoronto.ca/)  
48. Compiling .HEF and Deploying YOLO11 on Raspberry Pi 5 \+ Hailo-8 (Full Step-by-Step Guide) \- rasimmax.com | Rasim Mahmudov, accessed January 16, 2026, [https://rasimmax.com/blog/deploying-yolo11-on-raspberry-pi-5-and-hailo-8-acceletator](https://rasimmax.com/blog/deploying-yolo11-on-raspberry-pi-5-and-hailo-8-acceletator)  
49. YOLOv11n to Hailo-8 HEF Compilation Guide — RCR \- Common Robotics Platform, accessed January 16, 2026, [https://common.rosecityrobotics.com/YOLO\_ObjectDetection/YOLOv11n\_to\_Hailo8\_Guide.html](https://common.rosecityrobotics.com/YOLO_ObjectDetection/YOLOv11n_to_Hailo8_Guide.html)  
50. Public School Locations 2021-22 \- Dataset \- Catalog \- Data.gov, accessed January 16, 2026, [https://catalog.data.gov/dataset/public-school-locations-2021-22-5a116](https://catalog.data.gov/dataset/public-school-locations-2021-22-5a116)  
51. geospatial \- 47 \- Dataset \- Catalog \- Data.gov, accessed January 16, 2026, [https://catalog.data.gov/dataset/?tags=schools\&res\_format=ArcGIS+GeoServices+REST+API\&metadata\_type=geospatial](https://catalog.data.gov/dataset/?tags=schools&res_format=ArcGIS+GeoServices+REST+API&metadata_type=geospatial)  
52. How to Implement Geofencing Using Python and PostGIS \- DEV Community, accessed January 16, 2026, [https://dev.to/kamal\_deeppareek\_f5bb5d8/how-to-implement-geofencing-using-python-and-postgis-4l61](https://dev.to/kamal_deeppareek_f5bb5d8/how-to-implement-geofencing-using-python-and-postgis-4l61)  
53. Manipulating Spatial Objects: Points, Lines, Polygons in Python \- PyGIS, accessed January 16, 2026, [https://pygis.io/docs/c\_new\_vectors.html](https://pygis.io/docs/c_new_vectors.html)  
54. Picovoice/porcupine: On-device wake word detection powered by deep learning \- GitHub, accessed January 16, 2026, [https://github.com/Picovoice/porcupine](https://github.com/Picovoice/porcupine)  
55. The state of voice assistant integrations in 2024 \- Platypush, accessed January 16, 2026, [https://blog.platypush.tech/article/The-state-of-voice-assistant-integrations-in-2024](https://blog.platypush.tech/article/The-state-of-voice-assistant-integrations-in-2024)  
56. Vosk Speech Recognition Toolkit \- Raspberry Pi Forums, accessed January 16, 2026, [https://forums.raspberrypi.com/viewtopic.php?t=298045](https://forums.raspberrypi.com/viewtopic.php?t=298045)  
57. Best Transcription Software (Free and Paid) to Convert Speech to Text \- Picovoice.ai, accessed January 16, 2026, [https://picovoice.ai/blog/top-transcription-engines/](https://picovoice.ai/blog/top-transcription-engines/)  
58. How to run Multiple local model on Hailo-8L in parallel?, accessed January 16, 2026, [https://community.hailo.ai/t/how-to-run-multiple-local-model-on-hailo-8l-in-parallel/17547](https://community.hailo.ai/t/how-to-run-multiple-local-model-on-hailo-8l-in-parallel/17547)  
59. Eager batching on Hailo using DeGirum PySDK | by Darshil Modi \- Medium, accessed January 16, 2026, [https://medium.com/degirum/eager-batching-on-hailo-using-degirum-pysdk-4d41987707ff](https://medium.com/degirum/eager-batching-on-hailo-using-degirum-pysdk-4d41987707ff)  
60. How to File an ICBC Claim Online | Full Guide \- Cerna Collision, accessed January 16, 2026, [https://www.cernacollision.ca/blogs/how-to-make-an-icbc-claim](https://www.cernacollision.ca/blogs/how-to-make-an-icbc-claim)  
61. Raspberry Pi AI Kit Hailo 8L AI Accelerator for Raspberry Pi 5 Board SC1438 | eBay, accessed January 16, 2026, [https://www.ebay.ca/itm/186629024607](https://www.ebay.ca/itm/186629024607)  
62. SC0926 RASPBERRY-PI, GLOBAL SHUTTER CAMERA, COMPUTER ROHS COMPLIANT: YES | Newark Electronics Canada, accessed January 16, 2026, [https://canada.newark.com/raspberry-pi/sc0926/global-shutter-camera-computer/dp/69AK9095](https://canada.newark.com/raspberry-pi/sc0926/global-shutter-camera-computer/dp/69AK9095)  
63. UPS HAT \- Geekworm, accessed January 16, 2026, [https://geekworm.com/collections/ups-hat](https://geekworm.com/collections/ups-hat)  
64. Samsung PRO Endurance 128 GB Class 10/UHS-I (U3) V30 microSDXC MB-MJ128KA/AM, accessed January 16, 2026, [https://deploydepot.ca/fr/products/samsung-pro-endurance-128-gb-class-10-uhs-i-u3-v30-microsdxc-mb-mj128ka-am](https://deploydepot.ca/fr/products/samsung-pro-endurance-128-gb-class-10-uhs-i-u3-v30-microsdxc-mb-mj128ka-am)  
65. Buy a Raspberry Pi Active Cooler, accessed January 16, 2026, [https://www.raspberrypi.com/products/active-cooler/](https://www.raspberrypi.com/products/active-cooler/)