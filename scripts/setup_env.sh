#!/bin/bash

# MapleCam Sentinel Environment Setup Script
# Target API: Raspberry Pi 5 (Bookworm 64-bit)

echo "Starting MapleCam Environment Setup..."

# 1. Update System
echo "[1/4] Updating System Packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install GStreamer and plugins
echo "[2/4] Installing GStreamer and Multimedia Libraries..."
sudo apt install -y \
    libgstreamer1.0-0 \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav \
    gstreamer1.0-tools \
    python3-gi \
    python3-gst-1.0 \
    gir1.2-gstreamer-1.0 \
    libgirepository1.0-dev \
    libcairo2-dev

# 3. Install Hailo Dependencies (Assuming HailoRT is installed via apt in newer Pi OS or separate install)
echo "[3/4] Installing Hailo Dependencies..."
# Note: Specific HailoRT installation often requires downloading .deb from Hailo portal.
# We assume the user has followed the standard Hailo setup, but we ensure dependencies are present.
sudo apt install -y hailo-all 2>/dev/null || echo "Warning: hailo-all package not found in apt. Ensure HailoRT is installed manually."

# 4. Install Python Dependencies
echo "[4/4] Installing Python Requirements..."
# Create a virtual environment recommended
python3 -m venv .venv
source .venv/bin/activate
pip install -r ../requirements.txt

echo "Setup Complete. Please reboot the Pi."
