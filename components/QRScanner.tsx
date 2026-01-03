import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
    onScanSuccess: (decodedText: string, decodedResult: any) => void;
    onScanFailure?: (error: any) => void;
    fps?: number;
    qrbox?: number;
}

export const QRScanner: React.FC<QRScannerProps> = ({
    onScanSuccess,
    onScanFailure,
    fps = 10,
    qrbox = 250
}) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Create scanner instance
        // Note: We use a unique element ID to mount the scanner
        const scannerId = "reader";

        // Clear any existing scanner element content if needed (handled by library usually but safe to check)
        if (!scannerRef.current) {
            const scanner = new Html5QrcodeScanner(
                scannerId,
                // fps: fps, qrbox: qrbox,
                // Use precise config to avoid "scan file" vs "scan camera" confusion
                {
                    fps: fps,
                    qrbox: qrbox,
                    rememberLastUsedCamera: true,
                    // supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] 
                },
            /* verbose= */ false
            );

            scanner.render(
                (decodedText, decodedResult) => {
                    // Determine if valid?
                    onScanSuccess(decodedText, decodedResult);
                    // Optional: Stop scanning after one success if desired, but for now we keep it open
                    // scanner.clear(); 
                },
                (errorMessage) => {
                    // console.log("Scan error (normal during scanning): ", errorMessage);
                    if (onScanFailure) {
                        // Only report real errors if needed, usually we ignore "no code found" errors
                    }
                }
            );
            scannerRef.current = scanner;
        }

        // Cleanup function
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
                scannerRef.current = null;
            }
        };
    }, []);

    return (
        <div className="w-full max-w-sm mx-auto overflow-hidden rounded-lg shadow-lg">
            <div id="reader" className="w-full"></div>
            <p className="text-center text-xs text-gray-500 mt-2 p-2">Kamera izni vererek QR kodu okutabilirsiniz.</p>
        </div>
    );
};
