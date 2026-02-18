import Group from "../models/Group.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// Create a new group
export const createGroup = async (req, res) => {
    try {
        const { groupName, description, members } = req.body;
        const adminId = req.user._id;

        // Validate members exist
        const memberIds = members || [];
        memberIds.push(adminId); // Add admin to members
        const uniqueMemberIds = [...new Set(memberIds)]; // Remove duplicates
        
        const validMembers = await User.find({ _id: { $in: uniqueMemberIds } });
        if (validMembers.length !== uniqueMemberIds.length) {
            return res.json({ success: false, message: "Some members not found" });
        }

        const newGroup = await Group.create({
            groupName,
            description,
            admin: adminId,
            members: uniqueMemberIds
        });

        const populatedGroup = await Group.findById(newGroup._id)
            .populate("members", "fullName profilePic email")
            .populate("admin", "fullName profilePic email");

        // Join all members to the Socket.IO room for real-time updates
        uniqueMemberIds.forEach(memberId => {
            const socketId = userSocketMap[memberId.toString()];
            if (socketId) {
                io.sockets.sockets.get(socketId)?.join(`group_${newGroup._id}`);
                io.to(socketId).emit("groupCreated", populatedGroup);
            }
        });

        res.json({ success: true, group: populatedGroup });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Get all groups for the current user
export const getUserGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const groups = await Group.find({ members: userId })
            .populate("members", "fullName profilePic email")
            .populate("admin", "fullName profilePic email")
            .populate("lastMessage")
            .sort({ updatedAt: -1 });

        res.json({ success: true, groups });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Get group details by ID
export const getGroupById = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(groupId)
            .populate("members", "fullName profilePic email")
            .populate("admin", "fullName profilePic email");

        if (!group) {
            return res.json({ success: false, message: "Group not found" });
        }

        // Check if user is a member of the group
        if (!group.members.some(member => member._id.toString() === userId.toString())) {
            return res.json({ success: false, message: "You are not a member of this group" });
        }

        res.json({ success: true, group });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Add members to group
export const addMembersToGroup = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { members } = req.body;
        const userId = req.user._id;

        // Validate members array
        if (!Array.isArray(members) || members.length === 0) {
            return res.json({ success: false, message: "Members array is required" });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ success: false, message: "Group not found" });
        }

        // Check if user is admin
        if (group.admin.toString() !== userId.toString()) {
            return res.json({ success: false, message: "Only admin can add members" });
        }

        // Validate new members exist
        const validMembers = await User.find({ _id: { $in: members } });
        if (validMembers.length !== members.length) {
            return res.json({ success: false, message: "Some members not found" });
        }

        // Add new members (avoid duplicates)
        const currentMembers = group.members.map(id => id.toString());
        const newMembers = members.filter(id => !currentMembers.includes(id.toString()));
        
        if (newMembers.length === 0) {
            return res.json({ success: false, message: "All users are already members" });
        }

        group.members.push(...newMembers);
        await group.save();

        const updatedGroup = await Group.findById(groupId)
            .populate("members", "fullName profilePic email")
            .populate("admin", "fullName profilePic email");

        // Notify all group members
        group.members.forEach(memberId => {
            const socketId = userSocketMap[memberId.toString()];
            if (socketId) {
                io.to(socketId).emit("groupUpdated", updatedGroup);
            }
        });

        res.json({ success: true, group: updatedGroup });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Remove member from group
export const removeMemberFromGroup = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { memberId } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ success: false, message: "Group not found" });
        }

        // Check if user is admin or removing themselves
        if (group.admin.toString() !== userId.toString() && memberId !== userId.toString()) {
            return res.json({ success: false, message: "Only admin can remove members" });
        }

        // Cannot remove admin
        if (memberId === group.admin.toString()) {
            return res.json({ success: false, message: "Cannot remove group admin" });
        }

        group.members = group.members.filter(id => id.toString() !== memberId);
        await group.save();

        const updatedGroup = await Group.findById(groupId)
            .populate("members", "fullName profilePic email")
            .populate("admin", "fullName profilePic email");

        // Notify all group members
        group.members.forEach(memberId => {
            const socketId = userSocketMap[memberId.toString()];
            if (socketId) {
                io.to(socketId).emit("groupUpdated", updatedGroup);
            }
        });

        res.json({ success: true, group: updatedGroup });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Update group details
export const updateGroup = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { groupName, description, groupImage } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ success: false, message: "Group not found" });
        }

        // Check if user is admin
        if (group.admin.toString() !== userId.toString()) {
            return res.json({ success: false, message: "Only admin can update group details" });
        }

        let imageUrl = group.groupImage;
        if (groupImage) {
            const uploadResponse = await cloudinary.uploader.upload(groupImage);
            imageUrl = uploadResponse.secure_url;
        }

        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            {
                ...(groupName && { groupName }),
                ...(description && { description }),
                groupImage: imageUrl
            },
            { new: true }
        ).populate("members", "fullName profilePic email")
         .populate("admin", "fullName profilePic email");

        // Notify all group members
        group.members.forEach(memberId => {
            const socketId = userSocketMap[memberId.toString()];
            if (socketId) {
                io.to(socketId).emit("groupUpdated", updatedGroup);
            }
        });

        res.json({ success: true, group: updatedGroup });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Delete group
export const deleteGroup = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ success: false, message: "Group not found" });
        }

        // Check if user is admin
        if (group.admin.toString() !== userId.toString()) {
            return res.json({ success: false, message: "Only admin can delete the group" });
        }

        // Delete all group messages
        await Message.deleteMany({ groupId });

        // Delete group
        await Group.findByIdAndDelete(groupId);

        // Notify all group members
        group.members.forEach(memberId => {
            const socketId = userSocketMap[memberId.toString()];
            if (socketId) {
                io.to(socketId).emit("groupDeleted", { groupId });
            }
        });

        res.json({ success: true, message: "Group deleted successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};