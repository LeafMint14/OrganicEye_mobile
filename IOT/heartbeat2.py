import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import time
import datetime
import socket

# --- NEW: Smart Internet Wait Loop ---
def wait_for_internet():
    print("Checking for internet connection...")
    while True:
        try:
            # Try to ping Google's DNS (8.8.8.8) to verify real internet access
            socket.create_connection(("8.8.8.8", 53), timeout=3)
            print("Internet connection established!")
            break
        except OSError:
            print("Waiting for Wi-Fi... checking again in 5 seconds.")
            time.sleep(5)

# 1. Wait for Wi-Fi and clock sync
wait_for_internet()
print("Waiting 10 seconds for system clock to sync...")
time.sleep(10)

# 2. Authenticate using the ABSOLUTE path so it never fails on boot
print("Authenticating with Firebase...")
# Make sure this path is exactly where your json file is!
cred = credentials.Certificate('/home/organiceye/Desktop/pechay_project/serviceAccountKey.json')
firebase_admin.initialize_app(cred)

# 3. Connect to your database
db = firestore.client()
device_ref = db.collection('devices').document('pi-unit-002')

print("Organic Eye IoT Link Established! Starting Heartbeat...")

# 4. The Infinite Heartbeat Loop
while True:
    try:
        current_time = datetime.datetime.utcnow().isoformat() + 'Z'
        
        device_ref.set({
            'lastActive': current_time,
            'status': 'Online'
        }, merge=True)
        
        print(f"[SUCCESS] Heartbeat pulse sent at {current_time}")
        
    except Exception as e:
        print(f"[ERROR] Could not send heartbeat: {e}")
        
    time.sleep(60)
