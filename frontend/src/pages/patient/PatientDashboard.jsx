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

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleBook = async (doctorId) => {
        const date = bookingData[doctorId]?.date;
        const timeSlot = bookingData[doctorId]?.time;
        const symptoms = symptomsInput[doctorId] || '';

        if (!date || !timeSlot) {
            toast.error('Please select both a date and a time slot.');
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('/api/appointments', { doctorId, date, timeSlot, symptoms }, config);
            toast.success('Appointment Booked Successfully!');
            // Refresh
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

    if (loading) return <div className="p-4 text-center">Loading Dashboard...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-1">Welcome, {user?.name}</h2>
                <p className="text-gray-600">Find doctors and book your next consultation.</p>
            </div>

            {/* Available Doctors */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Available Doctors</h3>
                {doctors.length === 0 ? (
                    <p className="text-gray-500">No doctors available at the moment. Please check back later.</p>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {doctors.map(doc => (
                            <div key={doc._id} className="border p-4 rounded-lg bg-gray-50 flex flex-col space-y-3">
                                <div>
                                    <h4 className="font-bold text-lg">{doc.user?.name}</h4>
                                    <p className="text-sm text-primary-600 font-semibold">{doc.specialty}</p>
                                    <p className="text-xs text-gray-500">Experience: {doc.experience} years</p>
                                </div>

                                <div className="bg-white p-3 rounded border text-sm flex flex-col space-y-2">
                                    <p className="font-semibold text-gray-700">Schedule Consultation</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            className="border rounded p-1.5 flex-1 text-sm"
                                            value={bookingData[doc._id]?.date || ''}
                                            onChange={(e) => setBookingData(prev => ({ ...prev, [doc._id]: { ...prev[doc._id], date: e.target.value } }))}
                                        />
                                        <select
                                            className="border rounded p-1.5 flex-1 text-sm"
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
                                        className="border rounded p-1.5 w-full text-sm"
                                        value={symptomsInput[doc._id] || ''}
                                        onChange={(e) => setSymptomsInput(prev => ({ ...prev, [doc._id]: e.target.value }))}
                                    />
                                    <button
                                        onClick={() => handleBook(doc._id)}
                                        className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700 font-bold w-full"
                                    >
                                        Book Appointment
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* My Appointments */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">My Appointments</h3>
                {appointments.length === 0 ? (
                    <p className="text-gray-500">You have no appointments booked yet.</p>
                ) : (
                    <div className="space-y-3">
                        {appointments.map(app => (
                            <div key={app._id} className="border p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex-1">
                                    <p className="font-bold">{app.doctor?.user?.name || 'Doctor'}</p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(app.date).toLocaleDateString()} at {app.timeSlot}
                                    </p>
                                    {app.symptoms && (
                                        <p className="text-xs text-gray-400 mt-1">Symptoms: {app.symptoms}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`uppercase text-xs font-bold px-2 py-1 rounded ${app.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            app.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                        }`}>{app.status}</span>

                                    {app.status === 'scheduled' && app.meetingLink && (
                                        <Link to={app.meetingLink} className="bg-primary-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-primary-700">
                                            Join Call
                                        </Link>
                                    )}

                                    {app.status === 'scheduled' && (
                                        <button
                                            onClick={() => handleCancelAppointment(app._id)}
                                            className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-600"
                                        >
                                            Cancel
                                        </button>
                                    )}

                                    {app.status === 'completed' && (
                                        <button
                                            onClick={() => handleViewPrescription(app._id)}
                                            className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-600"
                                        >
                                            View Prescription
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Prescription Modal */}
            {viewingPrescription && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-bold text-primary-700">Medical Prescription</h3>
                            <button onClick={() => setViewingPrescription(null)} className="text-gray-400 hover:text-black text-2xl font-bold">&times;</button>
                        </div>

                        <div className="mb-4">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Prescribed Medications</p>
                            <ul className="mt-2 space-y-2">
                                {viewingPrescription.medications?.map((med, idx) => (
                                    <li key={idx} className="bg-gray-50 p-3 rounded border text-sm">
                                        <span className="font-bold text-primary-700">{med.name}</span>
                                        <span className="text-gray-500"> — {med.dosage}, {med.frequency}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {viewingPrescription.notes && (
                            <div className="mb-4 bg-yellow-50 p-3 rounded border border-yellow-200 text-sm">
                                <p className="font-semibold text-yellow-800 mb-1">Doctor's Notes:</p>
                                <p className="text-gray-700">{viewingPrescription.notes}</p>
                            </div>
                        )}

                        <div className="flex justify-end mt-4">
                            <button onClick={() => setViewingPrescription(null)} className="bg-gray-200 px-4 py-2 rounded font-semibold hover:bg-gray-300">
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
