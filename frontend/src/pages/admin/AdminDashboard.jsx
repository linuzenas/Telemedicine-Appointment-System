import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../../store/useStore';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
    const { token, user } = useStore();
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [docsRes, appsRes] = await Promise.all([
                axios.get('/api/doctors/admin/all', config),
                axios.get('/api/appointments/myappointments', config)
            ]);
            setDoctors(docsRes.data);
            setAppointments(appsRes.data);
        } catch (error) {
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    const handleVerify = async (doctorId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`/api/doctors/${doctorId}/verify`, {}, config);
            toast.success('Doctor verified successfully!');
            fetchData();
        } catch (error) {
            toast.error('Failed to verify doctor');
        }
    };

    const handleRevoke = async (doctorId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`/api/doctors/${doctorId}/verify`, { revoke: true }, config);
            toast.success('Doctor verification revoked.');
            fetchData();
        } catch (error) {
            toast.error('Failed to revoke verification');
        }
    };

    const totalPatients = [...new Set(appointments.map(a => a.patient?._id || a.patient))].length;
    const totalScheduled = appointments.filter(a => a.status === 'scheduled').length;
    const totalCompleted = appointments.filter(a => a.status === 'completed').length;

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-xl shadow text-white">
                <h2 className="text-2xl font-bold mb-1">Admin Dashboard</h2>
                <p className="opacity-80">Welcome, {user?.name}. Manage the telemedicine platform.</p>
            </div>

            {/* Platform Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border-l-4 border-blue-500 p-4 rounded-lg shadow-sm">
                    <p className="text-3xl font-bold text-blue-600">{doctors.length}</p>
                    <p className="text-sm text-gray-500 mt-1">Total Doctors</p>
                </div>
                <div className="bg-white border-l-4 border-purple-500 p-4 rounded-lg shadow-sm">
                    <p className="text-3xl font-bold text-purple-600">{totalPatients}</p>
                    <p className="text-sm text-gray-500 mt-1">Unique Patients</p>
                </div>
                <div className="bg-white border-l-4 border-yellow-500 p-4 rounded-lg shadow-sm">
                    <p className="text-3xl font-bold text-yellow-600">{totalScheduled}</p>
                    <p className="text-sm text-gray-500 mt-1">Active Appointments</p>
                </div>
                <div className="bg-white border-l-4 border-green-500 p-4 rounded-lg shadow-sm">
                    <p className="text-3xl font-bold text-green-600">{totalCompleted}</p>
                    <p className="text-sm text-gray-500 mt-1">Completed</p>
                </div>
            </div>

            {/* Doctor Management */}
            <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Doctor Management</h3>
                {loading ? (
                    <p className="text-gray-400 text-center py-4">Loading...</p>
                ) : doctors.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No doctors registered on the platform yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="uppercase tracking-wider border-b-2 bg-gray-50 border-gray-200 text-gray-500">
                                <tr>
                                    <th className="px-5 py-3">Name</th>
                                    <th className="px-5 py-3">Email</th>
                                    <th className="px-5 py-3">Specialty</th>
                                    <th className="px-5 py-3">Experience</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doctors.map((doc) => (
                                    <tr key={doc._id} className="border-b hover:bg-gray-50 transition">
                                        <td className="px-5 py-4 font-semibold">{doc.user?.name}</td>
                                        <td className="px-5 py-4 text-gray-500">{doc.user?.email}</td>
                                        <td className="px-5 py-4">{doc.specialty}</td>
                                        <td className="px-5 py-4">{doc.experience} yrs</td>
                                        <td className="px-5 py-4">
                                            {doc.isVerified ? (
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">Verified</span>
                                            ) : (
                                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">Pending</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            {!doc.isVerified ? (
                                                <button onClick={() => handleVerify(doc._id)} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 transition">
                                                    Approve
                                                </button>
                                            ) : (
                                                <button onClick={() => handleRevoke(doc._id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-600 transition">
                                                    Revoke
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Recent Appointments Overview */}
            {appointments.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">Recent Platform Activity</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {appointments.slice(0, 20).map(app => (
                            <div key={app._id} className="flex justify-between items-center p-3 border rounded-lg text-sm hover:bg-gray-50">
                                <div>
                                    <span className="font-semibold">{app.patient?.name || 'Patient'}</span>
                                    <span className="text-gray-400 mx-2">→</span>
                                    <span className="font-semibold">{app.doctor?.user?.name || 'Doctor'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-xs">{new Date(app.date).toLocaleDateString()}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${app.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            app.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                        }`}>{app.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
