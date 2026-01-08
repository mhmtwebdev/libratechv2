import React, { useEffect, useState } from 'react';
import { LibraryService } from '../services/firebaseDatabase';
import { Users, BookOpen, GraduationCap, ArrowLeftRight, ShieldCheck, Mail, Calendar, Activity, Zap, AlertTriangle, MessageSquare, CheckCircle, Clock, Megaphone, Trash2 } from 'lucide-react';
import { SystemLog, SupportRequest, Announcement } from '../types';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({ totalBooks: 0, totalStudents: 0, totalTransactions: 0, totalTeachers: 0 });
    const [teachers, setTeachers] = useState<any[]>([]);
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [performance, setPerformance] = useState<{ latency: number, status: string }>({ latency: 0, status: 'EXCELLENT' });
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', type: 'INFO' as 'INFO' | 'WARNING' | 'URGENT' });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [s, t, l, sr, p, an] = await Promise.all([
                LibraryService.getGlobalStats(),
                LibraryService.getTeachers(),
                LibraryService.getSystemLogs(),
                LibraryService.getSupportRequests(),
                LibraryService.getSystemPerformance(),
                LibraryService.getAnnouncements(false)
            ]);
            setStats(s);
            setTeachers(t);
            setLogs(l);
            setSupportRequests(sr);
            setPerformance(p);
            setAnnouncements(an);
        } catch (error) {
            console.error("Admin data fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAnnouncement.title || !newAnnouncement.message) return;

        setSubmitting(true);
        const success = await LibraryService.addAnnouncement(newAnnouncement);
        if (success) {
            setNewAnnouncement({ title: '', message: '', type: 'INFO' });
            fetchData();
        }
        setSubmitting(false);
    };

    const handleToggleAnnouncement = async (id: string, currentStatus: boolean) => {
        const success = await LibraryService.updateAnnouncementStatus(id, !currentStatus);
        if (success) fetchData();
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
        <div className="space-y-10 animate-soft-fade pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] text-white shadow-2xl shadow-slate-900/20 border border-slate-700">
                        <ShieldCheck size={40} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tight leading-none">Admin Kontrol Merkezi</h2>
                        <div className="flex items-center gap-3 mt-3">
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Sistem Çevrimiçi
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Son Güncelleme: {new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    className="group bg-white px-8 py-4 rounded-2xl border-2 border-slate-100 hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-100 transition-all font-black text-xs uppercase tracking-widest text-slate-600 flex items-center gap-3 active:scale-95"
                >
                    <Activity size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                    Verileri Tazele
                </button>
            </div>

            {/* Performance & Quick Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[3rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                            <Zap size={24} />
                        </div>
                        <h4 className="text-[10px] font-black text-indigo-100 uppercase tracking-widest opacity-80">Sistem Gecikmesi</h4>
                        <p className="text-4xl font-black mt-2">{performance.latency}ms</p>
                        <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${performance.status === 'EXCELLENT' ? 'bg-emerald-400/20 border-emerald-400/30' : 'bg-amber-400/20 border-amber-400/30'
                            }`}>
                            {performance.status === 'EXCELLENT' ? 'Mükemmel Performans' : 'Normal Gecikme'}
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform" />
                </div>

                <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all">
                    <div className="bg-amber-50 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="mt-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kritik Hatalar</h4>
                        <p className="text-3xl font-black text-slate-900 mt-1">{logs.filter(l => l.type === 'ERROR').length}</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all">
                    <div className="bg-cyan-50 w-12 h-12 rounded-2xl flex items-center justify-center text-cyan-600">
                        <MessageSquare size={24} />
                    </div>
                    <div className="mt-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destek Talepleri</h4>
                        <p className="text-3xl font-black text-slate-900 mt-1">{supportRequests.filter(r => r.status === 'OPEN').length}</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all">
                    <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600">
                        <CheckCircle size={24} />
                    </div>
                    <div className="mt-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Başarı Oranı</h4>
                        <p className="text-3xl font-black text-slate-900 mt-1">%99.9</p>
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Öğretmenler', value: stats.totalTeachers, icon: Users, color: 'text-indigo-600', sub: 'Toplam Kullanıcı' },
                    { label: 'Envanter', value: stats.totalBooks, icon: BookOpen, color: 'text-cyan-600', sub: 'Kayıtlı Kitap' },
                    { label: 'Öğrenciler', value: stats.totalStudents, icon: GraduationCap, color: 'text-emerald-600', sub: 'Kayıtlı Profil' },
                    { label: 'Trafik', value: stats.totalTransactions, icon: ArrowLeftRight, color: 'text-amber-600', sub: 'Ödünç İşlemi' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all border-b-4 border-b-transparent hover:border-b-cyan-500">
                        <div className="flex items-center gap-4">
                            <div className={`${stat.color} p-3 bg-slate-50 rounded-2xl`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</h4>
                                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                                <p className="text-[10px] font-bold text-slate-300 mt-0.5">{stat.sub}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Teachers Table */}
                <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col">
                    <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Users className="text-cyan-600" size={24} />
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Eğitmen Listesi</h3>
                        </div>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-50">
                                {teachers.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-10 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-600 uppercase group-hover:bg-cyan-600 group-hover:text-white transition-all">
                                                    {t.name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{t.name || 'İsimsiz'}</div>
                                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-5 text-right">
                                            <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                {t.role || 'TEACHER'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Logs Section */}
                <div className="bg-slate-900 rounded-[3.5rem] shadow-2xl shadow-slate-900/10 border border-slate-800 overflow-hidden flex flex-col h-[500px]">
                    <div className="px-10 py-8 border-b border-white/5 bg-slate-950 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Activity className="text-amber-500" size={24} />
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Sistem Günlükleri</h3>
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Son 50 İşlem</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-4">
                        {logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-600">
                                <Activity size={48} className="opacity-20 mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">Henüz günlük kaydı yok</p>
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className="p-5 bg-slate-800/50 rounded-2xl border border-white/5 group hover:border-amber-500/30 transition-all cursor-default relative overflow-hidden">
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="flex gap-4">
                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${log.type === 'ERROR' ? 'bg-rose-500 animate-pulse' : 'bg-cyan-500'}`} />
                                            <div>
                                                <p className="text-sm font-bold text-slate-300 leading-snug">{log.message}</p>
                                                <div className="flex items-center gap-3 mt-3">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {new Date(log.timestamp).toLocaleString('tr-TR')}
                                                    </span>
                                                    {log.teacherEmail && (
                                                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">@{log.teacherEmail.split('@')[0]}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[3rem]" />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Support Requests Section */}
            <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="text-indigo-600" size={24} />
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Destek Talepleri</h3>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
                    {supportRequests.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-slate-400">
                            <MessageSquare size={48} className="mx-auto opacity-10 mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest">Yeni destek talebi bulunmuyor</p>
                        </div>
                    ) : (
                        supportRequests.map((request) => (
                            <div key={request.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative group hover:bg-white hover:shadow-2xl transition-all border-b-4 border-b-transparent hover:border-b-indigo-500">
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${request.status === 'OPEN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        {request.status}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">{new Date(request.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h5 className="font-black text-slate-800 text-lg line-clamp-1">{request.subject}</h5>
                                <p className="text-slate-500 text-sm mt-3 line-clamp-3 leading-relaxed font-medium">{request.message}</p>
                                <div className="mt-6 pt-6 border-t border-slate-200/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black">
                                            {request.teacherEmail[0].toUpperCase()}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-[100px]">{request.teacherEmail}</span>
                                    </div>
                                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors">
                                        Yanıtla
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Announcements Management Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Create Announcement Form */}
                <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <Megaphone className="text-rose-600" size={24} />
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Yeni Duyuru Yayınla</h3>
                    </div>

                    <form onSubmit={handleCreateAnnouncement} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-2">Duyuru Başlığı</label>
                            <input
                                type="text"
                                value={newAnnouncement.title}
                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-rose-500 focus:bg-white transition-all outline-none font-bold text-slate-800"
                                placeholder="Örn: Sistem Güncellemesi"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-2">Duyuru Tipi</label>
                            <div className="grid grid-cols-3 gap-3">
                                {(['INFO', 'WARNING', 'URGENT'] as const).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setNewAnnouncement({ ...newAnnouncement, type })}
                                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newAnnouncement.type === type
                                                ? 'border-rose-500 bg-rose-50 text-rose-600'
                                                : 'border-slate-100 bg-white text-slate-400'
                                            }`}
                                    >
                                        {type === 'INFO' ? 'Bilgi' : type === 'WARNING' ? 'Uyarı' : 'Acil'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-2">Mesaj İçeriği</label>
                            <textarea
                                value={newAnnouncement.message}
                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-rose-500 focus:bg-white transition-all outline-none font-bold text-slate-800 min-h-[150px] resize-none"
                                placeholder="Öğretmenlere iletmek istediğiniz mesajı yazın..."
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full py-5 rounded-2xl text-white font-black uppercase tracking-widest transition-all shadow-xl ${submitting ? 'bg-slate-400' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 active:scale-95'
                                }`}
                        >
                            {submitting ? 'Yayınlanıyor...' : 'Duyuruyu Paylaş'}
                        </button>
                    </form>
                </div>

                {/* Active Announcements List */}
                <div className="lg:col-span-2 bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col">
                    <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Megaphone className="text-cyan-600" size={24} />
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Geçmiş Duyurular</h3>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        {announcements.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Megaphone size={48} className="opacity-10 mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">Henüz duyuru yayınlanmadı</p>
                            </div>
                        ) : (
                            announcements.map((ann) => (
                                <div key={ann.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group transition-all relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${ann.type === 'URGENT' ? 'bg-rose-100 text-rose-600' :
                                                        ann.type === 'WARNING' ? 'bg-amber-100 text-amber-600' :
                                                            'bg-cyan-100 text-cyan-600'
                                                    }`}>
                                                    {ann.type === 'URGENT' ? 'Acil' : ann.type === 'WARNING' ? 'Uyarı' : 'Bilgi'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400">{new Date(ann.createdAt).toLocaleString()}</span>
                                            </div>
                                            <h4 className="text-xl font-black text-slate-800">{ann.title}</h4>
                                            <p className="text-slate-500 font-medium text-sm mt-2 leading-relaxed">{ann.message}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleToggleAnnouncement(ann.id, ann.isActive)}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${ann.isActive
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 group/btn'
                                                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'
                                                    }`}
                                            >
                                                {ann.isActive ? 'Yayından Kaldır' : 'Tekrar Yayınla'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-bl-[4rem]" />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
