import requests
from firebase_admin import firestore

# --- 1. DEFINE CATEGORIES ---
CROP_SYMPTOMS = [
    'Healthy', 'Wilting', 'Yellowing', 'Spotting', 'Insect bite', 'Leaf Perforation', 'Unidentified Crop'
]

LIVE_INSECTS = [
    'Beneficial Bee', 
    'Beneficial Ladybug', 
    'Beneficial Lacewing Larvae',
    'Beneficial Larvae',
    'Infected Aphid', 
    'Infected Flea Beetle', 
    'Infected Pumpkin Beetle', 
    'Infected Leaf Miners', 
    'Infected Squash Beetles',
    'Unidentified Insect'
]

# --- 2. SCORING WEIGHTS ---
WEIGHTS = {
    'Healthy': 0, 'Beneficial Bee': 0, 'Beneficial Ladybug': 0, 
    'Beneficial Lacewing Larvae': 0, 'Beneficial Larvae': 0,
    'Spotting': 15, 'Yellowing': 20, 'Unidentified Crop': 20, 
    'Leaf Perforation': 25, 'Insect bite': 25, 'Wilting': 30,
    'Infected Aphid': 35, 'Infected Flea Beetle': 35, 
    'Infected Pumpkin Beetle': 35, 'Infected Leaf Miners': 35, 
    'Infected Squash Beetles': 35, 'Unidentified Insect': 35
}

def analyze_pechay_health(all_detected_labels):
    clean_labels = [str(l).strip() for l in all_detected_labels if l and str(l).strip() not in ["Background", "Unknown"]]
    
    processed_insects = []
    processed_crops = []

    for label in clean_labels:
        if label in LIVE_INSECTS:
            processed_insects.append(label)
        elif label in CROP_SYMPTOMS:
            processed_crops.append(label)
        else:
            processed_crops.append("Unidentified Crop")

    final_crops = []
    for crop in processed_crops:
        if crop == 'Insect bite':
            if len(processed_insects) > 0:
                final_crops.append('Insect bite')
            else:
                final_crops.append('Leaf Perforation')
        else:
            final_crops.append(crop)
            
    final_crops = list(set(final_crops))
    processed_insects = list(set(processed_insects))
    unique_labels = list(set(final_crops + processed_insects))

    if not unique_labels:
        return {
            "status": "No Detection", "score": 0, 
            "analysis_basis": "None", "type": "None", "primary": "None"
        }

    total_penalty = sum(WEIGHTS.get(label, 0) for label in unique_labels)
    final_score = max(0, 100 - int(total_penalty))

    if final_score >= 85: status = "Healthy"
    elif final_score >= 50: status = "Unhealthy"
    else: status = "Critical"

    issues_only = [l for l in unique_labels if l != 'Healthy']
    has_live_insect = len(processed_insects) > 0
    
    if has_live_insect:
        detection_type = "Insect" 
        display_name = ", ".join(issues_only)
        if "Beneficial" in display_name and final_score > 80:
             status = "Beneficial"
    else:
        detection_type = "Crop Analysis"
        display_name = ", ".join(issues_only) if issues_only else "Healthy"

    return {
        "status": status, "score": final_score,
        "analysis_basis": display_name, "type": detection_type, "primary": display_name      
    }

# --- PUSH NOTIFICATION SENDER ---
def send_push_notification(token, title, body):
    if not token: return
    url = 'https://exp.host/--/api/v2/push/send'
    headers = {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
    }
    payload = {
        'to': token, 
        'sound': 'default', 
        'title': title,
        'body': body, 
        'priority': 'high',
        'channelId': 'default', # <-- THE CRUCIAL FIX FOR ANDROID BACKGROUND ALERTS
        'data': {'extraData': 'Triggered from Raspberry Pi'} 
    }
    try:
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200: print("?? Push Notification fired successfully!")
        else: print(f"?? Push failed: {response.text}")
    except Exception as e:
        print(f"?? Error sending push: {e}")

def push_diagnostic_to_cloud(report, image_url, pi_id):
    try:
        db = firestore.client()
        
        # 1. Upload Detection to Database
        data = {
            "pi_id": pi_id, "timestamp": firestore.SERVER_TIMESTAMP,
            "imageUrl": image_url, "cropName": "Pechay",       
            "type": report["type"], "detection": report["analysis_basis"], 
            "diagnosis": report["status"], "status": report["status"],
            "score": report["score"], "healthScore": report["score"],
            "confidence": report["score"], "analysis_basis": report["analysis_basis"], 
            "primary_detection": report["primary"]
        }
        db.collection("detections").add(data)
        
        print(f"?? Sent to {report['type']} Module")
        print(f"   > Label: {report['analysis_basis']}")

        # 2. Fetch User Settings & Trigger Push Notification
        settings_doc = db.collection('device_settings').document(pi_id).get()
        settings = settings_doc.to_dict().get('alertSettings', {}) if settings_doc.exists else {}
        
        min_conf = settings.get('minConfidence', 70)
        high_thresh = settings.get('highRiskThreshold', 90)
        med_thresh = settings.get('mediumRiskThreshold', 75)

        users_ref = db.collection('users').where('pairedPiId', '==', pi_id).stream()
        for user_doc in users_ref:
            user_data = user_doc.to_dict()
            push_token = user_data.get('expoPushToken')
            
            if not push_token: continue
                
            confidence = report['score']
            
            # 3. Evaluate Thresholds
            if confidence >= min_conf:
                if confidence >= high_thresh and settings.get('highRiskEnabled', True):
                    send_push_notification(push_token, "?? High Risk Detection", f"Alert: {report['analysis_basis']} detected on your crops!")
                    
                elif confidence >= med_thresh and settings.get('mediumRiskEnabled', True):
                    send_push_notification(push_token, "?? Medium Risk Warning", f"Warning: {report['analysis_basis']} detected.")
                    
                elif confidence < med_thresh and settings.get('lowRiskEnabled', False):
                    send_push_notification(push_token, "?? Low Risk Notice", f"Notice: {report['analysis_basis']} detected.")
                    
    except Exception as e:
        print(f"? UPLOAD ERROR: {e}")