import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import skillBridgeLogo from '../assets/cd12bfb4f77c3986715b08d851b34fa45144098e.png'; 
import VolunteerRegistrationForm from './VolunteerRegistrationForm';
import OrganizationRegistrationForm from './OrganizationRegistrationForm';

// Strong Password Regex: 8+ chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char (@ or _)
const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@\_]).{8,}$/;
// Simple Email Regex Check (for frontend validation)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VOLUNTEER_REGISTER_PATH = '/volunteer';
const NGO_REGISTER_PATH = '/organization';

export default function AuthModal({ isOpen, onClose, type, userType, onAuthSuccess }) {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState('userTypeSelection');
    const [selectedUserType, setSelectedUserType] = useState('volunteer');
    const [currentType, setCurrentType] = useState(type === 'signup' ? 'login' : type); 
    const [isPasswordValid, setIsPasswordValid] = useState(true); 
    const [passwordHint, setPasswordHint] = useState("");
    const [isEmailValid, setIsEmailValid] = useState(true); 
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });

    useEffect(() => {
        if (isOpen) {
            setCurrentType(type === 'signup' ? 'login' : type); 
            if (userType) {
                setSelectedUserType(userType);
                setCurrentStep('form');
            } else {
                setCurrentStep('userTypeSelection');
            }
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setFormData({ username: '', email: '', password: '' });
            setIsPasswordValid(true);
            setPasswordHint("");
            setIsEmailValid(true);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, userType, type]);

    const handleUserTypeSelect = (userType) => {
        setSelectedUserType(userType);
        setCurrentStep('form');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === "email") {
            setIsEmailValid(EMAIL_REGEX.test(value) || value.length === 0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isEmailValid) {
            toast.error("Please correct validation errors.");
            return;
        }
        try {
            const emailNormalized = formData.email?.trim().toLowerCase();
            const usernameNormalized = formData.username?.trim();
            const passwordNormalized = formData.password?.trim();

            const loginBody = {
                username: usernameNormalized || undefined,
                email: emailNormalized || undefined,
                password: passwordNormalized,
            };
            
            const res = await axios.post('http://localhost:5000/api/auth/login', loginBody);
            const { token, user } = res.data || {};
            
            if (token && user?.userType) {
                // Validate that the logged-in user type matches the selected type
                const expectedUserType = selectedUserType === 'volunteer' ? 'volunteer' : 'ngo';
                
                if (user.userType !== expectedUserType) {
                    const userTypeDisplay = user.userType === 'volunteer' ? 'Volunteer' : 'Organization';
                    const selectedTypeDisplay = selectedUserType === 'volunteer' ? 'Volunteer' : 'Organization';
                    toast.error(`This account is registered as ${userTypeDisplay}. Please sign in using the ${userTypeDisplay} option.`);
                    return;
                }
                
                localStorage.setItem('sb_token', token);
                localStorage.setItem('sb_user', JSON.stringify(user));
                window.dispatchEvent(new Event('sb_auth_change'));
                onClose();
                toast.success(res.data?.message || 'Login successful!');
                
                if (onAuthSuccess) onAuthSuccess(user.userType); 
                else navigate('/dashboard', { replace: true });
            } else {
                toast.error('Login failed: Authentication data missing.');
            }
        } catch (error) {
            const msg = error?.response?.data?.message || 'Request failed';
            toast.error(msg);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!formData.email || !EMAIL_REGEX.test(formData.email)) {
            toast.error("Please enter a valid email address");
            return;
        }
        
        try {
            const emailNormalized = formData.email?.trim().toLowerCase();
            const res = await axios.post('http://localhost:5000/api/auth/forgot-password', {
                email: emailNormalized,
            });
            
            toast.success(res.data?.message || "Password reset link has been sent to your email.");
            setCurrentStep('form');
            setFormData(prev => ({ ...prev, email: '' }));
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to send password reset email. Please try again.";
            toast.error(errorMsg);
        }
    };

    if (!isOpen) return null;

    const renderUserTypeSelection = () => (
        <div className="text-center">
            <div className="flex items-center justify-center mb-6">
                <img src={skillBridgeLogo} alt="SkillBridge Logo" className="h-10 w-auto object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500 mb-8">Choose how you want to sign in</p>
            <div className="space-y-4">
                <button
                    onClick={() => handleUserTypeSelect('volunteer')}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left cursor-pointer"
                >
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <span className="text-blue-600 text-xl">🙋‍♂️</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Volunteer</h3>
                            <p className="text-gray-500 text-sm">Contribute your skills to meaningful causes</p>
                        </div>
                    </div>
                </button>
                <button
                    onClick={() => handleUserTypeSelect('ngo')}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left cursor-pointer"
                >
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                            <span className="text-green-600 text-xl">🏢</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">NGO / Organization</h3>
                            <p className="text-gray-500 text-sm">Find skilled volunteers for your projects</p>
                        </div>
                    </div>
                </button>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-gray-600 text-sm">
                    {"Don't have an account? "}
                    <button
                        onClick={() => {
                            onClose();
                            const targetPath = selectedUserType === 'volunteer' ? VOLUNTEER_REGISTER_PATH : NGO_REGISTER_PATH;
                            navigate(targetPath);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                        Sign up here
                    </button>
                </p>
                <p className="text-gray-400 text-xs mt-2">© 2025 All rights reserved.</p>
            </div>
        </div>
    );

    const renderForm = () => (
        <div>
            <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                    <img src={skillBridgeLogo} alt="SkillBridge Logo" className="h-8 w-auto object-contain" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-500">{`Sign in as ${selectedUserType === 'volunteer' ? 'Volunteer' : 'Organization'}`}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors ${!isEmailValid ? 'border-red-500' : ''}`}
                        required
                    />
                    {!isEmailValid && formData.email.length > 0 && (
                        <p className="text-red-500 text-sm mt-1">Please enter a valid email format.</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                        required
                    />
                    <div className="mt-2 text-right">
                        <button
                            type="button"
                            onClick={() => setCurrentStep('forgotPassword')}
                            className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                            Forgot password?
                        </button>
                    </div>
                </div>
                
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center cursor-pointer"
                >
                    Sign In
                </button>
            </form>
            <button
                onClick={() => setCurrentStep('userTypeSelection')}
                className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
        </div>
    );

    const renderForgotPassword = () => (
        <div>
            <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                    <img src={skillBridgeLogo} alt="SkillBridge Logo" className="h-8 w-auto object-contain" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h2>
                <p className="text-gray-500">Enter your email address and we'll send you a link to reset your password</p>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email address"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 cursor-pointer"
                >
                    Send Reset Link
                </button>
            </form>
            <div className="text-center mt-6">
                <button
                    onClick={() => setCurrentStep('form')}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm cursor-pointer"
                >
                    Back to sign in
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md relative animate-modal-slide-in shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    {currentStep === 'userTypeSelection' && renderUserTypeSelection()}
                    {currentStep === 'form' && renderForm()}
                    {currentStep === 'forgotPassword' && renderForgotPassword()}
                </div>
            </div>
        </div>
    );
}