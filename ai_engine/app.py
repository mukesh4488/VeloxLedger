# /ai_engine/app.py
import cv2
import face_recognition
import requests
import numpy as np
import time
import threading
from flask import Flask, jsonify

# ==========================================
# CONFIGURATION
# ==========================================
NODE_API_URL = "http://localhost:5000/api"
THROTTLE_SECONDS = 30  # Wait 30 seconds before sending another alert for the same person

app = Flask(__name__)

# ==========================================
# FLASK HEALTH CHECK (Runs in Background)
# ==========================================
@app.route('/engine/health', methods=['GET'])
def health_check():
    return jsonify({
        "success": True,
        "message": "Python AI Vision Engine is running.",
        "status": "Operational"
    }), 200

def run_flask():
    # Run Flask with use_reloader=False so it doesn't interfere with the camera thread
    app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False)

# ==========================================
# CORE VISION ENGINE LOGIC
# ==========================================
def fetch_known_customers():
    """Fetches registered customers and their face encodings from the Node backend."""
    try:
        print("[AI Engine] Fetching known customer encodings from database...")
        # UPDATED URL: Points to the new ai-enforce route that includes face encodings
        response = requests.get(f"{NODE_API_URL}/ai-enforce/customers", timeout=10)
        
        if response.status_code == 200:
            customers = response.json().get('data', [])
            known_encodings = []
            known_names = []
            known_ids = []
            
            for customer in customers:
                if 'faceEncoding' in customer and len(customer['faceEncoding']) > 0:
                    # Convert the JSON array of numbers back into a numpy array for OpenCV
                    encoding_array = np.array(customer['faceEncoding'])
                    known_encodings.append(encoding_array)
                    known_names.append(customer['name'])
                    known_ids.append(customer['_id'])
            
            print(f"[AI Engine] Successfully loaded {len(known_names)} customer faces.")
            return known_encodings, known_names, known_ids
        else:
            print(f"[AI Engine Error] Failed to fetch customers. Status: {response.status_code}")
            return [], [], []
            
    except requests.exceptions.RequestException as e:
        print(f"[AI Engine Error] Could not connect to Node backend: {str(e)}")
        return [], [], []

def start_vision_loop():
    """Starts the webcam, detects faces, and alerts the Node backend."""
    known_encodings, known_names, known_ids = fetch_known_customers()
    
    # Dictionary to track the last time we alerted the server for each customer
    last_alert_time = {}

    print("[AI Engine] Starting Webcam...")
    video_capture = cv2.VideoCapture(0)

    if not video_capture.isOpened():
        print("[AI Engine Fatal Error] Could not open webcam.")
        return

    print("[AI Engine] Webcam active. Press 'q' in the video window to quit.")

    while True:
        # Grab a single frame of video
        ret, frame = video_capture.read()
        if not ret:
            print("[AI Engine Error] Failed to grab frame.")
            break

        # Resize frame of video to 1/4 size for faster face recognition processing
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)

        # Convert the image from BGR color (which OpenCV uses) to RGB color (which face_recognition uses)
        rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        
        # Find all the faces and face encodings in the current frame of video
        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

        # Loop through each face found in the frame
        for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
            name = "Unknown Customer"
            customer_id = None
            
            # See if the face is a match for the known face(s)
            if len(known_encodings) > 0:
                face_distances = face_recognition.face_distance(known_encodings, face_encoding)
                best_match_index = np.argmin(face_distances)
                
                # A distance of < 0.6 is generally considered a strict match
                if face_distances[best_match_index] < 0.6:
                    name = known_names[best_match_index]
                    customer_id = known_ids[best_match_index]

            # Scale back up face locations since the frame we detected in was scaled to 1/4 size
            top *= 4
            right *= 4
            bottom *= 4
            left *= 4

            # If we recognized someone, handle the throttling and send an alert
            if customer_id:
                current_time = time.time()
                last_seen = last_alert_time.get(customer_id, 0)

                # Check if 30 seconds have passed since we last alerted for this person
                if (current_time - last_seen) > THROTTLE_SECONDS:
                    print(f"\n[AI Vision] Recognized {name}! Sending alert to Dashboard...")
                    try:
                        # Send a POST request to our Node API
                        requests.post(f"{NODE_API_URL}/scan", json={
                            "customerId": customer_id,
                            "name": name,
                            "timestamp": current_time
                        }, timeout=3)
                        
                        # Update the throttle timer
                        last_alert_time[customer_id] = current_time
                        
                    except requests.exceptions.RequestException:
                        print(f"[AI Vision Error] Dashboard is unreachable. Alert failed.")

                # Draw a green box and label for known customers
                cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
                cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 255, 0), cv2.FILLED)
                cv2.putText(frame, name, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)
            else:
                # Draw a red box for unknown faces
                cv2.rectangle(frame, (left, top), (right, bottom), (0, 0, 255), 2)
                cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 0, 255), cv2.FILLED)
                cv2.putText(frame, name, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)

        # Display the resulting image on the computer screen
        cv2.imshow('AI Khata System - Camera Feed', frame)

        # Hit 'q' on the keyboard to quit!
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Release handle to the webcam
    video_capture.release()
    cv2.destroyAllWindows()
    print("[AI Engine] Vision loop terminated.")

if __name__ == '__main__':
    try:
        # 1. Start the Flask server in a background thread
        flask_thread = threading.Thread(target=run_flask, daemon=True)
        flask_thread.start()
        
        # 2. Start the heavy OpenCV camera loop in the main thread (Required by Windows)
        start_vision_loop()
    except Exception as e:
        print(f"[AI Engine Fatal Error] {str(e)}")