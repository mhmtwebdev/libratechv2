import { initializeApp } from "firebase/app";
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
    Timestamp
} from "firebase/firestore";
import { Book, BookStatus, Student, Transaction } from '../types';

// Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBwlK6cJQdiBuxSzKCeV25VzWtsYD6Wd1I",
    authDomain: "libratech-db.firebaseapp.com",
    projectId: "libratech-db",
    storageBucket: "libratech-db.firebasestorage.app",
    messagingSenderId: "766487965530",
    appId: "1:766487965530:web:34ab9cc14f5ff6296e0d63"
};

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection Refs
const booksRef = collection(db, "books");
const studentsRef = collection(db, "students");
const transactionsRef = collection(db, "transactions");

// Converters or Helpers
const mapDoc = <T>(doc: any): T => {
    return { id: doc.id, ...doc.data() } as T;
};

export const LibraryService = {
    // --- Books ---
    getBooks: async (): Promise<Book[]> => {
        const snapshot = await getDocs(booksRef);
        return snapshot.docs.map(doc => mapDoc<Book>(doc));
    },

    addBook: async (book: Omit<Book, 'id' | 'status' | 'addedDate'>): Promise<{ success: boolean, message: string }> => {
        try {
            // Check duplicate ISBN
            const q = query(booksRef, where("isbn", "==", book.isbn));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return { success: false, message: 'Bu ISBN numarasına sahip bir kitap zaten var.' };
            }

            const newBook = {
                ...book,
                status: BookStatus.AVAILABLE,
                addedDate: new Date().toISOString()
            };

            await addDoc(booksRef, newBook);
            return { success: true, message: 'Kitap başarıyla eklendi.' };
        } catch (e: any) {
            return { success: false, message: 'Hata: ' + e.message };
        }
    },

    deleteBook: async (id: string): Promise<void> => {
        await deleteDoc(doc(db, "books", id));
    },

    // --- Students ---
    getStudents: async (): Promise<Student[]> => {
        const snapshot = await getDocs(studentsRef);
        return snapshot.docs.map(doc => mapDoc<Student>(doc));
    },

    addStudent: async (student: Omit<Student, 'id' | 'readingHistory'>): Promise<{ success: boolean, message: string }> => {
        try {
            // Check duplicate Student Number
            const q = query(studentsRef, where("studentNumber", "==", student.studentNumber));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return { success: false, message: 'Bu numaraya sahip bir öğrenci zaten kayıtlı.' };
            }

            const newStudent = {
                ...student,
                readingHistory: []
            };
            await addDoc(studentsRef, newStudent);
            return { success: true, message: 'Öğrenci başarıyla eklendi.' };
        } catch (e: any) {
            return { success: false, message: 'Hata: ' + e.message };
        }
    },

    deleteStudent: async (id: string): Promise<void> => {
        await deleteDoc(doc(db, "students", id));
    },

    // --- Transactions ---
    getActiveTransactions: async (): Promise<(Transaction & { book: Book, student: Student })[]> => {
        // In a real app, filtering in memory is okay for small datasets, 
        // but ideally we query where('isReturned', '==', false)
        // However, we need to join data which Firestore doesn't do natively.

        const tSnapshot = await getDocs(transactionsRef);
        const transactions = tSnapshot.docs.map(doc => mapDoc<Transaction>(doc));

        const activeTransactions = transactions.filter(t => !t.isReturned);
        if (activeTransactions.length === 0) return [];

        // Fetch all books and students to join (Optimization: could fetch only needed IDs)
        // For this size app, fetching all is fine.
        const [books, students] = await Promise.all([
            LibraryService.getBooks(),
            LibraryService.getStudents()
        ]);

        return activeTransactions
            .map(t => {
                const book = books.find(b => b.id === t.bookId);
                const student = students.find(s => s.id === t.studentId);
                if (!book || !student) return null;
                return { ...t, book, student };
            })
            .filter((t): t is (Transaction & { book: Book, student: Student }) => t !== null);
    },

    issueBook: async (isbn: string, studentNumber: string, durationDays: number): Promise<{ success: boolean; message: string; warning?: string }> => {
        try {
            // 1. Find Book
            const bQuery = query(booksRef, where("isbn", "==", isbn));
            const bSnap = await getDocs(bQuery);
            if (bSnap.empty) return { success: false, message: 'Bu ISBN/QR kodu ile kitap bulunamadı.' };
            const bookDoc = bSnap.docs[0];
            const book = mapDoc<Book>(bookDoc);

            // 2. Find Student
            const sQuery = query(studentsRef, where("studentNumber", "==", studentNumber));
            const sSnap = await getDocs(sQuery);
            if (sSnap.empty) return { success: false, message: 'Bu numara/QR ile öğrenci bulunamadı.' };
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
            await addDoc(transactionsRef, newTransaction);

            // 5. Update Book Status
            await updateDoc(doc(db, "books", book.id), { status: BookStatus.BORROWED });

            // 6. Update Student History
            const currentHistory = student.readingHistory || [];
            await updateDoc(doc(db, "students", student.id), {
                readingHistory: [...currentHistory, book.id]
            });

            return { success: true, message: 'Kitap başarıyla ödünç verildi.', warning: warningMsg };

        } catch (e: any) {
            return { success: false, message: 'İşlem Başarısız: ' + e.message };
        }
    },

    returnBook: async (isbn: string): Promise<{ success: boolean; message: string }> => {
        try {
            // 1. Find Book
            const bQuery = query(booksRef, where("isbn", "==", isbn));
            const bSnap = await getDocs(bQuery);
            if (bSnap.empty) return { success: false, message: 'Kitap bulunamadı.' };
            const bookDoc = bSnap.docs[0];
            const book = mapDoc<Book>(bookDoc);

            // 2. Find Active Transaction for this book
            // Note: In a robust app we query Firestore. Here we scan to find it.
            const tQuery = query(transactionsRef, where("bookId", "==", book.id), where("isReturned", "==", false));
            const tSnap = await getDocs(tQuery);

            if (tSnap.empty) return { success: false, message: 'Bu kitap şu anda ödünçte görünmüyor.' };
            const tDoc = tSnap.docs[0];

            // 3. Update Transaction
            await updateDoc(doc(db, "transactions", tDoc.id), {
                isReturned: true,
                returnDate: new Date().toISOString()
            });

            // 4. Update Book
            await updateDoc(doc(db, "books", book.id), {
                status: BookStatus.AVAILABLE
            });

            return { success: true, message: 'Kitap envantere başarıyla iade edildi.' };
        } catch (e: any) {
            return { success: false, message: 'İade Başarısız: ' + e.message };
        }
    },

    resetDatabase: async () => {
        console.warn("Reset Database functionality is disabled in Remote DB mode for safety.");
        alert("Bulut veritabanında toplu silme işlemi güvenlik nedeniyle devre dışı bırakılmıştır. Verileri manuel siliniz.");
    },

    removeBookFromHistory: async (studentId: string, bookId: string): Promise<{ success: boolean; message: string }> => {
        try {
            const studentRef = doc(db, "students", studentId);
            const snapshot = await getDocs(query(studentsRef)); // Simplified, ideally we fetch by ID directly
            const studentDoc = snapshot.docs.find(d => d.id === studentId);

            if (!studentDoc) return { success: false, message: 'Öğrenci bulunamadı.' };

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
            const bQuery = query(booksRef, where("isbn", "==", isbn));
            const bSnap = await getDocs(bQuery);
            if (bSnap.empty) return { success: false, message: 'Kitap bulunamadı.', type: 'NOT_FOUND' };
            const book = mapDoc<Book>(bSnap.docs[0]);

            if (book.status !== BookStatus.AVAILABLE) {
                return { success: false, message: 'Kitap şu anda ödünçte.', type: 'NOT_AVAILABLE' };
            }

            if (studentNumber) {
                const sQuery = query(studentsRef, where("studentNumber", "==", studentNumber));
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
    }
};
