import json
import cv2
import numpy as np
import mediapipe as mp
import base64
from channels.generic.websocket import AsyncWebsocketConsumer

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.7)
mp_draw = mp.solutions.drawing_utils

class GestureConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        print("BACKEND: Cliente WebSocket conectado.")

    async def disconnect(self, close_code):
        print(f"BACKEND: Cliente WebSocket desconectado com código: {close_code}")

    async def receive(self, text_data):
        # 1. Decode the image from the frontend
        try:
            text_data_json = json.loads(text_data)
            image_data = text_data_json['image']
            image_data = base64.b64decode(image_data.split(',')[1])
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                print("BACKEND: ERRO, imagem decodificada é Nula. Pulando frame.")
                return # Skip this frame, don't process or send anything

        except Exception as e:
            print(f"BACKEND: ERRO ao decodificar imagem: {e}. Pulando frame.")
            return # Skip this frame

        # 2. Process the valid image for gesture recognition
        gesture = "Nenhum gesto detectado"
        finger_count = 0
        try:
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = hands.process(img_rgb)

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    mp_draw.draw_landmarks(img, hand_landmarks, mp_hands.HAND_CONNECTIONS)
                    landmarks = hand_landmarks.landmark
                    is_thumb_up = landmarks[mp_hands.HandLandmark.THUMB_TIP].x < landmarks[mp_hands.HandLandmark.THUMB_IP].x
                    other_fingers_up = [1 if landmarks[tip].y < landmarks[pip].y else 0 for tip, pip in [(mp_hands.HandLandmark.INDEX_FINGER_TIP, mp_hands.HandLandmark.INDEX_FINGER_PIP), (mp_hands.HandLandmark.MIDDLE_FINGER_TIP, mp_hands.HandLandmark.MIDDLE_FINGER_PIP), (mp_hands.HandLandmark.RING_FINGER_TIP, mp_hands.HandLandmark.RING_FINGER_PIP), (mp_hands.HandLandmark.PINKY_TIP, mp_hands.HandLandmark.PINKY_PIP)]]
                    finger_count = (1 if is_thumb_up else 0) + sum(other_fingers_up)

                    if finger_count == 5: gesture = "Mão Aberta"
                    elif finger_count == 2 and other_fingers_up[0] and other_fingers_up[1]: gesture = "Paz"
                    elif finger_count == 1 and is_thumb_up: gesture = "Polegar para Cima"
                    elif finger_count == 1 and other_fingers_up[0]: gesture = "Apontando"
                    elif finger_count == 0: gesture = "Punho Fechado"
                    else: gesture = f"{finger_count} dedos"
                    cv2.putText(img, gesture, (10, 70), cv2.FONT_HERSHEY_PLAIN, 3, (255, 0, 255), 3)

        except Exception as e:
            print(f"BACKEND: ERRO durante o processamento do gesto: {e}")
            gesture = "Erro no processamento"
            finger_count = 0

        # 3. Always send the (possibly annotated) image back
        try:
            _, buffer = cv2.imencode('.jpg', img)
            processed_image_data = base64.b64encode(buffer).decode('utf-8')
            await self.send(text_data=json.dumps({
                'gesture': gesture,
                'finger_count': finger_count,
                'image': 'data:image/jpeg;base64,' + processed_image_data
            }))
        except Exception as e:
            print(f"BACKEND: ERRO ao codificar ou enviar a imagem: {e}")
