import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useStore } from '../../store/useStore';
import { toast } from 'react-toastify';

const Stars = ({ count, size = 'text-sm' }) => (
    <span className={`${size} text-yellow-500`}>{'★'.repeat(count)}{'☆'.repeat(5 - count)}</span>
);

const DoctorDashboard = () => {
    const { token, user } = useStore();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [prescribingApp, setPrescribingApp] = useState(null);
    const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '' }]);
    const [notes, setNotes] = useState('');
    const [myRatings, setMyRatings] = useState({ ratings: [], averageRating: 0, totalReviews: 0 });
    const [activeTab, setActiveTab] = useState('upcoming');

    const fetchAppointments = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('/api/appointments/myappointments', config);
            setAppointments(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyRatings = async () => {
        try {
            // First get doctor profile to get doctor ID
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data: doctors } = await axios.get('/api/doctors', config);
            const me = doctors.find(d => d.user?._id === user?._id || d.user?.email === user?.email);
            if (me) {
                const { data } = await axios.get(`/api/ratings/doctor/${me._id}`);
                setMyRatings(data);
            }
        } catch { }
    };

    useEffect(() => {
        fetchAppointments();
        fetchMyRatings();
    }, [token]);

    const addMedication = () => setMedications([...medications, { name: '', dosage: '', frequency: '' }]);
    const removeMedication = (idx) => { if (medications.length > 1) setMedications(medications.filter((_, i) => i !== idx)); };
    const updateMedication = (idx, field, value) => { const u = [...medications]; u[idx][field] = value; setMedications(u); };

    const submitPrescription = async (app) => {
        const validMeds = medications.filter(m => m.name && m.dosage && m.frequency);
        if (validMeds.length === 0) { toast.error('Add at least one complete medication.'); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('/api/prescriptions', {
                appointmentId: app._id,
                patientId: app.patient._id || app.patient,
                medications: validMeds,
                notes
            }, config);
            toast.success('Prescription submitted & appointment completed!');
            setPrescribingApp(null);
            setMedications([{ name: '', dosage: '', frequency: '' }]);
            setNotes('');
            fetchAppointments();
        } catch (err) {
            toast.error('Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div className="p-8 text-center text-lg">Loading Dashboard...</div>;

    const scheduledApps = appointments.filter(a => a.status === 'scheduled');
    const completedApps = appointments.filter(a => a.status === 'completed');
    const cancelledApps = appointments.filter(a => a.status === 'cancelled');

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 rounded-xl shadow text-white">
                <h2 className="text-2xl font-bold mb-1">Doctor Dashboard</h2>
                <p className="opacity-90">Welcome, Dr. {user?.name}</p>
                <div className="flex gap-3 mt-3 flex-wrap">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{scheduledApps.length} Upcoming</span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{completedApps.length} Completed</span>
                    {myRatings.totalReviews > 0 && (
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">⭐ {myRatings.averageRating} avg ({myRatings.totalReviews} reviews)</span>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm">
                    <p className="text-3xl font-bold text-yellow-600">{scheduledApps.length}</p>
                    <p className="text-sm text-gray-500 mt-1">Upcoming</p>
                </div>
                <div className="bg-white border-l-4 border-green-400 p-4 rounded-lg shadow-sm">
                    <p className="text-3xl font-bold text-green-600">{completedApps.length}</p>
                    <p className="text-sm text-gray-500 mt-1">Completed</p>
                </div>
                <div className="bg-white border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
                    <p className="text-3xl font-bold text-red-600">{cancelledApps.length}</p>
                    <p className="text-sm text-gray-500 mt-1">Cancelled</p>
                </div>
                <div className="bg-white border-l-4 border-yellow-500 p-4 rounded-lg shadow-sm">
                    <p className="text-3xl font-bold text-yellow-600">{myRatings.totalReviews > 0 ? `${myRatings.averageRating}★` : 'N/A'}</p>
                    <p className="text-sm text-gray-500 mt-1">Rating</p>
                </div>
            </div>

            {/* Tab Nav */}
            <div className="bg-white rounded-xl shadow p-1 flex gap-1">
                {[
                    { id: 'upcoming', label: '📋 Upcoming' },
                    { id: 'completed', label: '✅ Completed' },
                    { id: 'reviews', label: '⭐ My Reviews' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition ${activeTab === tab.id ? 'bg-primary-600 text-white shadow' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB: Upcoming */}
            {activeTab === 'upcoming' && (
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">Upcoming Appointments</h3>
                    {scheduledApps.length === 0 ? (
                        <p className="text-gray-400 text-center py-6">No upcoming appointments.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="uppercase tracking-wider border-b-2 bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3">Patient</th>
                                        <th className="px-5 py-3">Date / Time</th>
                                        <th className="px-5 py-3">Symptoms</th>
                                        <th className="px-5 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scheduledApps.map((app) => (
                                        <React.Fragment key={app._id}>
                                            <tr className="border-b hover:bg-gray-50 transition">
                                                <td className="px-5 py-4 font-semibold">{app.patient?.name || 'Patient'}</td>
                                                <td className="px-5 py-4">{new Date(app.date).toLocaleDateString()} at {app.timeSlot}</td>
                                                <td className="px-5 py-4 text-gray-500 max-w-xs truncate">{app.symptoms || '—'}</td>
                                                <td className="px-5 py-4">
                                                    <div className="flex gap-2 flex-wrap">
                                                        <Link to={app.meetingLink} className="bg-primary-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-primary-700 transition">Join Call</Link>
                                                        <button onClick={() => { setPrescribingApp(prescribingApp === app._id ? null : app._id); setMedications([{ name: '', dosage: '', frequency: '' }]); setNotes(''); }} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-700 transition">
                                                            {prescribingApp === app._id ? 'Close' : 'Prescribe'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {prescribingApp === app._id && (
                                                <tr className="bg-blue-50">
                                                    <td colSpan="4" className="px-5 py-4">
                                                        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                                                            <div className="flex justify-between items-center">
                                                                <h4 className="font-bold text-lg text-gray-800">Prescription for {app.patient?.name}</h4>
                                                                <button onClick={addMedication} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold hover:bg-green-200">+ Add Medicine</button>
                                                            </div>
                                                            {medications.map((med, idx) => (
                                                                <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end bg-gray-50 p-3 rounded-lg border">
                                                                    <div>
                                                                        <label className="text-xs text-gray-500 block mb-1">Medicine {idx + 1}</label>
                                                                        <input type="text" placeholder="e.g. Paracetamol" className="border p-2 rounded w-full text-sm" value={med.name} onChange={e => updateMedication(idx, 'name', e.target.value)} />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs text-gray-500 block mb-1">Dosage</label>
                                                                        <input type="text" placeholder="e.g. 500mg" className="border p-2 rounded w-full text-sm" value={med.dosage} onChange={e => updateMedication(idx, 'dosage', e.target.value)} />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs text-gray-500 block mb-1">Frequency</label>
                                                                        <select className="border p-2 rounded w-full text-sm" value={med.frequency} onChange={e => updateMedication(idx, 'frequency', e.target.value)}>
                                                                            <option value="">Select</option>
                                                                            <option value="Once daily">Once daily</option>
                                                                            <option value="Twice daily">Twice daily</option>
                                                                            <option value="Thrice daily">Thrice daily</option>
                                                                            <option value="Before meals">Before meals</option>
                                                                            <option value="After meals">After meals</option>
                                                                            <option value="As needed">As needed</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>{medications.length > 1 && <button onClick={() => removeMedication(idx)} className="bg-red-100 text-red-600 px-3 py-2 rounded text-xs font-bold hover:bg-red-200 w-full">Remove</button>}</div>
                                                                </div>
                                                            ))}
                                                            <div>
                                                                <label className="text-xs text-gray-500 block mb-1">Doctor's Notes</label>
                                                                <textarea placeholder="Additional instructions..." className="border p-2 rounded w-full text-sm" rows="2" value={notes} onChange={e => setNotes(e.target.value)} />
                                                            </div>
                                                            <div className="flex justify-end gap-2 pt-2">
                                                                <button onClick={() => setPrescribingApp(null)} className="px-4 py-2 text-gray-500 text-sm font-semibold">Cancel</button>
                                                                <button onClick={() => submitPrescription(app)} className="bg-primary-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-primary-700 transition">Submit & Complete</button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: Completed */}
            {activeTab === 'completed' && (
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">Completed Consultations</h3>
                    {completedApps.length === 0 ? (
                        <p className="text-gray-400 text-center py-6">No completed consultations yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {completedApps.map(app => (
                                <div key={app._id} className="border p-3 rounded-lg flex justify-between items-center hover:bg-gray-50 transition">
                                    <div>
                                        <p className="font-semibold">{app.patient?.name || 'Patient'}</p>
                                        <p className="text-sm text-gray-500">{new Date(app.date).toLocaleDateString()} at {app.timeSlot}</p>
                                        {app.symptoms && <p className="text-xs text-gray-400">Symptoms: {app.symptoms}</p>}
                                    </div>
                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">Completed</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: Reviews */}
            {activeTab === 'reviews' && (
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">Patient Reviews</h3>
                    {myRatings.totalReviews === 0 ? (
                        <p className="text-gray-400 text-center py-6">No reviews yet. Reviews will appear after patients rate their consultations.</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-center">
                                <p className="text-4xl font-bold text-yellow-600">{myRatings.averageRating}</p>
                                <Stars count={Math.round(myRatings.averageRating)} size="text-2xl" />
                                <p className="text-sm text-gray-500 mt-1">Based on {myRatings.totalReviews} patient review{myRatings.totalReviews > 1 ? 's' : ''}</p>
                            </div>
                            <div className="space-y-3">
                                {myRatings.ratings.map((r, idx) => (
                                    <div key={idx} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-sm">{r.patient?.name || 'Patient'}</span>
                                            <Stars count={r.rating} />
                                        </div>
                                        {r.review && <p className="text-sm text-gray-600 mt-1">{r.review}</p>}
                                        <p className="text-xs text-gray-400 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DoctorDashboard;
