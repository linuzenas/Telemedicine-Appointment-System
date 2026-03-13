import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../../store/useStore';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
    const { token, user } = useStore();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('/api/doctors/admin/all', config);
            setDoctors(data);
        } catch (error) {
            toast.error('Failed to load doctors list');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, [token]);

    const handleVerify = async (doctorId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`/api/doctors/${doctorId}/verify`, {}, config);
            toast.success('Doctor verified successfully!');
            fetchDoctors(); // Refresh the list
        } catch (error) {
            toast.error('Failed to verify doctor');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
                <p className="text-gray-600">Welcome, {user?.name}. System Administration Panel.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Doctor Verification Settings</h3>
                {loading ? (
                    <p>Loading doctors...</p>
                ) : doctors.length === 0 ? (
                    <p>No doctors registered on the platform yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm whitespace-nowrap">
                            <thead className="uppercase tracking-wider border-b-2 bg-gray-50 border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Name</th>
                                    <th className="px-6 py-4 font-bold">Specialty</th>
                                    <th className="px-6 py-4 font-bold">Experience</th>
                                    <th className="px-6 py-4 font-bold">Status</th>
                                    <th className="px-6 py-4 font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doctors.map((doc) => (
                                    <tr key={doc._id} className="border-b">
                                        <td className="px-6 py-4 font-medium">{doc.user?.name}</td>
                                        <td className="px-6 py-4">{doc.specialty}</td>
                                        <td className="px-6 py-4">{doc.experience} years</td>
                                        <td className="px-6 py-4">
                                            {doc.isVerified ? (
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Verified</span>
                                            ) : (
                                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">Pending</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 space-x-2">
                                            {!doc.isVerified && (
                                                <button
                                                    onClick={() => handleVerify(doc._id)}
                                                    className="bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 font-semibold"
                                                >
                                                    Verify
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
        </div>
    );
};

export default AdminDashboard;
