import React, { useState, useContext, useEffect } from 'react';
import { GroupContext } from '../../context/GroupContext';
import assets from '../assets/assets';

const CreateGroup = () => {
    const { 
        showCreateGroupModal, 
        setShowCreateGroupModal, 
        createGroup, 
        getAllUsers, 
        users 
    } = useContext(GroupContext);

    const [formData, setFormData] = useState({
        groupName: '',
        description: '',
        members: [],
        groupImage: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        if (showCreateGroupModal && users.length === 0) {
            getAllUsers();
        }
    }, [showCreateGroupModal, getAllUsers, users.length]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setFormData(prev => ({
                    ...prev,
                    groupImage: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleMemberSelection = (userId) => {
        setFormData(prev => ({
            ...prev,
            members: prev.members.includes(userId)
                ? prev.members.filter(id => id !== userId)
                : [...prev.members, userId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.groupName.trim()) {
            return;
        }
        await createGroup(formData);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            groupName: '',
            description: '',
            members: [],
            groupImage: ''
        });
        setSearchTerm('');
        setImagePreview(null);
    };

    const handleClose = () => {
        setShowCreateGroupModal(false);
        resetForm();
    };

    const filteredUsers = users.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!showCreateGroupModal) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#282142] rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-600">
                    <h2 className="text-white text-lg font-semibold">Create New Group</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Group Image */}
                    <div className="flex flex-col items-center space-y-2">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Group" className="w-full h-full object-cover" />
                                ) : (
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                        <p className="text-gray-400 text-sm">Click to add group photo</p>
                    </div>

                    {/* Group Name */}
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">
                            Group Name *
                        </label>
                        <input
                            type="text"
                            name="groupName"
                            value={formData.groupName}
                            onChange={handleInputChange}
                            placeholder="Enter group name"
                            className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-violet-500 focus:outline-none"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Enter group description"
                            rows="3"
                            className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-violet-500 focus:outline-none resize-none"
                        />
                    </div>

                    {/* Members Selection */}
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">
                            Add Members ({formData.members.length} selected)
                        </label>
                        
                        {/* Search Users */}
                        <div className="relative mb-3">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search users..."
                                className="w-full bg-gray-700 text-white px-3 py-2 pl-9 rounded-lg border border-gray-600 focus:border-violet-500 focus:outline-none"
                            />
                            <img 
                                src={assets.search_icon} 
                                alt="Search" 
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                            />
                        </div>

                        {/* Users List */}
                        <div className="max-h-40 overflow-y-auto border border-gray-600 rounded-lg">
                            {filteredUsers.length === 0 ? (
                                <p className="text-gray-400 text-sm p-3 text-center">No users found</p>
                            ) : (
                                filteredUsers.map((user) => (
                                    <div
                                        key={user._id}
                                        onClick={() => toggleMemberSelection(user._id)}
                                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-600 border-b border-gray-600 last:border-b-0 ${
                                            formData.members.includes(user._id) ? 'bg-violet-500/20' : ''
                                        }`}
                                    >
                                        <img
                                            src={user.profilePic || assets.avatar_icon}
                                            alt={user.fullName}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <div className="flex-1">
                                            <p className="text-white text-sm">{user.fullName}</p>
                                            <p className="text-gray-400 text-xs">{user.email}</p>
                                        </div>
                                        {formData.members.includes(user._id) && (
                                            <div className="w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 text-gray-400 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!formData.groupName.trim()}
                            className="flex-1 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                            Create Group
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroup;