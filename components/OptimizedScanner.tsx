import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { CheckCircle, Book, User, Save, X, RotateCcw, AlertCircle } from 'lucide-react';
import { LibraryService } from '../services/firebaseDatabase';

interface OptimizedScannerProps {
    onComplete: (studentId: string | null, books: string[]) => void;
    onCancel: () => void;
    isReturnOnly?: boolean;
}

type ScanState = 'SCAN_STUDENT' | 'SCAN_BOOKS' | 'SCAN_BOOKS_ONLY';

export const OptimizedScanner: React.FC<OptimizedScannerProps> = ({ onComplete, onCancel, isReturnOnly = false }) => {
    const [scanState, setScanState] = useState<ScanState>(isReturnOnly ? 'SCAN_BOOKS_ONLY' : 'SCAN_STUDENT');
    const [studentId, setStudentId] = useState<string | null>(null);
    const [books, setBooks] = useState<string[]>([]);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScanTimeRef = useRef<number>(0);
    const isScanningRef = useRef<boolean>(false);

    // Audio context for beep sound
    const playBeep = (type: 'success' | 'error' = 'success') => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(type === 'success' ? 880 : 220, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
                audioCtx.close();
            }, type === 'success' ? 150 : 400);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    useEffect(() => {
        const scannerId = "optimized-reader";

        const startScanner = async () => {
            try {
                const html5QrCode = new Html5Qrcode(scannerId);
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        disableFlip: false,
                    },
                    (decodedText, decodedResult) => {
                        handleScan(decodedText);
                    },
                    (errorMessage) => {
                        // ignore errors for continuous scanning
                    }
                );
                isScanningRef.current = true;
            } catch (err) {
                console.error("Error starting scanner", err);
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current && isScanningRef.current) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                }).catch(err => {
                    console.error("Failed to stop scanner", err);
                });
                isScanningRef.current = false;
            }
        };
    }, []); // Only start on mount, handle state logic via refs to avoid restarts

    // We need to access the LATEST state in the callback. 
    // Since the callback is defined once in useEffect, it might capture stale state.
    // Actually, standard functional update or refs should be used.
    // BUT: Html5Qrcode.start is called ONCE. The callback won't update.
    // So we function `handleScan` needs to access refs or we need to manage logic carefully.
    // Let's use a ref for the current state dependencies.

    const stateRef = useRef({ scanState, studentId, books });
    useEffect(() => {
        stateRef.current = { scanState, studentId, books };
    }, [scanState, studentId, books]);

    const handleScan = async (decodedText: string) => {
        const now = Date.now();
        if (now - lastScanTimeRef.current < 1000) {
            return; // 1s delay to prevent double reads
        }

        // LOCK IMMEDIATELY
        lastScanTimeRef.current = now;

        const { scanState, studentId, books } = stateRef.current;

        // Check validation or logic
        if (scanState === 'SCAN_STUDENT') {
            playBeep('success');
            setStudentId(decodedText);
            setScanState('SCAN_BOOKS');
            flashFeedback(decodedText, 'success', 'Öğrenci Tanımlandı');
        } else {
            // Books (SCAN_BOOKS or SCAN_BOOKS_ONLY)
            if (books.includes(decodedText)) return;

            // REAL-TIME VALIDATION
            if (!isReturnOnly) {
                const validation = await LibraryService.checkBookForStudent(decodedText, studentId);
                if (!validation.success) {
                    playBeep('error');
                    flashFeedback(decodedText, 'error', validation.message);
                    return;
                }
            }

            playBeep('success');
            setBooks(prev => [...prev, decodedText]);
            flashFeedback(decodedText, 'success', isReturnOnly ? 'İade Listesine Eklendi' : 'Ödünç Listesine Eklendi');
        }
    };

    const flashFeedback = (text: string, type: 'success' | 'error', message: string) => {
        setLastScanned(text);
        setFeedback({ type, message });
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), type === 'success' ? 1000 : 2000);
    };

    const handleManualStudentInput = () => {
        const code = prompt("Öğrenci Numarası Girin:");
        if (code) handleScan(code);
    };

    const handleManualBookInput = () => {
        const code = prompt("Kitap Barkodu Girin:");
        if (code) handleScan(code);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-4">
            {/* Header / Top Bar */}
            <div className="w-full text-white flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    {scanState === 'SCAN_STUDENT' ? <User className="text-yellow-400" /> : <Book className="text-green-400" />}
                    {scanState === 'SCAN_STUDENT' ? 'Öğrenci Kartını Okutun' : (isReturnOnly ? 'İade Edilecek Kitapları Okutun' : 'Kitapları Okutun')}
                </h2>
                <button onClick={onCancel} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700">
                    <X size={24} />
                </button>
            </div>

            {/* Scanner Viewport */}
            <div className="relative w-full flex-grow flex items-center justify-center bg-black overflow-hidden rounded-xl border-2 border-gray-700">
                <div id="optimized-reader" className="w-full h-full object-cover"></div>

                {/* Overlay Target Box */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className={`w-64 h-64 border-4 rounded-3xl opacity-50 ${scanState === 'SCAN_STUDENT' ? 'border-yellow-400' : 'border-green-400'}`}></div>
                </div>

                {/* Feedback Overlay */}
                {showFeedback && (
                    <div className={`absolute inset-0 z-10 flex items-center justify-center bg-black/70 animated-fade-in`}>
                        <div className={`text-black p-8 rounded-3xl flex flex-col items-center animate-bounce-in shadow-2xl ${feedback?.type === 'success' ? 'bg-white' : 'bg-red-50 border-4 border-red-500'}`}>
                            {feedback?.type === 'success' ? (
                                <CheckCircle size={64} className="text-green-500 mb-4" />
                            ) : (
                                <AlertCircle size={64} className="text-red-500 mb-4 animate-pulse" />
                            )}
                            <p className="text-2xl font-black mb-1">{lastScanned}</p>
                            <p className={`text-lg font-bold ${feedback?.type === 'success' ? 'text-gray-500' : 'text-red-600'}`}>{feedback?.message}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls / Info */}
            <div className="w-full mt-4 space-y-3">

                {/* Status Info */}
                <div className="bg-gray-900 text-white p-4 rounded-xl flex items-center justify-between">
                    {!isReturnOnly && (
                        <>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${studentId ? 'bg-green-600' : 'bg-gray-700'}`}>
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Aktif Öğrenci</p>
                                    <p className="font-mono font-bold">{studentId || 'Bekleniyor...'}</p>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-gray-700"></div>
                        </>
                    )}
                    <div className="flex items-center gap-3 flex-grow justify-center">
                        <div className={`p-2 rounded-lg ${books.length > 0 ? (isReturnOnly ? 'bg-orange-600' : 'bg-blue-600') : 'bg-gray-700'}`}>
                            <Book size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">{isReturnOnly ? 'Toplanacak Kitap' : 'Kitap Sayısı'}</p>
                            <p className="font-mono font-bold text-center">{books.length}</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    {scanState === 'SCAN_BOOKS' && (
                        <button
                            onClick={() => {
                                setScanState('SCAN_STUDENT');
                                setStudentId(null);
                                setBooks([]);
                            }}
                            className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 active:scale-95 transition-transform"
                        >
                            <RotateCcw size={18} />
                            <span>Sıfırla</span>
                        </button>
                    )}

                    <button
                        onClick={() => (isReturnOnly ? books.length > 0 : (studentId && books.length > 0)) ? onComplete(studentId, books) : null}
                        disabled={isReturnOnly ? books.length === 0 : (!studentId || books.length === 0)}
                        className={`col-span-${(scanState === 'SCAN_STUDENT' || isReturnOnly) ? '2' : '1'} flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all ${(isReturnOnly ? books.length > 0 : (studentId && books.length > 0))
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        <Save size={20} />
                        <span>{isReturnOnly ? 'İadeleri Tamamla' : 'Ödünç İşlemini Tamamla'}</span>
                    </button>
                </div>

                {/* Manual Entry Fallback */}
                <div className="flex justify-center gap-4">
                    <button onClick={handleManualStudentInput} className="text-xs text-gray-500 underline">El ile Öğrenci Gir</button>
                    {studentId && <button onClick={handleManualBookInput} className="text-xs text-gray-500 underline">El ile Kitap Gir</button>}
                </div>

            </div>
        </div>
    );
};
