import React, { useEffect, useState } from 'react';
import { LibraryService } from '../services/firebaseDatabase';
import { Users, BookOpen, GraduationCap, ArrowLeftRight, ShieldCheck, Mail, Calendar } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({ totalBooks: 0, totalStudents: 0, totalTransactions: 0, totalTeachers: 0 });
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [s, t] = await Promise.all([
                LibraryService.getGlobalStats(),
                LibraryService.getTeachers()
            ]);
            setStats(s);
            setTeachers(t);
        } catch (error) {
            console.error("Admin data fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mb-4"></div>
                <p className="font-bold uppercase tracking-widest text-xs">Sistem Verileri Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-soft-fade">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-cyan-600 rounded-2xl text-white shadow-lg shadow-cyan-600/20">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">Admin Kontrol Merkezi</h2>
                        <p className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.2em] mt-2">Tüm Kütüphaneler Genel Bakış</p>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    className="bg-white px-6 py-2.5 rounded-xl border-2 border-slate-100 hover:border-cyan-500 hover:text-cyan-600 transition-all font-black text-xs uppercase tracking-widest text-slate-400"
                >
                    Verileri Tazele
                </button>
            </div>

            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Toplam Öğretmen', value: stats.totalTeachers, icon: Users, color: 'bg-indigo-50 text-indigo-600' },
                    { label: 'Toplam Kitap', value: stats.totalBooks, icon: BookOpen, color: 'bg-cyan-50 text-cyan-600' },
                    { label: 'Toplam Öğrenci', value: stats.totalStudents, icon: GraduationCap, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Ödünç İşlemleri', value: stats.totalTransactions, icon: ArrowLeftRight, color: 'bg-amber-50 text-amber-600' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className={`${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <stat.icon size={28} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</h4>
                                <p className="text-4xl font-black text-slate-900 mt-2">{stat.value}</p>
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-slate-50 rounded-full opacity-50 blur-2xl group-hover:scale-150 transition-transform" />
                    </div>
                ))}
            </div>

            {/* Teacher List Table */}
            <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Kayıtlı Öğretmenler</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sistemi Kullanan Eğitimciler</p>
                    </div>
                    <span className="bg-white px-4 py-2 rounded-full border border-slate-200 text-xs font-black text-slate-500">
                        {teachers.length} KULLANICI
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/30">
                                <th className="px-10 py-5">Kullanıcı Bilgisi</th>
                                <th className="px-10 py-5">Rol / Yetki</th>
                                <th className="px-10 py-5 text-right">Kayıt Tarihi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {teachers.map((teacher) => (
                                <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                {teacher.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-lg leading-none">{teacher.name || 'İsimsiz Kullanıcı'}</div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1.5">
                                                    <Mail size={12} />
                                                    {teacher.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${teacher.role === 'ADMIN'
                                                ? 'bg-rose-100 text-rose-600 border border-rose-200'
                                                : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${teacher.role === 'ADMIN' ? 'bg-rose-600' : 'bg-emerald-600'} animate-pulse`} />
                                            {teacher.role}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 text-xs font-bold text-slate-500">
                                            <Calendar size={14} className="text-slate-300" />
                                            {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString('tr-TR') : '---'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
