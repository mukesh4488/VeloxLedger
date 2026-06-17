# /ai_engine/register_face.py
import cv2
import face_recognition
import requests
import sys
import os

NODE_API_URL = "http://localhost:5000/api"

def process_and_upload(name, phone, email, image_path=None, frame=None):
    """Handles the heavy lifting of face encoding for both webcam and file uploads."""
    print("\n[Processing] Analyzing face geometry...")
    
    # 1. Load the image properly based on the source
    if image_path:
        # Load from an image file
        if not os.path.exists(image_path):
            print(f"[Error] File not found at: {image_path}")
            return False
        rgb_frame = face_recognition.load_image_file(image_path)
    else:
        # Convert BGR (OpenCV Live Webcam) to RGB (face_recognition)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
    # 2. Locate faces
    face_locations = face_recognition.face_locations(rgb_frame)

    if len(face_locations) == 0:
        print("[Warning] No face detected! Please ensure the image is clear and well-lit.")
        return False
    elif len(face_locations) > 1:
        print("[Warning] Multiple faces detected! Please ensure only ONE person is in the frame.")
        return False

    # 3. Extract the 128-d face encoding
    face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
    encoding_list = face_encodings[0].tolist()

    # 4. Send to Node.js Backend
    print("[Network] Sending profile to MongoDB Atlas...")
    payload = {
        "name": name,
        "phone": phone,
        "email": email,
        "faceEncoding": encoding_list
    }

    try:
        res = requests.post(f"{NODE_API_URL}/customers", json=payload, timeout=10)
        if res.status_code == 201:
            print(f"\n[SUCCESS] Profile for {name} created successfully!")
            return True
        else:
            print(f"\n[Server Error] Failed to save: {res.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"\n[Connection Error] Could not connect to Node backend: {str(e)}")
        return False

def register_via_webcam(name, phone, email):
    print("\n[Camera] Turning on webcam...")
    print("[Camera] Look straight at the camera and press the 'c' key to capture.")
    print("[Camera] Press 'q' if you want to cancel.")

    video_capture = cv2.VideoCapture(0)

    if not video_capture.isOpened():
        print("[Fatal Error] Could not open webcam.")
        return

    while True:
        ret, frame = video_capture.read()
        if not ret:
            print("[Error] Failed to grab frame.")
            break

        cv2.putText(frame, "Press 'C' to Capture", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.imshow('Khata Registration', frame)

        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('c'):
            success = process_and_upload(name, phone, email, frame=frame)
            if success:
                break
        elif key == ord('q'):
            print("\n[Registration Cancelled]")
            break

    video_capture.release()
    cv2.destroyAllWindows()

def register_via_file(name, phone, email):
    print("\n[Manual Upload] Enter the full path to the image file.")
    print(r"Example: C:\Users\Asus\Desktop\photo.jpg")
    
    file_path = input("File Path: ").strip()
    
    # Pro-tip: If you drag and drop a file into the terminal, it sometimes adds quote marks.
    # This safely removes them so the file path reads correctly.
    if file_path.startswith('"') and file_path.endswith('"'):
        file_path = file_path[1:-1]
    elif file_path.startswith("'") and file_path.endswith("'"):
        file_path = file_path[1:-1]
        
    process_and_upload(name, phone, email, image_path=file_path)

def register_customer():
    print("\n=========================================")
    print("      AI KHATA - FACE REGISTRATION       ")
    print("=========================================\n")
    
    name = input("Enter Customer Name: ")
    phone = input("Enter Phone Number: ")
    email = input("Enter Email Address: ")

    print("\nHow would you like to provide the face photo?")
    print("1. Use Live Webcam")
    print("2. Upload an Image File (High Quality)")
    
    choice = input("\nEnter 1 or 2: ")
    
    if choice == '1':
        register_via_webcam(name, phone, email)
    elif choice == '2':
        register_via_file(name, phone, email)
    else:
        print("[Error] Invalid choice.")

if __name__ == "__main__":
    register_customer()