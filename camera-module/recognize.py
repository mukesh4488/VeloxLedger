# camera-module/recognize.py
import cv2
import os
import numpy as np
import requests
import time

# ==========================================
# CONFIGURATION
# ==========================================
BACKEND_URL = "http://localhost:5000/api/scans"
FRAME_COOLDOWN = 5  # Seconds to wait before sending another scan alert to the POS
KNOWN_FACES_DIR = "known_faces"

print("🔄 Initializing Local Edge AI Face Recognizer...")

# Load the Haar Cascade to crop out backgrounds and find faces
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Initialize the LBPH AI Engine
try:
    recognizer = cv2.face.LBPHFaceRecognizer_create()
except AttributeError:
    print("❌ Error: Missing AI module. Run: pip install opencv-contrib-python")
    exit()

# Memory banks for the AI
names_dictionary = {} 
faces_data = []
face_ids = []
current_id = 0

# ==========================================
# PHASE 1: LOCAL AI TRAINING
# ==========================================
print(f"📂 Scanning '{KNOWN_FACES_DIR}' folder for training images...")
if not os.path.exists(KNOWN_FACES_DIR):
    os.makedirs(KNOWN_FACES_DIR)
    print(f"⚠️ Created '{KNOWN_FACES_DIR}' folder. Please drop photos in it and restart!")
    exit()

for filename in os.listdir(KNOWN_FACES_DIR):
    if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        # Extract the name from the filename (e.g., "Mukesh_1.jpg" -> "Mukesh")
        # We split by "_" so you can use multiple photos like Mukesh_1, Mukesh_2, etc.
        customer_name = os.path.splitext(filename)[0].split('_')[0]
        names_dictionary[current_id] = customer_name
        
        # Read image and convert to grayscale for the AI
        filepath = os.path.join(KNOWN_FACES_DIR, filename)
        img = cv2.imread(filepath)
        if img is None:
            continue
            
        gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Crop the face out of the training image
        detected_faces = face_cascade.detectMultiScale(gray_img, scaleFactor=1.1, minNeighbors=5)
        for (x, y, w, h) in detected_faces:
            faces_data.append(gray_img[y:y+h, x:x+w]) # Save just the face
            face_ids.append(current_id)
            print(f"✅ Learned facial structure for: {customer_name}")
            break # Only take the primary face from the photo
        
        current_id += 1

if len(faces_data) == 0:
    print("❌ No faces found to train on. Add clear photos to 'known_faces' folder.")
    exit()

print("🧠 Training Neural Model... (this takes <1 second)")
recognizer.train(faces_data, np.array(face_ids))
print("✨ AI Training Complete!")

# ==========================================
# PHASE 2: LIVE EDGE SCANNING
# ==========================================
video_capture = cv2.VideoCapture(0)
if not video_capture.isOpened():
    print("❌ Error: Could not access your webcam.")
    exit()

last_scanned_time = 0
print("🚀 Camera active! Press 'q' in the window to quit.")

while True:
    ret, frame = video_capture.read()
    if not ret: break
    
    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Detect faces in the live feed
    detected_faces = face_cascade.detectMultiScale(
        gray_frame, 
        scaleFactor=1.2, 
        minNeighbors=5, 
        minSize=(60, 60)
    )
    
    current_time = time.time()
    
    for (x, y, w, h) in detected_faces:
        # Crop the live face and ask the AI who it is
        live_face = gray_frame[y:y+h, x:x+w]
        matched_id, distance_score = recognizer.predict(live_face)
        
        # In LBPH, a LOWER score means a BETTER match (0 is perfect).
        # We are using 65 as a strict threshold. Lower it if it mistakes Chandana for you.
        if distance_score < 65:
            predicted_name = names_dictionary.get(matched_id, "Unknown")
            box_color = (0, 255, 0) # Green for known customers
        else:
            predicted_name = "Unknown"
            box_color = (0, 0, 255) # Red for strangers
            
        # Draw the tracking box
        cv2.rectangle(frame, (x, y), (x+w, y+h), box_color, 2)
        
        # Display the name AND the distance score on the screen for debugging
        display_text = f"{predicted_name} (Score: {distance_score:.0f})" if predicted_name != "Unknown" else f"Stranger ({distance_score:.0f})"
        cv2.putText(frame, display_text, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, box_color, 2)
        
        # Send Webhook to Node.js Backend if it's a known customer and cooldown has passed
        if predicted_name != "Unknown" and (current_time - last_scanned_time > FRAME_COOLDOWN):
            last_scanned_time = current_time
            print(f"🎯 Recognized {predicted_name} (Score: {distance_score:.0f})! Sending to POS backend...")
            
            payload = {"customerName": predicted_name} 
            try:
                # Fire the webhook instantly to the local server
                response = requests.post(BACKEND_URL, json=payload, timeout=3)
                if response.status_code == 200:
                    print("📡 Webhook delivered. POS Dashboard updated successfully.")
            except requests.exceptions.ConnectionError:
                print("❌ Failed to reach Node.js server. Is your backend running on port 5000?")

    # Show the live feed window
    cv2.imshow('AI Khata - True Face Recognition', frame)
    
    # Hit 'q' to safely close the camera
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Clean up streams
video_capture.release()
cv2.destroyAllWindows()
print("👋 Camera module shut down gracefully.")