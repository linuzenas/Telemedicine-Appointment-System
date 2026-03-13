import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useStore } from '../../store/useStore';
import { toast } from 'react-toastify';

const PatientDashboard = () => {
    const { token, user } = useStore();
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingData, setBookingData] = useState({});
    const [viewingPrescription, setViewingPrescription] = useState(null);
    const [symptomsInput, setSymptomsInput] = useState({});

    const fetchData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [docsRes, appRes] = await Promise.all([
                axios.get('/api/doctors', config),
                axios.get('/api/appointments/myappointments', config)
            ]);
            setDoctors(docsRes.data);
            setAppointments(appRes.data);
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

        if (!date || !timeSlot) {
            toast.error('Please select both a date and time slot.');
            return;
        }

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
        } catch (error) {
            toast.error('No prescription available for this appointment yet.');
        }
    };

    const handleCancelAppointment = async (appointmentId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`/api/appointments/${appointmentId}/status`, { status: 'cancelled' }, config);
            toast.success('Appointment cancelled.');
            fetchData();
        } catch (error) {
            toast.error('Failed to cancel appointment.');
        }
    };

    if (loading) return <div className="p-8 text-center text-lg">Loading Dashboard...</div>;

    const scheduledApps = appointments.filter(a => a.status === 'scheduled');
    const completedApps = appointments.filter(a => a.status === 'completed');

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 rounded-xl shadow text-white">
                <h2 className="text-2xl font-bold mb-1">Welcome, {user?.name}</h2>
                <p className="opacity-90">Find doctors and book your next consultation.</p>
            </div>

            {/* Available Doctors */}
            <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Available Doctors</h3>
                {doctors.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-400 text-lg mb-2">No doctors available right now</p>
                        <p className="text-gray-400 text-sm">Registered doctors will appear here once they join the platform.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {doctors.map(doc => (
                            <div key={doc._id} className="border rounded-xl p-5 bg-gray-50 space-y-3 hover:shadow-md transition">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-lg">
                                        {doc.user?.name?.charAt(0) || 'D'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">{doc.user?.name}</h4>
                                        <p className="text-sm text-primary-600 font-semibold">{doc.specialty}</p>
                                        <p className="text-xs text-gray-400">{doc.experience} years experience</p>
                                    </div>
                                </div>

                                <div className="bg-white p-3 rounded-lg border text-sm space-y-2">
                                    <p className="font-semibold text-gray-600 text-xs uppercase tracking-wide">Schedule Consultation</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            className="border rounded-lg p-2 flex-1 text-sm"
                                            value={bookingData[doc._id]?.date || ''}
                                            onChange={(e) => setBookingData(prev => ({ ...prev, [doc._id]: { ...prev[doc._id], date: e.target.value } }))}
                                        />
                                        <select
                                            className="border rounded-lg p-2 flex-1 text-sm"
                                            value={bookingData[doc._id]?.time || ''}
                                            onChange={(e) => setBookingData(prev => ({ ...prev, [doc._id]: { ...prev[doc._id], time: e.target.value } }))}
                                        >
                                            <option value="">Select Time</option>
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
                                    <input
                                        type="text"
                                        placeholder="Describe your symptoms (optional)"
                                        className="border rounded-lg p-2 w-full text-sm"
                                        value={symptomsInput[doc._id] || ''}
                                        onChange={(e) => setSymptomsInput(prev => ({ ...prev, [doc._id]: e.target.value }))}
                                    />
                                    <button
                                        onClick={() => handleBook(doc._id)}
                                        className="bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-primary-700 font-bold w-full transition"
                                    >
                                        Book Appointment
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upcoming Appointments */}
            {scheduledApps.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">Upcoming Appointments</h3>
                    <div className="space-y-3">
                        {scheduledApps.map(app => (
                            <div key={app._id} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50 transition">
                                <div className="flex-1">
                                    <p className="font-bold">{app.doctor?.user?.name || 'Doctor'}</p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(app.date).toLocaleDateString()} at {app.timeSlot}
                                    </p>
                                    {app.symptoms && <p className="text-xs text-gray-400 mt-1">Symptoms: {app.symptoms}</p>}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">Scheduled</span>
                                    {app.meetingLink && (
                                        <Link to={app.meetingLink} className="bg-primary-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-primary-700 transition">
                                            Join Call
                                        </Link>
                                    )}
                                    <button onClick={() => handleCancelAppointment(app._id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-600 transition">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Completed Appointments */}
            {completedApps.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">Completed Appointments</h3>
                    <div className="space-y-3">
                        {completedApps.map(app => (
                            <div key={app._id} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex-1">
                                    <p className="font-bold">{app.doctor?.user?.name || 'Doctor'}</p>
                                    <p className="text-sm text-gray-500">{new Date(app.date).toLocaleDateString()} at {app.timeSlot}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">Completed</span>
                                    <button onClick={() => handleViewPrescription(app._id)} className="bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-600 transition">
                                        View Prescription
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No appointments at all */}
            {appointments.length === 0 && (
                <div className="bg-white p-6 rounded-xl shadow text-center py-8">
                    <p className="text-gray-400 text-lg">No appointments yet</p>
                    <p className="text-gray-400 text-sm">Book your first consultation with a doctor above!</p>
                </div>
            )}

            {/* Prescription Modal */}
            {viewingPrescription && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setViewingPrescription(null)}>
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h3 className="text-xl font-bold text-primary-700">Medical Prescription</h3>
                            <button onClick={() => setViewingPrescription(null)} className="text-gray-400 hover:text-black text-2xl font-bold leading-none">&times;</button>
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

                        <div className="flex justify-end mt-4">
                            <button onClick={() => setViewingPrescription(null)} className="bg-gray-100 px-5 py-2 rounded-lg font-semibold hover:bg-gray-200 transition">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;
