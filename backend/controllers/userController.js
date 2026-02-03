import { generateToken } from "../lib/utils";
import User from "../models/User";
import bcrypt from "bcryptjs";

// sign up logic
export const signup = async (req,res) => {
    const {fullName,email,password,bio} = req.body;

    try{
        if(!fullName || !email || !password || !bio){
            return res.json({success:false, message:"Fill all required details"});
        }

        const user = await User.findOne({email});

        if(user){
            return res.json({success:false, message:"Account already exists"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser = await User.create({
            fullName,email,password:hashedPassword,bio
        });

        const token = generateToken(newUser)

        res.json({success:true, userData: newUser, token , message:"Account created successfully"});
    }catch(error){
        console.log(error.message);
        return res.json({success:false, message:error.message})
    }
}