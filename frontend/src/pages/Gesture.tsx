import React, { useRef, useEffect, useState } from 'react';

const Gesture = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ws = useRef<WebSocket | null>(null);
    const [gesture, setGesture] = useState('');
    const [fingerCount, setFingerCount] = useState(0);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    const startRecognition = () => {
        console.log("1. Clicou em Iniciar Reconhecimento.");
        setIsCameraActive(true);
    };

    useEffect(() => {
        let animationFrameId: number;

        if (isCameraActive && videoRef.current && ws.current) {
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            const sendFrame = () => {
                if (!isCameraActive || !videoRef.current || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
                    return; // Stop the loop if camera is off or websocket is closed
                }

                if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = canvas.toDataURL('image/jpeg', 0.8);
                    ws.current.send(JSON.stringify({ image: imageData }));
                }
                animationFrameId = requestAnimationFrame(sendFrame);
            };

            sendFrame(); // Start the loop
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isCameraActive]);

    useEffect(() => {
        if (isCameraActive && videoRef.current) {
            let stream: MediaStream;
            const setupCamera = async () => {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    console.log("2. Permissão da câmera concedida. Stream obtido.");
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error("ERRO ao acessar a câmera: ", err);
                    alert("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
                    setIsCameraActive(false);
                }
            };

            setupCamera();

            return () => {
                // Limpeza quando o componente desmonta ou a câmera é desativada
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            };
        }
    }, [isCameraActive]);

    const handleVideoLoaded = () => {
        console.log("4. Vídeo carregado (onLoadedData). Tentando conectar ao WebSocket.");
        ws.current = new WebSocket('ws://localhost:8000/ws/gestures/');

        ws.current.onopen = () => {
            console.log("5. WebSocket conectado com sucesso.");
            sendFrame(); // Start sending frames
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("7. Mensagem recebida do backend:", data);
            setGesture(data.gesture || '');
            setFingerCount(data.finger_count);
            setProcessedImage(data.image);
        };

        ws.current.onerror = (error) => {
            console.error("ERRO no WebSocket:", error);
        };

        ws.current.onclose = () => {
            console.log("WebSocket desconectado.");
        };
    };

    useEffect(() => {
        return () => {
            ws.current?.close();
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const sendFrame = () => {
        if (videoRef.current && canvasRef.current && ws.current?.readyState === WebSocket.OPEN) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                context.drawImage(videoRef.current, 0, 0, 640, 480);
                const data = canvasRef.current.toDataURL('image/jpeg');
                ws.current.send(JSON.stringify({ image: data }));
                console.log("6. Frame enviado para o backend.");
            }
        }
        // Continue o loop apenas se a câmera estiver ativa
        if (isCameraActive) {
            requestAnimationFrame(sendFrame);
        }
    };

    return (
        <div>
            <h1>Reconhecimento de Gestos</h1>
            <p>Clique no botão para iniciar a câmera e o reconhecimento de gestos.</p>
            
            {!isCameraActive ? (
                <button onClick={startRecognition} className="button">Iniciar Reconhecimento</button>
            ) : (
                <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                    <div>
                        <h2>Câmera Raw (Debug)</h2>
                        <video ref={videoRef} width="640" height="480" autoPlay muted playsInline onLoadedData={handleVideoLoaded} style={{ border: '2px solid blue' }}></video>
                        <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }}></canvas>
                        <h2>Imagem Processada</h2>
                        {processedImage ? 
                            <img src={processedImage} alt="Processed Frame" width="640" height="480" style={{ border: '2px solid green' }}/> : 
                            <div style={{width: 640, height: 480, backgroundColor: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid red'}}>Aguardando processamento...</div>}
                    </div>
                    <div>
                        <h2>Resultado</h2>
                        <p style={{ fontSize: '1.5rem', margin: '5px 0' }}><b>Gesto:</b> {gesture || '---'}</p>
                        <p style={{ fontSize: '1.5rem', margin: '5px 0' }}><b>Dedos:</b> {fingerCount}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gesture;
