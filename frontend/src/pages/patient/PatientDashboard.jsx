import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useStore } from '../../store/useStore';
import { toast } from 'react-toastify';

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
    const { token, user } = useStore();
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
    const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' | 'appointments' | 'history' | 'health'

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
                <h2 className="text-2xl font-bold mb-1">Welcome, {user?.name}</h2>
                <p className="opacity-90">Your health, our priority. Book consultations with trusted doctors.</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{scheduledApps.length} Upcoming</span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{completedApps.length} Completed</span>
                </div>
            </div>

            {/* Emergency Helpline Banner */}
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">🚑</span>
                    <div>
                        <p className="font-bold text-red-800">Emergency Helpline</p>
                        <p className="text-sm text-red-600">For medical emergencies, call immediately</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <a href="tel:108" className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition">Ambulance: 108</a>
                    <a href="tel:112" className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-600 transition">Emergency: 112</a>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow p-1 flex gap-1">
                {[
                    { id: 'doctors', label: '🩺 Find Doctors', count: filteredDoctors.length },
                    { id: 'appointments', label: '📅 My Appointments', count: scheduledApps.length },
                    { id: 'history', label: '📋 Medical History', count: completedApps.length },
                    { id: 'health', label: '💡 Health Tips' },
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
                            placeholder="Search doctor by name..."
                            className="border rounded-lg p-2.5 flex-1 text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="border rounded-lg p-2.5 text-sm min-w-[180px]"
                            value={specialtyFilter}
                            onChange={e => setSpecialtyFilter(e.target.value)}
                        >
                            <option value="">All Specialties</option>
                            {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {filteredDoctors.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400 text-lg">No doctors found</p>
                            <p className="text-sm text-gray-400">Try adjusting your search or filter.</p>
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
                                            <p className="text-xs text-gray-400">{doc.experience} years experience</p>
                                            {doctorRatings[doc._id]?.count > 0 && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="text-yellow-500"><Stars count={Math.round(doctorRatings[doc._id].avg)} /></span>
                                                    <span className="text-xs text-gray-400">({doctorRatings[doc._id].avg} / {doctorRatings[doc._id].count} reviews)</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border text-sm space-y-2">
                                        <p className="font-semibold text-gray-600 text-xs uppercase tracking-wide">Schedule Consultation</p>
                                        <div className="flex gap-2">
                                            <input type="date" min={new Date().toISOString().split('T')[0]} className="border rounded-lg p-2 flex-1 text-sm" value={bookingData[doc._id]?.date || ''} onChange={(e) => setBookingData(prev => ({ ...prev, [doc._id]: { ...prev[doc._id], date: e.target.value } }))} />
                                            <select className="border rounded-lg p-2 flex-1 text-sm" value={bookingData[doc._id]?.time || ''} onChange={(e) => setBookingData(prev => ({ ...prev, [doc._id]: { ...prev[doc._id], time: e.target.value } }))}>
                                                <option value="">Time</option>
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
                                        <input type="text" placeholder="Describe your symptoms (optional)" className="border rounded-lg p-2 w-full text-sm" value={symptomsInput[doc._id] || ''} onChange={(e) => setSymptomsInput(prev => ({ ...prev, [doc._id]: e.target.value }))} />
                                        <button onClick={() => handleBook(doc._id)} className="bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-primary-700 font-bold w-full transition">
                                            Book Appointment
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
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">Upcoming Appointments</h3>
                    {scheduledApps.length === 0 ? (
                        <p className="text-gray-400 text-center py-6">No upcoming appointments. Book one from the Find Doctors tab!</p>
                    ) : (
                        <div className="space-y-3">
                            {scheduledApps.map(app => (
                                <div key={app._id} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50 transition">
                                    <div className="flex-1">
                                        <p className="font-bold">{app.doctor?.user?.name || 'Doctor'}</p>
                                        <p className="text-sm text-gray-500">{new Date(app.date).toLocaleDateString()} at {app.timeSlot}</p>
                                        {app.symptoms && <p className="text-xs text-gray-400 mt-1">Symptoms: {app.symptoms}</p>}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">Scheduled</span>
                                        {app.meetingLink && (
                                            <Link to={app.meetingLink} className="bg-primary-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-primary-700 transition">Join Call</Link>
                                        )}
                                        <button onClick={() => handleCancel(app._id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-600 transition">Cancel</button>
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
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">Medical History</h3>
                    {completedApps.length === 0 && cancelledApps.length === 0 ? (
                        <p className="text-gray-400 text-center py-6">No consultation history yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {completedApps.map(app => (
                                <div key={app._id} className="border-l-4 border-green-400 p-4 rounded-r-lg bg-green-50/30">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div>
                                            <p className="font-bold">{app.doctor?.user?.name || 'Doctor'}</p>
                                            <p className="text-sm text-gray-500">{new Date(app.date).toLocaleDateString()} at {app.timeSlot}</p>
                                            {app.symptoms && <p className="text-xs text-gray-400">Symptoms: {app.symptoms}</p>}
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            <button onClick={() => handleViewPrescription(app._id)} className="bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-600 transition">
                                                View Prescription
                                            </button>
                                            {!ratedAppointments.has(app._id) ? (
                                                <button onClick={() => setRatingModal({ appointmentId: app._id, doctorId: app.doctor?._id })} className="bg-yellow-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-yellow-600 transition">
                                                    Rate Doctor ★
                                                </button>
                                            ) : (
                                                <span className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded text-xs font-bold">Rated ✓</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {cancelledApps.map(app => (
                                <div key={app._id} className="border-l-4 border-red-300 p-4 rounded-r-lg bg-red-50/30">
                                    <p className="font-bold text-gray-600">{app.doctor?.user?.name || 'Doctor'}</p>
                                    <p className="text-sm text-gray-400">{new Date(app.date).toLocaleDateString()} — <span className="text-red-500 font-bold">Cancelled</span></p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: Health Tips */}
            {activeTab === 'health' && (
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">Health Tips for You</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {healthTips.map((tip, idx) => (
                            <div key={idx} className="border rounded-xl p-4 hover:shadow-md transition bg-gradient-to-br from-white to-gray-50">
                                <div className="text-3xl mb-2">{tip.icon}</div>
                                <h4 className="font-bold text-gray-800 mb-1">{tip.title}</h4>
                                <p className="text-sm text-gray-500">{tip.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Prescription Modal */}
            {viewingPrescription && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setViewingPrescription(null)}>
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h3 className="text-xl font-bold text-primary-700">Medical Prescription</h3>
                            <button onClick={() => setViewingPrescription(null)} className="text-gray-400 hover:text-black text-2xl leading-none">&times;</button>
                        </div>
                        <div className="mb-4">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Prescribed Medications</p>
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
                                <p className="font-semibold text-yellow-800 mb-1">Doctor's Notes:</p>
                                <p className="text-gray-700">{viewingPrescription.notes}</p>
                            </div>
                        )}
                        <div className="flex justify-end"><button onClick={() => setViewingPrescription(null)} className="bg-gray-100 px-5 py-2 rounded-lg font-semibold hover:bg-gray-200">Close</button></div>
                    </div>
                </div>
            )}

            {/* Rating Modal */}
            {ratingModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setRatingModal(null)}>
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">Rate Your Doctor</h3>
                        <div className="flex justify-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => setRatingValue(star)} className={`text-4xl transition ${star <= ratingValue ? 'text-yellow-400' : 'text-gray-300'}`}>
                                    ★
                                </button>
                            ))}
                        </div>
                        <textarea placeholder="Write a short review (optional)..." className="border rounded-lg p-3 w-full text-sm mb-4" rows="3" value={reviewText} onChange={e => setReviewText(e.target.value)} />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setRatingModal(null)} className="px-4 py-2 text-gray-500 text-sm font-semibold">Cancel</button>
                            <button onClick={handleSubmitRating} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-primary-700 transition">Submit Rating</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;
