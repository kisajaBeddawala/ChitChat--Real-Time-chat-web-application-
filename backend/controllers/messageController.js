import Message from "../models/Message";
import User from "../models/User";

// get all users except logged in user
export const getUsersForSidebar = async(req,res) => {
    try{
        const userId = req.user._id;
        const filteredUsers = await User.find({_id : {$ne:userId}}).select("-password");

        // count number of message not seen
        const unseenMessages = {}
        const promises = filteredUsers.map(async (user) => {
            const message = await Message.find({senderId: user._id, receiverId: userId , seen:false})
            if (message.length > 0){
                unseenMessages[user._id] = message.length;
            }
        })
        await Promise.all(promises);
        res.json({success:true, users:filteredUsers, unseenMessages})
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