import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useStore } from '../../store/useStore';
import { toast } from 'react-toastify';

const DoctorDashboard = () => {
    const { token, user } = useStore();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [prescribingApp, setPrescribingApp] = useState(null);
    const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '' }]);
    const [notes, setNotes] = useState('');

    const fetchAppointments = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('/api/appointments/myappointments', config);
            setAppointments(data);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [token]);

    const addMedication = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '' }]);
    };

    const removeMedication = (index) => {
        if (medications.length === 1) return;
        setMedications(medications.filter((_, i) => i !== index));
    };

    const updateMedication = (index, field, value) => {
        const updated = [...medications];
        updated[index][field] = value;
        setMedications(updated);
    };

    const submitPrescription = async (app) => {
        const validMeds = medications.filter(m => m.name && m.dosage && m.frequency);
        if (validMeds.length === 0) {
            toast.error('Please add at least one complete medication entry.');
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = {
                appointmentId: app._id,
                patientId: app.patient._id || app.patient,
                medications: validMeds,
                notes
            };

            await axios.post('/api/prescriptions', payload, config);
            toast.success('Prescription submitted & appointment completed!');

            setPrescribingApp(null);
            setMedications([{ name: '', dosage: '', frequency: '' }]);
            setNotes('');
            fetchAppointments();
        } catch (err) {
            toast.error('Failed to submit prescription: ' + (err.response?.data?.message || err.message));
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
                <p className="opacity-90">Welcome, Dr. {user?.name}. Manage appointments and prescriptions.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
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
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Upcoming Appointments</h3>
                {scheduledApps.length === 0 ? (
                    <p className="text-gray-400 py-4 text-center">No upcoming appointments at the moment.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="uppercase tracking-wider border-b-2 bg-gray-50 border-gray-200 text-gray-500">
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
                                                    <Link to={app.meetingLink} className="bg-primary-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-primary-700 transition">
                                                        Join Call
                                                    </Link>
                                                    <button
                                                        onClick={() => { setPrescribingApp(prescribingApp === app._id ? null : app._id); setMedications([{ name: '', dosage: '', frequency: '' }]); setNotes(''); }}
                                                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-700 transition"
                                                    >
                                                        {prescribingApp === app._id ? 'Close' : 'Prescribe'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Prescription Form */}
                                        {prescribingApp === app._id && (
                                            <tr className="bg-blue-50">
                                                <td colSpan="4" className="px-5 py-4">
                                                    <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <h4 className="font-bold text-lg text-gray-800">Write Prescription for {app.patient?.name}</h4>
                                                            <button onClick={addMedication} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold hover:bg-green-200 transition">
                                                                + Add Medicine
                                                            </button>
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
                                                                <div>
                                                                    {medications.length > 1 && (
                                                                        <button onClick={() => removeMedication(idx)} className="bg-red-100 text-red-600 px-3 py-2 rounded text-xs font-bold hover:bg-red-200 w-full transition">
                                                                            Remove
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        <div>
                                                            <label className="text-xs text-gray-500 block mb-1">Doctor's Notes</label>
                                                            <textarea placeholder="Additional instructions for the patient..." className="border p-2 rounded w-full text-sm" rows="2" value={notes} onChange={e => setNotes(e.target.value)}></textarea>
                                                        </div>

                                                        <div className="flex justify-end gap-2 pt-2">
                                                            <button onClick={() => setPrescribingApp(null)} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-semibold">Cancel</button>
                                                            <button onClick={() => submitPrescription(app)} className="bg-primary-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-primary-700 transition">
                                                                Submit Prescription & Complete
                                                            </button>
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

            {/* Completed History */}
            {completedApps.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">Completed Consultations</h3>
                    <div className="space-y-2">
                        {completedApps.map(app => (
                            <div key={app._id} className="border p-3 rounded-lg flex justify-between items-center hover:bg-gray-50 transition">
                                <div>
                                    <p className="font-semibold">{app.patient?.name || 'Patient'}</p>
                                    <p className="text-sm text-gray-500">{new Date(app.date).toLocaleDateString()} at {app.timeSlot}</p>
                                </div>
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">Completed</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorDashboard;
