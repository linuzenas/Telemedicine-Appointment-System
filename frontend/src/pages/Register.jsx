import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { toast } from 'react-toastify';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('patient');

    // Doctor specific fields
    const [specialty, setSpecialty] = useState('');
    const [experience, setExperience] = useState('');

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const setAuth = useStore((state) => state.setAuth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                name,
                email,
                password,
                role,
                ...(role === 'doctor' && { specialty, experience: Number(experience) })
            };

            const { data } = await axios.post('/api/users', payload);

            const { token, ...user } = data;
            setAuth(user, token);

            // Redirect based on role
            switch (user.role) {
                case 'patient':
                    navigate('/patient');
                    break;
                case 'doctor':
                    navigate('/doctor');
                    break;
                case 'admin':
                    navigate('/admin');
                    break;
                default:
                    navigate('/');
            }
            toast.success('Registration successful. Welcome!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-vh-100 mt-10 mb-10">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-center text-primary-600 mb-6">Create Account</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                        <input
                            type="email"
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">I am registering as a:</label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="patient">Patient (Seeking Care)</option>
                            <option value="doctor">Doctor (Providing Care)</option>
                        </select>
                    </div>

                    {role === 'doctor' && (
                        <div className="space-y-4 pt-4 border-t border-gray-200">
                            <h3 className="font-semibold text-gray-700 text-sm">Doctor Details</h3>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Specialty</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value={specialty}
                                    onChange={(e) => setSpecialty(e.target.value)}
                                    required
                                    placeholder="e.g. Cardiologist"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Experience (Years)</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value={experience}
                                    onChange={(e) => setExperience(e.target.value)}
                                    required
                                    min="0"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition duration-300 flex justify-center items-center mt-6"
                    >
                        {loading ? 'Registering...' : 'Sign Up'}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                    Already have an account? <Link to="/login" className="text-primary-600 font-bold hover:underline">Log in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
