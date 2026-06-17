# camera-module/register_face.py
import cv2
import os

KNOWN_FACES_DIR = "known_faces"
if not os.path.exists(KNOWN_FACES_DIR):
    os.makedirs(KNOWN_FACES_DIR)

# Get the customer's name
name = input("Enter the name of the person you are registering (e.g., Mukesh): ")
print(f"📸 Get ready {name}! Look at the camera and slowly move your head around slightly.")
print("Starting in 3 seconds...")
cv2.waitKey(3000)

video_capture = cv2.VideoCapture(0)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

count = 0
MAX_PHOTOS = 50  # Take 50 pictures for a highly accurate AI model

while True:
    ret, frame = video_capture.read()
    if not ret: break
    
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(60, 60))
    
    for (x, y, w, h) in faces:
        count += 1
        # Crop the face and save it
        face_img = frame[y:y+h, x:x+w]
        file_path = os.path.join(KNOWN_FACES_DIR, f"{name}_{count}.jpg")
        cv2.imwrite(file_path, face_img)
        
        # Draw a box so you know it's working
        cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
        cv2.putText(frame, f"Captured: {count}/{MAX_PHOTOS}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    cv2.imshow('Face Registration', frame)
    
    # Stop automatically when we hit 50 photos
    if count >= MAX_PHOTOS:
        break
        
    if cv2.waitKey(100) & 0xFF == ord('q'):
        break

video_capture.release()
cv2.destroyAllWindows()
print(f"✅ Successfully registered {MAX_PHOTOS} face profiles for {name}!")