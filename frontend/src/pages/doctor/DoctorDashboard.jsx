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
    const [prescriptionForm, setPrescriptionForm] = useState({ medName: '', dosage: '', frequency: '', notes: '' });

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

    const submitPrescription = async (app) => {
        if (!prescriptionForm.medName || !prescriptionForm.dosage || !prescriptionForm.frequency) {
            toast.error('Please fill in all medication fields.');
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = {
                appointmentId: app._id,
                patientId: app.patient._id || app.patient,
                medications: [{
                    name: prescriptionForm.medName,
                    dosage: prescriptionForm.dosage,
                    frequency: prescriptionForm.frequency
                }],
                notes: prescriptionForm.notes
            };

            await axios.post('/api/prescriptions', payload, config);
            toast.success('Prescription submitted & appointment completed!');

            setPrescribingApp(null);
            setPrescriptionForm({ medName: '', dosage: '', frequency: '', notes: '' });
            fetchAppointments();
        } catch (err) {
            toast.error('Failed to submit prescription: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div className="p-4 text-center">Loading Dashboard...</div>;

    const scheduledApps = appointments.filter(a => a.status === 'scheduled');
    const completedApps = appointments.filter(a => a.status === 'completed');
    const cancelledApps = appointments.filter(a => a.status === 'cancelled');

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-1">Doctor Dashboard</h2>
                <p className="text-gray-600">Welcome, Dr. {user?.name}. Manage your appointments and prescriptions.</p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-700">{scheduledApps.length}</p>
                    <p className="text-sm text-yellow-600">Upcoming</p>
                </div>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-700">{completedApps.length}</p>
                    <p className="text-sm text-green-600">Completed</p>
                </div>
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-700">{cancelledApps.length}</p>
                    <p className="text-sm text-red-600">Cancelled</p>
                </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Upcoming Appointments</h3>
                {scheduledApps.length === 0 ? (
                    <p className="text-gray-500">No upcoming appointments.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="uppercase tracking-wider border-b-2 bg-gray-50 border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 font-bold">Patient</th>
                                    <th className="px-6 py-3 font-bold">Date / Time</th>
                                    <th className="px-6 py-3 font-bold">Symptoms</th>
                                    <th className="px-6 py-3 font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scheduledApps.map((app) => (
                                    <React.Fragment key={app._id}>
                                        <tr className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">{app.patient?.name || 'Patient'}</td>
                                            <td className="px-6 py-4">{new Date(app.date).toLocaleDateString()} at {app.timeSlot}</td>
                                            <td className="px-6 py-4 text-gray-500">{app.symptoms || '—'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <Link
                                                        to={app.meetingLink}
                                                        className="bg-primary-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-primary-700"
                                                    >
                                                        Join Call
                                                    </Link>
                                                    <button
                                                        onClick={() => setPrescribingApp(prescribingApp === app._id ? null : app._id)}
                                                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700"
                                                    >
                                                        {prescribingApp === app._id ? 'Close Form' : 'Prescribe'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {prescribingApp === app._id && (
                                            <tr className="bg-blue-50 border-b">
                                                <td colSpan="4" className="px-6 py-4">
                                                    <div className="bg-white p-4 rounded-lg border shadow-sm space-y-3">
                                                        <h4 className="font-bold text-gray-700">Write Prescription for {app.patient?.name}</h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                            <input type="text" placeholder="Medication Name" className="border p-2 rounded text-sm" value={prescriptionForm.medName} onChange={e => setPrescriptionForm({ ...prescriptionForm, medName: e.target.value })} />
                                                            <input type="text" placeholder="Dosage (e.g. 500mg)" className="border p-2 rounded text-sm" value={prescriptionForm.dosage} onChange={e => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })} />
                                                            <input type="text" placeholder="Frequency (e.g. Twice daily)" className="border p-2 rounded text-sm" value={prescriptionForm.frequency} onChange={e => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })} />
                                                        </div>
                                                        <textarea placeholder="Doctor's notes (optional)" className="border p-2 rounded w-full text-sm" rows="2" value={prescriptionForm.notes} onChange={e => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}></textarea>
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => setPrescribingApp(null)} className="px-3 py-1 text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
                                                            <button onClick={() => submitPrescription(app)} className="bg-primary-600 text-white px-4 py-1.5 rounded font-bold text-sm hover:bg-primary-700">
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

            {/* Completed Appointments */}
            {completedApps.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">Completed Appointments</h3>
                    <div className="space-y-2">
                        {completedApps.map(app => (
                            <div key={app._id} className="border p-3 rounded flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{app.patient?.name || 'Patient'}</p>
                                    <p className="text-sm text-gray-500">{new Date(app.date).toLocaleDateString()} at {app.timeSlot}</p>
                                </div>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Completed</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorDashboard;
