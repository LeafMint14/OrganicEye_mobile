import cv2
import time

print("1. Program started...")

try:
    print("2. Attempting to open camera (Index 0)...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("? ERROR: Could not open video device 0.")
        print("   - Try changing cv2.VideoCapture(0) to cv2.VideoCapture(1)")
        print("   - Check if another program is using the camera.")
        exit()
        
    print("? Camera opened successfully!")
    
    ret, frame = cap.read()
    if ret:
        print("? Successfully grabbed a frame!")
        print(f"   - Frame size: {frame.shape}")
    else:
        print("? ERROR: Camera opened but returned no image.")

    cap.release()
    print("3. Test finished.")

except Exception as e:
    print(f"? CRITICAL ERROR: {e}")