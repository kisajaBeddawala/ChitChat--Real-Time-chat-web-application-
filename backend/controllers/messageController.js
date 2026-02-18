import Message from "../models/Message.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// get all users except logged in user
export const getUsersForSidebar = async(req,res) => {
    try{
        const userId = req.user._id;
        
        // Use aggregation for better performance
        const usersWithUnseenCount = await User.aggregate([
            { $match: { _id: { $ne: userId } } },
            { $project: { password: 0 } }, // Exclude password
            {
                $lookup: {
                    from: 'messages',
                    let: { senderId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$senderId', '$$senderId'] },
                                        { $eq: ['$receiverId', userId] },
                                        { $eq: ['$seen', false] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'unseenMessages'
                }
            },
            {
                $addFields: {
                    unseenCount: { $size: '$unseenMessages' }
                }
            },
            { $project: { unseenMessages: 0 } }
        ]);

        const users = usersWithUnseenCount.map(user => ({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));

        const unseenMessages = {};
        usersWithUnseenCount.forEach(user => {
            if (user.unseenCount > 0) {
                unseenMessages[user._id] = user.unseenCount;
            }
        });

        res.json({success:true, users, unseenMessages})
    }catch(error){
        console.log(error.message);
        res.json({success:false, message:error.message});
    }
}

// get all messages from selected user
export const getMessages = async (req,res) => {
    try{
        const {id:selectedUserId} = req.params;
        const myId = req.user._id;
        const messages = await Message.find({
            $or:[
                {senderId: selectedUserId, receiverId: myId},
                {senderId: myId, receiverId: selectedUserId},
            ]
        })
        await Message.updateMany({senderId:selectedUserId, receiverId:myId},{seen:true});
        res.json({success:true, messages})

    }catch(error){
        console.log(error.message);
        res.json({success:false, message:error.message});
    }
}

// api to mark message as seen using message id
export const markMessageAsSeen = async (req,res) => {
    try{
        const {id} = req.params;
        await Message.findByIdAndUpdate(id, {seen:true});
        res.json({success:true})
    }catch(error){
        console.log(error.message);
        res.json({success:false, message:error.message});
    }
}

// send message to selected user
export const sendMessage = async (req,res) => {
    try{
        const { text, image} = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        // emit message to receiver if online
        const receiverSocketId = userSocketMap[receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        res.json({success:true, message:newMessage});
    }catch(error){
        console.log(error.message);
        res.json({success:false, message:error.message});
    }
}

// Send message to group
export const sendGroupMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const groupId = req.params.id;
        const senderId = req.user._id;

        // Verify group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.members.includes(senderId)) {
            return res.json({ success: false, message: "You are not a member of this group" });
        }

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            groupId,
            text,
            image: imageUrl
        });

        await newMessage.populate("senderId", "fullName profilePic");

        // Update group's last message
        await Group.findByIdAndUpdate(groupId, { lastMessage: newMessage._id });

        // Emit message to the group room
        io.to(`group_${groupId}`).emit("newGroupMessage", newMessage);

        res.json({ success: true, message: newMessage });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Get all messages from a group
export const getGroupMessages = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const myId = req.user._id;

        // Verify group exists and user is a member
        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.members.includes(myId)) {
            return res.json({ success: false, message: "You are not a member of this group" });
        }

        const messages = await Message.find({ groupId })
            .populate("senderId", "fullName profilePic")
            .sort({ createdAt: 1 });

        res.json({ success: true, messages });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};