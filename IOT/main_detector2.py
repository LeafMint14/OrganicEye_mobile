import time
import datetime
import cv2
import numpy as np
import firebase_admin
from firebase_admin import credentials, firestore
import cloudinary
import cloudinary.uploader
from picamera2 import Picamera2, Preview
from tflite_runtime.interpreter import Interpreter

from pechay_diagnostics import analyze_pechay_health, push_diagnostic_to_cloud

# --- ANTI-BOOT CRASH DELAY ---
# Gives the Raspberry Pi 15 seconds to connect to Wi-Fi before trying to talk to Google Firebase
print("Waiting 15 seconds for Wi-Fi and Camera hardware to initialize...")
time.sleep(15)

# --- CONFIGURATION ---
# We use absolute paths so the script works no matter where you launch it from
BASE_PATH = "/home/organiceye/Desktop/pechay_project/"

try:
    if not firebase_admin._apps:
        # POINT TO THE EXACT FOLDER
        cred = credentials.Certificate(BASE_PATH + "firebase-key.json")
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    
    cloudinary.config(
        cloud_name="dqqhcfe39", 
        api_key="472526654159215", 
        api_secret="FnR3loc7jv4dNpAnUUYWevK64Rw"
    )
    UPLOAD_PRESET = "pi_uploads"
except Exception as e:
    print(f"Setup Error: {e}"); exit()

# --- 1. CORE MODELS (Updated Paths) ---
CROP_MODEL_PATH = BASE_PATH + "crop_model.tflite"
CROP_LABEL_PATH = BASE_PATH + "crop_labels.txt"
INSECT_MODEL_PATH = BASE_PATH + "insect_model.tflite"
INSECT_LABEL_PATH = BASE_PATH + "insect_labels.txt"

# --- 2. ANOMALY MODELS (Updated Paths) ---
UNID_CROP_MODEL_PATH = BASE_PATH + "Unidentified_Crop.tflite"
UNID_CROP_LABEL_PATH = BASE_PATH + "unidentified_crop.txt"
UNID_INSECT_MODEL_PATH = BASE_PATH + "Unidentified_insect.tflite" 
UNID_INSECT_LABEL_PATH = BASE_PATH + "unidentified_insect.txt"

# MUST MATCH YOUR APP
MY_PI_ID = "pi-unit-002"

# --- DYNAMIC GLOBAL SETTINGS ---
DETECTION_INTERVAL = 5     
ENABLE_MAX_DETECTIONS = True
MAX_DETECTIONS_PER_DAY = 50

# --- ADVANCED ALERT THRESHOLDS ---
MIN_CONFIDENCE = 0.70
HIGH_RISK_THRESH = 0.90
MED_RISK_THRESH = 0.75
HIGH_RISK_ENABLED = True
MED_RISK_ENABLED = True
LOW_RISK_ENABLED = False

daily_detection_count = 0
last_reset_date = datetime.date.today()
force_test_flag = False
calibrate_camera_flag = False

def load_labels(path):
    with open(path, 'r') as f:
        return {i: line.strip() for i, line in enumerate(f.readlines())}

def load_model(path):
    interpreter = Interpreter(model_path=path)
    interpreter.allocate_tensors()
    return interpreter, interpreter.get_input_details(), interpreter.get_output_details()

# --- LOAD ALL 4 MODELS INTO RAM ---
print("Loading Neural Networks into RAM...")
crop_int, crop_in, crop_out = load_model(CROP_MODEL_PATH)
crop_labels = load_labels(CROP_LABEL_PATH)

ins_int, ins_in, ins_out = load_model(INSECT_MODEL_PATH)
ins_labels = load_labels(INSECT_LABEL_PATH)

unid_crop_int, unid_crop_in, unid_crop_out = load_model(UNID_CROP_MODEL_PATH)
unid_crop_labels = load_labels(UNID_CROP_LABEL_PATH)

unid_ins_int, unid_ins_in, unid_ins_out = load_model(UNID_INSECT_MODEL_PATH)
unid_ins_labels = load_labels(UNID_INSECT_LABEL_PATH)
print("All 4 models loaded successfully!")

def run_inference(image, interpreter, input_details, output_details, labels):
    if image.shape[-1] == 4:
        image = image[:, :, :3]
    
    input_shape = input_details[0]['shape']
    h, w = input_shape[1], input_shape[2]
    
    resized = cv2.resize(image, (w, h))
    input_data = np.expand_dims(resized, axis=0).astype(np.float32) / 255.0
    
    interpreter.set_tensor(input_details[0]['index'], input_data)
    interpreter.invoke()
    
    output_data = interpreter.get_tensor(output_details[0]['index'])[0]
    if output_data.shape[0] < output_data.shape[1]:
        output_data = output_data.T

    found = []
    for row in output_data:
        scores = row[4:]
        class_id = np.argmax(scores)
        score = scores[class_id]
        
        if score >= MIN_CONFIDENCE:
            risk_level = "Low"
            if score >= HIGH_RISK_THRESH:
                risk_level = "High"
            elif score >= MED_RISK_THRESH:
                risk_level = "Medium"
                
            if risk_level == "High" and HIGH_RISK_ENABLED:
                found.append(labels.get(class_id, "Unknown"))
            elif risk_level == "Medium" and MED_RISK_ENABLED:
                found.append(labels.get(class_id, "Unknown"))
            elif risk_level == "Low" and LOW_RISK_ENABLED:
                found.append(labels.get(class_id, "Unknown"))
            
    return [item for item in list(set(found)) if "Background" not in item]

def on_settings_snapshot(doc_snapshot, changes, read_time):
    global DETECTION_INTERVAL, ENABLE_MAX_DETECTIONS, MAX_DETECTIONS_PER_DAY
    global MIN_CONFIDENCE, HIGH_RISK_THRESH, MED_RISK_THRESH
    global HIGH_RISK_ENABLED, MED_RISK_ENABLED, LOW_RISK_ENABLED
    
    for doc in doc_snapshot:
        data = doc.to_dict()
        if data:
            print("\n⚙️ [SYNC] Updating Settings from Mobile App...")
            
            DETECTION_INTERVAL = int(data.get('detectionInterval', 5))
            ENABLE_MAX_DETECTIONS = data.get('enableMaxDetections', True)
            MAX_DETECTIONS_PER_DAY = int(data.get('maxDetectionsPerDay', 50))
            
            alert_settings = data.get('alertSettings', {})
            if alert_settings:
                MIN_CONFIDENCE = alert_settings.get('minConfidence', 70) / 100.0
                HIGH_RISK_THRESH = alert_settings.get('highRiskThreshold', 90) / 100.0
                MED_RISK_THRESH = alert_settings.get('mediumRiskThreshold', 75) / 100.0
                HIGH_RISK_ENABLED = alert_settings.get('highRiskEnabled', True)
                MED_RISK_ENABLED = alert_settings.get('mediumRiskEnabled', True)
                LOW_RISK_ENABLED = alert_settings.get('lowRiskEnabled', False)
            else:
                MIN_CONFIDENCE = data.get('detectionThreshold', 0.60)
            
            print(f"   > Alert Tiers: High(>={int(HIGH_RISK_THRESH*100)}%), Med(>={int(MED_RISK_THRESH*100)}%), Low(>={int(MIN_CONFIDENCE*100)}%)")

def on_command_snapshot(col_snapshot, changes, read_time):
    global force_test_flag, calibrate_camera_flag
    for change in changes:
        if change.type.name in ['ADDED', 'MODIFIED']:
            doc = change.document.to_dict()
            doc_id = change.document.id
            if doc.get('status') == 'pending':
                command = doc.get('command')
                if command == 'test_detection':
                    force_test_flag = True
                elif command == 'calibrate_camera':
                    calibrate_camera_flag = True
                try:
                    db.collection('device_commands').document(doc_id).update({'status': 'completed'})
                except:
                    pass

def main():
    global force_test_flag, calibrate_camera_flag, daily_detection_count, last_reset_date
    
    picam2 = Picamera2()
    picam2.configure(picam2.create_preview_configuration(main={"size": (640, 480)}))
    
    try:
        print("✅ Camera initialized in background mode")
    except:
        print("⚠️ Camera initialization failed")

    picam2.start()
    print(f"🚀 System Online | Pi ID: {MY_PI_ID}")

    settings_ref = db.collection('device_settings').document(MY_PI_ID)
    settings_watch = settings_ref.on_snapshot(on_settings_snapshot)
    
    commands_ref = db.collection('device_commands').where('pi_id', '==', MY_PI_ID)
    commands_watch = commands_ref.on_snapshot(on_command_snapshot)

    last_scan_time = 0
    
    # --- ANTI-SPAM VARIABLES ---
    last_uploaded_label = ""
    last_upload_time = 0
    UPLOAD_COOLDOWN = 60 # Prevents uploading the exact same image for 60 seconds

    try:
        while True:
            current_time = time.time()
            today = datetime.date.today()
            
            if today != last_reset_date:
                daily_detection_count = 0
                last_reset_date = today

            if calibrate_camera_flag:
                print("\n⚙️ EXECUTING CALIBRATION...")
                time.sleep(2) 
                print("✅ Calibration complete!")
                calibrate_camera_flag = False
                continue

            is_time_for_auto_scan = (current_time - last_scan_time) >= DETECTION_INTERVAL
            
            if force_test_flag or is_time_for_auto_scan:
                
                if not force_test_flag and ENABLE_MAX_DETECTIONS and daily_detection_count >= MAX_DETECTIONS_PER_DAY:
                    print(f"\r⏳ Daily limit reached ({MAX_DETECTIONS_PER_DAY}/{MAX_DETECTIONS_PER_DAY}). Waiting for tomorrow...", end="", flush=True)
                    time.sleep(1)
                    continue
                
                if not force_test_flag:
                    last_scan_time = current_time

                frame = picam2.capture_array()
                
                res_crop = run_inference(frame, crop_int, crop_in, crop_out, crop_labels)
                res_ins = run_inference(frame, ins_int, ins_in, ins_out, ins_labels)
                res_unid_crop = run_inference(frame, unid_crop_int, unid_crop_in, unid_crop_out, unid_crop_labels)
                res_unid_ins = run_inference(frame, unid_ins_int, unid_ins_in, unid_ins_out, unid_ins_labels)
                
                combined_crops = list(set(res_crop + res_unid_crop))
                combined_insects = list(set(res_ins + res_unid_ins))
                
                report = analyze_pechay_health(combined_crops + combined_insects)

                if force_test_flag or (report and report['status'] != "No Detection"):
                    
                    current_label = report['analysis_basis']
                    
                    # --- THE ANTI-SPAM FILTER LOGIC ---
                    is_duplicate = (current_label == last_uploaded_label)
                    time_since_last_upload = current_time - last_upload_time
                    
                    if not force_test_flag and is_duplicate and time_since_last_upload < UPLOAD_COOLDOWN:
                        print(f"\r[ANTI-SPAM] Ignoring duplicate detection: {current_label}... ", end="", flush=True)
                        time.sleep(1)
                        continue
                        
                    # If it passes the anti-spam filter, upload it!
                    if force_test_flag:
                        print("\n📸 MANUAL TEST DETECTION TRIGGERED BY APP")
                        if not report or report['status'] == "No Detection":
                            report = {"status": "Manual Test", "score": 100, "analysis_basis": "Manual Snapshot", "type": "Crop Analysis", "primary": "Test Image"}
                        force_test_flag = False
                    else:
                        print(f"\n[AUTO-SCAN] Final Diagnosis: {current_label} ({report.get('score', 0)}%)")
                        daily_detection_count += 1
                        
                        # Update the Anti-Spam memory
                        last_uploaded_label = current_label
                        last_upload_time = current_time
                    
                    _, buffer = cv2.imencode('.jpg', frame)
                    try:
                        print("☁️ Uploading to Cloudinary...")
                        upload_res = cloudinary.uploader.upload(buffer.tobytes(), upload_preset=UPLOAD_PRESET)
                        push_diagnostic_to_cloud(report, upload_res['secure_url'], MY_PI_ID)
                        print(f"✅ Data pushed! (Count today: {daily_detection_count})")
                    except Exception as e:
                        print(f"❌ Upload Error: {e}")
                
            else:
                time_left = int(DETECTION_INTERVAL - (current_time - last_scan_time))
                print(f"\r🔍 Next auto-scan in {time_left}s... ", end="", flush=True)

            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Shutting down system...")
        picam2.stop()

if __name__ == "__main__":
    main()
