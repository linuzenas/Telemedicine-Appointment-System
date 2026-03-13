import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useStore } from '../../store/useStore';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Star Rating Display Component
const Stars = ({ count, size = 'text-sm' }) => (
    <span className={size}>{'★'.repeat(count)}{'☆'.repeat(5 - count)}</span>
);

// Health Tips Data
const healthTips = [
    { icon: '💧', title: 'Stay Hydrated', desc: 'Drink 8-10 glasses of water daily, especially in hot weather.' },
    { icon: '🧼', title: 'Wash Hands', desc: 'Wash your hands regularly with soap and water for at least 20 seconds.' },
    { icon: '🥗', title: 'Eat Fresh Vegetables', desc: 'Include green vegetables and seasonal fruits in your daily diet.' },
    { icon: '🚶', title: 'Stay Active', desc: 'Walk for at least 30 minutes daily to keep your body fit.' },
    { icon: '😴', title: 'Sleep Well', desc: 'Get 7-8 hours of quality sleep every night for good health.' },
    { icon: '🦟', title: 'Prevent Mosquito Bites', desc: 'Use mosquito nets and avoid stagnant water to prevent dengue & malaria.' },
];

const PatientDashboard = () => {
    const { token, user, setUser } = useStore();
    const { t } = useLanguage();
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingData, setBookingData] = useState({});
    const [viewingPrescription, setViewingPrescription] = useState(null);
    const [symptomsInput, setSymptomsInput] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [specialtyFilter, setSpecialtyFilter] = useState('');
    const [ratingModal, setRatingModal] = useState(null); // { appointmentId, doctorId }
    const [ratingValue, setRatingValue] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [doctorRatings, setDoctorRatings] = useState({}); // doctorId -> { avg, count }
    const [ratedAppointments, setRatedAppointments] = useState(new Set());
    const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' | 'appointments' | 'history' | 'health' | 'profile'
    const [profileData, setProfileData] = useState({
        age: user?.age || '', gender: user?.gender || '', bloodGroup: user?.bloodGroup || '',
        weight: user?.weight || '', height: user?.height || '', allergies: user?.allergies || '',
        chronicConditions: user?.chronicConditions || '', emergencyContact: user?.emergencyContact || ''
    });

    const fetchData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [docsRes, appRes] = await Promise.all([
                axios.get('/api/doctors', config),
                axios.get('/api/appointments/myappointments', config)
            ]);
            setDoctors(docsRes.data);
            setAppointments(appRes.data);

            // Fetch ratings for each doctor
            const ratingsMap = {};
            for (const doc of docsRes.data) {
                try {
                    const { data } = await axios.get(`/api/ratings/doctor/${doc._id}`);
                    ratingsMap[doc._id] = { avg: data.averageRating, count: data.totalReviews };
                } catch { ratingsMap[doc._id] = { avg: 0, count: 0 }; }
            }
            setDoctorRatings(ratingsMap);

            // Check which completed appointments are already rated
            const rated = new Set();
            for (const app of appRes.data.filter(a => a.status === 'completed')) {
                try {
                    const { data } = await axios.get(`/api/ratings/appointment/${app._id}`, config);
                    if (data) rated.add(app._id);
                } catch { }
            }
            setRatedAppointments(rated);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    const handleBook = async (doctorId) => {
        const date = bookingData[doctorId]?.date;
        const timeSlot = bookingData[doctorId]?.time;
        const symptoms = symptomsInput[doctorId] || '';
        if (!date || !timeSlot) { toast.error('Please select both a date and time.'); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('/api/appointments', { doctorId, date, timeSlot, symptoms }, config);
            toast.success('Appointment booked successfully!');
            fetchData();
            setBookingData(prev => ({ ...prev, [doctorId]: { date: '', time: '' } }));
            setSymptomsInput(prev => ({ ...prev, [doctorId]: '' }));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to book appointment');
        }
    };

    const handleViewPrescription = async (appointmentId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`/api/prescriptions/appointment/${appointmentId}`, config);
            setViewingPrescription(data);
        } catch { toast.error('No prescription available yet.'); }
    };

    const handleCancel = async (appointmentId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`/api/appointments/${appointmentId}/status`, { status: 'cancelled' }, config);
            toast.success('Appointment cancelled.');
            fetchData();
        } catch { toast.error('Failed to cancel.'); }
    };

    const handleSubmitRating = async () => {
        if (!ratingModal) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('/api/ratings', {
                appointmentId: ratingModal.appointmentId,
                doctorId: ratingModal.doctorId,
                rating: ratingValue,
                review: reviewText,
            }, config);
            toast.success('Thank you for your feedback!');
            setRatingModal(null);
            setRatingValue(5);
            setReviewText('');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit rating.');
        }
    };

    const handleSaveProfile = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.put('/api/users/profile', profileData, config);
            setUser({ ...user, ...data }); // Update store
            toast.success(t('profileSaved'));
        } catch (err) {
            toast.error('Failed to save profile');
        }
    };

    const downloadPrescriptionPDF = () => {
        if (!viewingPrescription) return;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(14, 165, 233); // Primary color
        doc.text(t('appName'), 105, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Medical Prescription', 105, 30, { align: 'center' });

        // Details
        doc.setFontSize(11);
        doc.text(`Doctor: ${viewingPrescription.doctor?.user?.name || 'N/A'}`, 14, 45);
        doc.text(`Patient: ${user.name}`, 14, 52);
        doc.text(`Date: ${new Date(viewingPrescription.createdAt).toLocaleDateString()}`, 14, 59);

        // Medications Table
        const tableData = viewingPrescription.medications.map(m => [m.name, m.dosage, m.frequency]);
        doc.autoTable({
            startY: 70,
            head: [['Medicine', 'Dosage', 'Frequency']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [14, 165, 233] }
        });

        // Notes
        if (viewingPrescription.notes) {
            const finalY = doc.lastAutoTable.finalY || 70;
            doc.text("Doctor's Notes:", 14, finalY + 15);
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(viewingPrescription.notes, 14, finalY + 22, { maxWidth: 180 });
        }

        doc.save(`Prescription_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Filter doctors
    const specialties = [...new Set(doctors.map(d => d.specialty))];
    const filteredDoctors = doctors.filter(doc => {
        const nameMatch = doc.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const specMatch = !specialtyFilter || doc.specialty === specialtyFilter;
        return nameMatch && specMatch;
    });

    const scheduledApps = appointments.filter(a => a.status === 'scheduled');
    const completedApps = appointments.filter(a => a.status === 'completed');
    const cancelledApps = appointments.filter(a => a.status === 'cancelled');

    if (loading) return <div className="p-8 text-center text-lg">Loading Dashboard...</div>;

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 rounded-xl shadow text-white">
                <h2 className="text-2xl font-bold mb-1">{t('welcome')}, {user?.name}</h2>
                <p className="opacity-90">{t('yourHealth')}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{scheduledApps.length} {t('upcoming')}</span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{completedApps.length} {t('completed')}</span>
                </div>
            </div>

            {/* Emergency Helpline Banner */}
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">🚑</span>
                    <div>
                        <p className="font-bold text-red-800">{t('emergencyHelpline')}</p>
                        <p className="text-sm text-red-600">{t('emergencyDesc')}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <a href="tel:108" className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition">{t('ambulance')}</a>
                    <a href="tel:112" className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-600 transition">{t('emergency')}</a>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow p-1 flex gap-1 overflow-x-auto">
                {[
                    { id: 'doctors', label: t('findDoctors'), count: filteredDoctors.length },
                    { id: 'appointments', label: t('myAppointments'), count: scheduledApps.length },
                    { id: 'history', label: t('medicalHistory'), count: completedApps.length },
                    { id: 'health', label: t('healthTips') },
                    { id: 'profile', label: `👤 ${t('myProfile')}` },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition ${activeTab === tab.id
                            ? 'bg-primary-600 text-white shadow'
                            : 'text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        {tab.label} {tab.count !== undefined && <span className="ml-1 opacity-70">({tab.count})</span>}
                    </button>
                ))}
            </div>

            {/* TAB: Find Doctors */}
            {activeTab === 'doctors' && (
                <div className="bg-white p-6 rounded-xl shadow">
                    <div className="flex flex-col sm:flex-row gap-3 mb-5">
                        <input
                            type="text"
                            placeholder={t('searchDoctor')}
                            className="border rounded-lg p-2.5 flex-1 text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="border rounded-lg p-2.5 text-sm min-w-[180px]"
                            value={specialtyFilter}
                            onChange={e => setSpecialtyFilter(e.target.value)}
                        >
                            <option value="">{t('allSpecialties')}</option>
                            {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {filteredDoctors.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400 text-lg">{t('noDoctorsFound')}</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {filteredDoctors.map(doc => (
                                <div key={doc._id} className="border rounded-xl p-5 bg-gray-50 space-y-3 hover:shadow-md transition">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
                                            {doc.user?.name?.charAt(0) || 'D'}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-lg">{doc.user?.name}</h4>
                                            <p className="text-sm text-primary-600 font-semibold">{doc.specialty}</p>
                                            <p className="text-xs text-gray-400">{doc.experience} {t('yearsExp')}</p>
                                            {doctorRatings[doc._id]?.count > 0 && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="text-yellow-500"><Stars count={Math.round(doctorRatings[doc._id].avg)} /></span>
                                                    <span className="text-xs text-gray-400">({doctorRatings[doc._id].avg} / {doctorRatings[doc._id].count} {t('reviews')})</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border text-sm space-y-2">
                                        <p className="font-semibold text-gray-600 text-xs uppercase tracking-wide">{t('scheduleConsultation')}</p>
                                        <div className="flex gap-2">
                                            <input type="date" min={new Date().toISOString().split('T')[0]} className="border rounded-lg p-2 flex-1 text-sm" value={bookingData[doc._id]?.date || ''} onChange={(e) => setBookingData(prev => ({ ...prev, [doc._id]: { ...prev[doc._id], date: e.target.value } }))} />
                                            <select className="border rounded-lg p-2 flex-1 text-sm" value={bookingData[doc._id]?.time || ''} onChange={(e) => setBookingData(prev => ({ ...prev, [doc._id]: { ...prev[doc._id], time: e.target.value } }))}>
                                                <option value="">{t('selectTime')}</option>
                                                <option value="09:00">09:00 AM</option>
                                                <option value="10:00">10:00 AM</option>
                                                <option value="11:00">11:00 AM</option>
                                                <option value="12:00">12:00 PM</option>
                                                <option value="14:00">02:00 PM</option>
                                                <option value="15:00">03:00 PM</option>
                                                <option value="16:00">04:00 PM</option>
                                                <option value="17:00">05:00 PM</option>
                                            </select>
                                        </div>
                                        <input type="text" placeholder={t('describeSymptoms')} className="border rounded-lg p-2 w-full text-sm" value={symptomsInput[doc._id] || ''} onChange={(e) => setSymptomsInput(prev => ({ ...prev, [doc._id]: e.target.value }))} />
                                        <button onClick={() => handleBook(doc._id)} className="bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-primary-700 font-bold w-full transition">
                                            {t('bookAppointment')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: My Appointments */}
            {activeTab === 'appointments' && (
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">{t('myAppointments')}</h3>
                    {scheduledApps.length === 0 ? (
                        <p className="text-gray-400 text-center py-6">{t('noAppointments')}</p>
                    ) : (
                        <div className="space-y-3">
                            {scheduledApps.map(app => (
                                <div key={app._id} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50 transition">
                                    <div className="flex-1">
                                        <p className="font-bold">{app.doctor?.user?.name || 'Doctor'}</p>
                                        <p className="text-sm text-gray-500">{new Date(app.date).toLocaleDateString()} at {app.timeSlot}</p>
                                        {app.symptoms && <p className="text-xs text-gray-400 mt-1">{t('symptoms')}: {app.symptoms}</p>}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">{t('scheduled')}</span>
                                        {app.meetingLink && (
                                            <Link to={app.meetingLink} className="bg-primary-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-primary-700 transition">{t('joinCall')}</Link>
                                        )}
                                        <button onClick={() => handleCancel(app._id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-600 transition">{t('cancel')}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: Medical History */}
            {activeTab === 'history' && (
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">{t('medicalHistory')}</h3>
                    {completedApps.length === 0 && cancelledApps.length === 0 ? (
                        <p className="text-gray-400 text-center py-6">{t('noHistory')}</p>
                    ) : (
                        <div className="space-y-3">
                            {completedApps.map(app => (
                                <div key={app._id} className="border-l-4 border-green-400 p-4 rounded-r-lg bg-green-50/30">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div>
                                            <p className="font-bold">{app.doctor?.user?.name || 'Doctor'}</p>
                                            <p className="text-sm text-gray-500">{new Date(app.date).toLocaleDateString()} at {app.timeSlot}</p>
                                            {app.symptoms && <p className="text-xs text-gray-400">{t('symptoms')}: {app.symptoms}</p>}
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            <button onClick={() => handleViewPrescription(app._id)} className="bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-600 transition">
                                                {t('viewPrescription')}
                                            </button>
                                            {!ratedAppointments.has(app._id) ? (
                                                <button onClick={() => setRatingModal({ appointmentId: app._id, doctorId: app.doctor?._id })} className="bg-yellow-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-yellow-600 transition">
                                                    {t('rateDoctor')} ★
                                                </button>
                                            ) : (
                                                <span className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded text-xs font-bold">{t('rated')} ✓</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {cancelledApps.map(app => (
                                <div key={app._id} className="border-l-4 border-red-300 p-4 rounded-r-lg bg-red-50/30">
                                    <p className="font-bold text-gray-600">{app.doctor?.user?.name || 'Doctor'}</p>
                                    <p className="text-sm text-gray-400">{new Date(app.date).toLocaleDateString()} — <span className="text-red-500 font-bold">{t('cancelled')}</span></p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: Health Tips */}
            {activeTab === 'health' && (
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">{t('healthTips')}</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { icon: '💧', title: t('stayHydrated'), desc: t('stayHydratedDesc') },
                            { icon: '🧼', title: t('washHands'), desc: t('washHandsDesc') },
                            { icon: '🥗', title: t('eatFresh'), desc: t('eatFreshDesc') },
                            { icon: '🚶', title: t('stayActive'), desc: t('stayActiveDesc') },
                            { icon: '😴', title: t('sleepWell'), desc: t('sleepWellDesc') },
                            { icon: '🦟', title: t('preventMosquito'), desc: t('preventMosquitoDesc') },
                        ].map((tip, idx) => (
                            <div key={idx} className="border rounded-xl p-4 hover:shadow-md transition bg-gradient-to-br from-white to-gray-50">
                                <div className="text-3xl mb-2">{tip.icon}</div>
                                <h4 className="font-bold text-gray-800 mb-1">{tip.title}</h4>
                                <p className="text-sm text-gray-500">{tip.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: Patient Profile */}
            {activeTab === 'profile' && (
                <div className="bg-white p-6 rounded-xl shadow max-w-3xl">
                    <h3 className="text-xl font-bold mb-6 border-b pb-2">{t('patientProfile')}</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('age')}</label>
                            <input type="number" className="border w-full p-2.5 rounded-lg text-sm" value={profileData.age} onChange={e => setProfileData({ ...profileData, age: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('gender')}</label>
                            <select className="border w-full p-2.5 rounded-lg text-sm" value={profileData.gender} onChange={e => setProfileData({ ...profileData, gender: e.target.value })}>
                                <option value="">Select</option>
                                <option value="Male">{t('male')}</option>
                                <option value="Female">{t('female')}</option>
                                <option value="Other">{t('other')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('weight')}</label>
                            <input type="number" className="border w-full p-2.5 rounded-lg text-sm" value={profileData.weight} onChange={e => setProfileData({ ...profileData, weight: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('bloodGroup')}</label>
                            <input type="text" className="border w-full p-2.5 rounded-lg text-sm" value={profileData.bloodGroup} onChange={e => setProfileData({ ...profileData, bloodGroup: e.target.value })} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('allergies')}</label>
                            <input type="text" className="border w-full p-2.5 rounded-lg text-sm" placeholder="e.g. Peanuts, Penicillin" value={profileData.allergies} onChange={e => setProfileData({ ...profileData, allergies: e.target.value })} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('chronicConditions')}</label>
                            <input type="text" className="border w-full p-2.5 rounded-lg text-sm" placeholder="e.g. Diabetes, Asthma" value={profileData.chronicConditions} onChange={e => setProfileData({ ...profileData, chronicConditions: e.target.value })} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('emergencyContact')}</label>
                            <input type="text" className="border w-full p-2.5 rounded-lg text-sm" placeholder="Name & Phone Number" value={profileData.emergencyContact} onChange={e => setProfileData({ ...profileData, emergencyContact: e.target.value })} />
                        </div>
                    </div>
                    <button onClick={handleSaveProfile} className="mt-6 bg-primary-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-700 transition w-full sm:w-auto shadow-md">
                        {t('saveProfile')}
                    </button>
                </div>
            )}

            {/* Prescription Modal */}
            {viewingPrescription && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setViewingPrescription(null)}>
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h3 className="text-xl font-bold text-primary-700">{t('medicalPrescription')}</h3>
                            <button onClick={() => setViewingPrescription(null)} className="text-gray-400 hover:text-black text-2xl leading-none">&times;</button>
                        </div>
                        <div className="mb-6 bg-gray-50 p-4 rounded-lg flex justify-between items-center border">
                            <div>
                                <p className="font-bold">{viewingPrescription.doctor?.user?.name}</p>
                                <p className="text-sm text-gray-500">{new Date(viewingPrescription.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button onClick={downloadPrescriptionPDF} className="bg-primary-100 text-primary-700 font-bold px-4 py-2 rounded-lg hover:bg-primary-200 transition flex items-center gap-2">
                                <span>📄</span> {t('downloadPdf')}
                            </button>
                        </div>
                        <div className="mb-4">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t('prescribedMedications')}</p>
                            <div className="space-y-2">
                                {viewingPrescription.medications?.map((med, idx) => (
                                    <div key={idx} className="bg-green-50 p-3 rounded-lg border border-green-100">
                                        <p className="font-bold text-green-800">{med.name}</p>
                                        <p className="text-sm text-gray-600">{med.dosage} — {med.frequency}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {viewingPrescription.notes && (
                            <div className="mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm">
                                <p className="font-semibold text-yellow-800 mb-1">{t('doctorsNotes')}:</p>
                                <p className="text-gray-700">{viewingPrescription.notes}</p>
                            </div>
                        )}
                        <div className="flex justify-end"><button onClick={() => setViewingPrescription(null)} className="bg-gray-100 px-5 py-2 rounded-lg font-semibold hover:bg-gray-200">{t('close')}</button></div>
                    </div>
                </div>
            )}

            {/* Rating Modal */}
            {ratingModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setRatingModal(null)}>
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">{t('rateDoctor')}</h3>
                        <div className="flex justify-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => setRatingValue(star)} className={`text-4xl transition ${star <= ratingValue ? 'text-yellow-400' : 'text-gray-300'}`}>
                                    ★
                                </button>
                            ))}
                        </div>
                        <textarea placeholder={t('writeReview')} className="border rounded-lg p-3 w-full text-sm mb-4" rows="3" value={reviewText} onChange={e => setReviewText(e.target.value)} />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setRatingModal(null)} className="px-4 py-2 text-gray-500 text-sm font-semibold">{t('cancel')}</button>
                            <button onClick={handleSubmitRating} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-primary-700 transition">{t('submitRating')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;
