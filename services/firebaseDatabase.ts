import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    query,
    where,
    Timestamp,
    setDoc,
    getDoc,
    collectionGroup,
    count,
    orderBy,
    limit
} from "firebase/firestore";
import { Book, BookStatus, Student, Transaction, SystemLog, SupportRequest } from '../types';

const firebaseConfig = {
    apiKey: "AIzaSyABqzz-0liy7ouqh90O53YvB6bP4o4DuJI",
    authDomain: "libratechv2.firebaseapp.com",
    projectId: "libratechv2",
    storageBucket: "libratechv2.firebasestorage.app",
    messagingSenderId: "729755713200",
    appId: "1:729755713200:web:a7eec17be1fb7928718575"
};

// Admin Email - Burayı kendi mail adresinizle güncelleyin
export const ADMIN_EMAIL = "mahmutissiz@gmail.com";

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Helper to get collection references scoped to a teacher
// If teacherId is provided (e.g. for ParentView), it uses that.
// Otherwise, it uses the currently logged-in teacher's ID.
export const getRefs = (teacherId?: string) => {
    const uid = teacherId || auth.currentUser?.uid;
    if (!uid) {
        throw new Error("Kullanıcı oturumu veya öğretmen kimliği bulunamadı.");
    }
    return {
        books: collection(db, "users", uid, "books"),
        students: collection(db, "users", uid, "students"),
        transactions: collection(db, "users", uid, "transactions"),
        settings: doc(db, "users", uid, "settings", "global"),
        profile: doc(db, "users", uid)
    };
};

// Converters or Helpers
const mapDoc = <T>(doc: any): T => {
    return { id: doc.id, ...doc.data() } as T;
};

export const LibraryService = {
    // --- Books ---
    getBooks: async (teacherId?: string): Promise<Book[]> => {
        try {
            const refs = getRefs(teacherId);
            const snapshot = await getDocs(refs.books);
            return snapshot.docs.map(doc => mapDoc<Book>(doc));
        } catch (error) {
            console.error("getBooks error:", error);
            return [];
        }
    },

    addBook: async (book: Omit<Book, 'id' | 'status' | 'addedDate'>): Promise<{ success: boolean, message: string }> => {
        try {
            const refs = getRefs();
            // Check duplicate ISBN in user's collection
            const q = query(refs.books, where("isbn", "==", book.isbn));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return { success: false, message: 'Bu ISBN numarasına sahip bir kitap zaten envanterinizde var.' };
            }

            const newBook = {
                ...book,
                status: BookStatus.AVAILABLE,
                addedDate: new Date().toISOString()
            };

            await addDoc(refs.books, newBook);
            return { success: true, message: 'Kitap başarıyla eklendi.' };
        } catch (e: any) {
            return { success: false, message: 'Hata: ' + e.message };
        }
    },

    deleteBook: async (id: string): Promise<void> => {
        const refs = getRefs();
        await deleteDoc(doc(db, refs.books.path, id));
    },

    // --- Students ---
    getStudents: async (teacherId?: string): Promise<Student[]> => {
        try {
            const refs = getRefs(teacherId);
            const snapshot = await getDocs(refs.students);
            return snapshot.docs.map(doc => mapDoc<Student>(doc));
        } catch (error) {
            console.error("getStudents error:", error);
            return [];
        }
    },

    addStudent: async (student: Omit<Student, 'id' | 'readingHistory'>): Promise<{ success: boolean, message: string }> => {
        try {
            const refs = getRefs();
            // Check duplicate Student Number in user's collection
            const q = query(refs.students, where("studentNumber", "==", student.studentNumber));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return { success: false, message: 'Bu numaraya sahip bir öğrenci zaten kayıtlı.' };
            }

            const newStudent = {
                ...student,
                readingHistory: []
            };
            await addDoc(refs.students, newStudent);
            return { success: true, message: 'Öğrenci başarıyla eklendi.' };
        } catch (e: any) {
            return { success: false, message: 'Hata: ' + e.message };
        }
    },

    deleteStudent: async (id: string): Promise<void> => {
        const refs = getRefs();
        await deleteDoc(doc(db, refs.students.path, id));
    },

    // --- Transactions ---
    getActiveTransactions: async (teacherId?: string): Promise<(Transaction & { book: Book, student: Student })[]> => {
        try {
            const refs = getRefs(teacherId);
            const tSnapshot = await getDocs(refs.transactions);
            const transactions = tSnapshot.docs.map(doc => mapDoc<Transaction>(doc));

            const activeTransactions = transactions.filter(t => !t.isReturned);
            if (activeTransactions.length === 0) return [];

            const [books, students] = await Promise.all([
                LibraryService.getBooks(teacherId),
                LibraryService.getStudents(teacherId)
            ]);

            return activeTransactions
                .map(t => {
                    const book = books.find(b => b.id === t.bookId);
                    const student = students.find(s => s.id === t.studentId);
                    if (!book || !student) return null;
                    return { ...t, book, student };
                })
                .filter((t): t is (Transaction & { book: Book, student: Student }) => t !== null);
        } catch (error) {
            console.error("Error fetching transactions:", error);
            return [];
        }
    },

    getAllTransactions: async (teacherId?: string): Promise<(Transaction & { book: Book, student: Student })[]> => {
        try {
            const refs = getRefs(teacherId);
            const tSnapshot = await getDocs(refs.transactions);
            const transactions = tSnapshot.docs.map(doc => mapDoc<Transaction>(doc));

            const [books, students] = await Promise.all([
                LibraryService.getBooks(teacherId),
                LibraryService.getStudents(teacherId)
            ]);

            return transactions
                .map(t => {
                    const book = books.find(b => b.id === t.bookId);
                    const student = students.find(s => s.id === t.studentId);
                    if (!book || !student) return null;
                    return { ...t, book, student };
                })
                .filter((t): t is (Transaction & { book: Book, student: Student }) => t !== null);
        } catch (error) {
            console.error("Error fetching all transactions:", error);
            return [];
        }
    },

    issueBook: async (isbn: string, studentNumber: string, durationDays: number): Promise<{ success: boolean; message: string; warning?: string }> => {
        try {
            const refs = getRefs();
            // 1. Find Book in user's collection
            const bQuery = query(refs.books, where("isbn", "==", isbn));
            const bSnap = await getDocs(bQuery);
            if (bSnap.empty) return { success: false, message: 'Envanterinizde bu ISBN/QR kodu ile kitap bulunamadı.' };
            const bookDoc = bSnap.docs[0];
            const book = mapDoc<Book>(bookDoc);

            // 2. Find Student in user's collection
            const sQuery = query(refs.students, where("studentNumber", "==", studentNumber));
            const sSnap = await getDocs(sQuery);
            if (sSnap.empty) return { success: false, message: 'Bu numara/QR ile kayıtlı öğrenci bulunamadı.' };
            const studentDoc = sSnap.docs[0];
            const student = mapDoc<Student>(studentDoc);

            // 3. Validations
            if (book.status !== BookStatus.AVAILABLE) {
                return { success: false, message: 'Kitap şu anda başkasında ödünçte.' };
            }

            const hasReadBefore = student.readingHistory && student.readingHistory.includes(book.id);
            let warningMsg = undefined;
            if (hasReadBefore) {
                warningMsg = `Dikkat! ${student.name} isimli öğrenci "${book.title}" kitabını daha önce okumuş.`;
            }

            // 4. Create Transaction
            const newTransaction = {
                bookId: book.id,
                studentId: student.id,
                issueDate: new Date().toISOString(),
                dueDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
                isReturned: false
            };
            await addDoc(refs.transactions, newTransaction);

            // 5. Update Book Status
            await updateDoc(doc(db, refs.books.path, book.id), { status: BookStatus.BORROWED });

            // 6. Update Student History
            const currentHistory = student.readingHistory || [];
            await updateDoc(doc(db, refs.students.path, student.id), {
                readingHistory: [...currentHistory, book.id]
            });

            return { success: true, message: 'Kitap başarıyla ödünç verildi.', warning: warningMsg };

        } catch (e: any) {
            return { success: false, message: 'İşlem Başarısız: ' + e.message };
        }
    },

    returnBook: async (isbn: string): Promise<{ success: boolean; message: string }> => {
        try {
            const refs = getRefs();
            // 1. Find Book in user's collection
            const bQuery = query(refs.books, where("isbn", "==", isbn));
            const bSnap = await getDocs(bQuery);
            if (bSnap.empty) return { success: false, message: 'Kitap bulunamadı.' };
            const bookDoc = bSnap.docs[0];
            const book = mapDoc<Book>(bookDoc);

            // 2. Find Active Transaction for this book in user's collection
            const tQuery = query(refs.transactions, where("bookId", "==", book.id), where("isReturned", "==", false));
            const tSnap = await getDocs(tQuery);

            if (tSnap.empty) return { success: false, message: 'Bu kitap şu anda ödünçte görünmüyor.' };
            const tDoc = tSnap.docs[0];

            // 3. Update Transaction
            await updateDoc(doc(db, refs.transactions.path, tDoc.id), {
                isReturned: true,
                returnDate: new Date().toISOString()
            });

            // 4. Update Book
            await updateDoc(doc(db, refs.books.path, book.id), {
                status: BookStatus.AVAILABLE
            });

            return { success: true, message: 'Kitap envantere başarıyla iade edildi.' };
        } catch (e: any) {
            return { success: false, message: 'İade Başarısız: ' + e.message };
        }
    },



    removeBookFromHistory: async (studentId: string, bookId: string): Promise<{ success: boolean; message: string }> => {
        try {
            const refs = getRefs();
            const studentRef = doc(db, refs.students.path, studentId);
            const studentDoc = await getDoc(studentRef);

            if (!studentDoc.exists()) return { success: false, message: 'Öğrenci bulunamadı.' };

            const studentData = studentDoc.data() as Student;
            const updatedHistory = (studentData.readingHistory || []).filter(id => id !== bookId);

            await updateDoc(studentRef, { readingHistory: updatedHistory });
            return { success: true, message: 'Kitap geçmişten silindi.' };
        } catch (e: any) {
            return { success: false, message: 'Hata: ' + e.message };
        }
    },

    checkBookForStudent: async (isbn: string, studentNumber: string | null): Promise<{ success: boolean; message: string; type: 'VALID' | 'ALREADY_READ' | 'NOT_AVAILABLE' | 'NOT_FOUND' }> => {
        try {
            const refs = getRefs();
            const bQuery = query(refs.books, where("isbn", "==", isbn));
            const bSnap = await getDocs(bQuery);
            if (bSnap.empty) return { success: false, message: 'Kitap bulunamadı.', type: 'NOT_FOUND' };
            const book = mapDoc<Book>(bSnap.docs[0]);

            if (book.status !== BookStatus.AVAILABLE) {
                return { success: false, message: 'Kitap şu anda ödünçte.', type: 'NOT_AVAILABLE' };
            }

            if (studentNumber) {
                const sQuery = query(refs.students, where("studentNumber", "==", studentNumber));
                const sSnap = await getDocs(sQuery);
                if (!sSnap.empty) {
                    const student = mapDoc<Student>(sSnap.docs[0]);
                    if (student.readingHistory && student.readingHistory.includes(book.id)) {
                        return { success: false, message: 'Bu öğrenci bu kitabı daha önce okumuş!', type: 'ALREADY_READ' };
                    }
                }
            }

            return { success: true, message: 'Uygun', type: 'VALID' };
        } catch (e) {
            return { success: false, message: 'Hata oluştu.', type: 'NOT_FOUND' };
        }
    },

    // --- Settings ---
    getSettings: async (teacherId?: string) => {
        try {
            const refs = getRefs(teacherId);
            const settingsDoc = await getDoc(refs.settings);
            if (settingsDoc.exists()) {
                return settingsDoc.data();
            }
            return { parentViewPrivate: true }; // Varsayılan: Gizli
        } catch (error) {
            console.error("Settings fetch error:", error);
            return { parentViewPrivate: true };
        }
    },

    updateSettings: async (settings: { parentViewPrivate: boolean }) => {
        try {
            const refs = getRefs();
            await setDoc(refs.settings, settings);
            return true;
        } catch (error) {
            console.error("Settings update error:", error);
            return false;
        }
    },

    // --- Admin / Global Stats ---
    getUserRole: async (uid: string): Promise<'ADMIN' | 'TEACHER'> => {
        try {
            // Priority: Hardcoded Admin Email check
            const email = auth.currentUser?.email;
            if (email === ADMIN_EMAIL) return 'ADMIN';

            // Fallback: Check Firestore document
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                return userDoc.data().role || 'TEACHER';
            }
            return 'TEACHER';
        } catch {
            return 'TEACHER';
        }
    },

    syncUserProfile: async (uid: string, data: { name: string, email: string }) => {
        try {
            const userRef = doc(db, "users", uid);
            const userDoc = await getDoc(userRef);

            // Determine correct role based on email
            const role = data.email === ADMIN_EMAIL ? 'ADMIN' : 'TEACHER';

            if (!userDoc.exists()) {
                await setDoc(userRef, {
                    ...data,
                    role: role,
                    createdAt: new Date().toISOString()
                });
            } else {
                // If user exists but role is wrong (e.g. became admin later), update it
                if (userDoc.data().role !== role) {
                    await updateDoc(userRef, { role: role });
                }
            }
        } catch (error) {
            console.error("Sync profile error:", error);
        }
    },

    getGlobalStats: async () => {
        try {
            const booksSnap = await getDocs(collectionGroup(db, "books"));
            const studentsSnap = await getDocs(collectionGroup(db, "students"));
            const transactionsSnap = await getDocs(collectionGroup(db, "transactions"));
            const usersSnap = await getDocs(collection(db, "users"));

            return {
                totalBooks: booksSnap.size,
                totalStudents: studentsSnap.size,
                totalTransactions: transactionsSnap.size,
                totalTeachers: usersSnap.size
            };
        } catch (error) {
            console.error("Global stats error:", error);
            return { totalBooks: 0, totalStudents: 0, totalTransactions: 0, totalTeachers: 0 };
        }
    },

    getTeachers: async (): Promise<any[]> => {
        try {
            const snapshot = await getDocs(collection(db, "users"));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("getTeachers error:", error);
            return [];
        }
    },

    // --- Technical Health & Support ---
    addLog: async (log: Omit<SystemLog, 'id' | 'timestamp'>) => {
        try {
            await addDoc(collection(db, "system_logs"), {
                ...log,
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.error("LOG ERROR:", e);
        }
    },

    getSystemLogs: async (): Promise<SystemLog[]> => {
        try {
            const q = query(
                collection(db, "system_logs"),
                orderBy("timestamp", "desc"),
                limit(50)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => mapDoc<SystemLog>(doc));
        } catch (error) {
            console.error("getSystemLogs error:", error);
            return [];
        }
    },

    getSupportRequests: async (): Promise<SupportRequest[]> => {
        try {
            const q = query(
                collection(db, "support_requests"),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => mapDoc<SupportRequest>(doc));
        } catch (error) {
            console.error("getSupportRequests error:", error);
            return [];
        }
    },

    getSystemPerformance: async (): Promise<{ latency: number, status: 'EXCELLENT' | 'GOOD' | 'SLOW' }> => {
        const start = performance.now();
        try {
            // Küçük bir sorgu ile gecikme ölçümü
            await getDocs(query(collection(db, "users"), limit(1)));
            const latency = Math.round(performance.now() - start);

            let status: 'EXCELLENT' | 'GOOD' | 'SLOW' = 'EXCELLENT';
            if (latency > 500) status = 'SLOW';
            else if (latency > 200) status = 'GOOD';

            return { latency, status };
        } catch {
            return { latency: 0, status: 'SLOW' };
        }
    }
};
