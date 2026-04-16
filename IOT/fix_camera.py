import cv2
import time

print("1. Program started...")

# --- THE FIX: ADD 'cv2.CAP_V4L2' AND FORCE LOW RESOLUTION ---
# This tells the Pi to use the standard driver, not the heavy GStreamer one.
cap = cv2.VideoCapture(0, cv2.CAP_V4L2)

# Force 640x480 resolution immediately to save memory
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

print("2. Attempting to open camera with V4L2 driver...")

if not cap.isOpened():
    print("? ERROR: Could not open video device.")
else:
    print("? Camera opened successfully!")
    
    # Try to grab a frame
    ret, frame = cap.read()
    if ret:
        print(f"? SUCCESS! Captured a frame of size: {frame.shape}")
        print("   Your camera is working now.")
    else:
        print("? ERROR: Camera opened but returned no image.")

cap.release()
print("3. Test finished.")