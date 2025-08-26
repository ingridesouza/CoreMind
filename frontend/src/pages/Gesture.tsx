import React, { useRef, useEffect, useState } from 'react';

const Gesture = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ws = useRef<WebSocket | null>(null);
    const [gesture, setGesture] = useState('');
    const [fingerCount, setFingerCount] = useState(0);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    // Inicia o processo de reconhecimento
    const startRecognition = async () => {
        console.log("1. Clicou em Iniciar Reconhecimento.");
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                console.log("2. Permissão da câmera concedida.");
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("ERRO ao acessar a câmera: ", err);
                alert("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
            }
        } else {
            alert("Seu navegador não suporta acesso à câmera.");
        }
    };

    const handleCanPlay = () => {
        console.log("3. Vídeo pronto para reprodução (onCanPlay).");
        videoRef.current?.play().catch(err => {
            console.error("Erro ao tentar reproduzir o vídeo:", err);
            alert("Não foi possível iniciar a exibição da câmera.");
        });
        setIsCameraActive(true);
    };

    // Efeito para conectar ao WebSocket e enviar frames quando a câmera está ativa
    useEffect(() => {
        if (!isCameraActive || !videoRef.current) return;

        console.log("3. Câmera ativa, preparando para conectar ao WebSocket.");
        ws.current = new WebSocket('ws://localhost:8000/ws/gestures/');

        ws.current.onopen = () => {
            console.log("4. WebSocket conectado. Iniciando envio de frames.");
            sendFrameLoop(); // Inicia o loop de envio de frames
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
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

        const sendFrameLoop = () => {
            if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !videoRef.current) {
                console.log("Parando loop de envio de frames.");
                return;
            }

            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
                const context = canvas.getContext('2d');
                if (context) {
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = canvas.toDataURL('image/jpeg', 0.8);
                    ws.current.send(JSON.stringify({ image: imageData }));
                }
            }
            requestAnimationFrame(sendFrameLoop); // Continua o loop
        };

        // Função de limpeza para o useEffect
        return () => {
            console.log("Limpando: fechando WebSocket e parando câmera.");
            ws.current?.close();
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        };
    }, [isCameraActive]);

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
                        <video ref={videoRef} width="640" height="480" autoPlay muted playsInline onCanPlay={handleCanPlay} style={{ border: '2px solid blue' }}></video>
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
