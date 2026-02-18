import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    groupName : {type:String, required:true},
    description : {type:String},
    members : [{type:mongoose.Schema.ObjectId, ref:"User"}],
    admin : {type:mongoose.Schema.ObjectId, ref:"User", required:true},
    lastMessage : {type:mongoose.Schema.ObjectId, ref:"Message"},
    groupImage : {type:String, default: ""},

},{timestamps:true});

const Group = mongoose.model("Group",groupSchema);

export default Group;