import express from 'express';
import { protectRoute } from '../middleware/auth.js';
import {
    createGroup,
    getUserGroups,
    getGroupById,
    addMembersToGroup,
    removeMemberFromGroup,
    updateGroup,
    deleteGroup
} from '../controllers/groupController.js';

const groupRouter = express.Router();

// Group CRUD operations
groupRouter.post("/create", protectRoute, createGroup);
groupRouter.get("/", protectRoute, getUserGroups);
groupRouter.get("/:id", protectRoute, getGroupById);
groupRouter.put("/:id/add-members", protectRoute, addMembersToGroup);
groupRouter.put("/:id/remove-member", protectRoute, removeMemberFromGroup);
groupRouter.put("/:id/update", protectRoute, updateGroup);
groupRouter.delete("/:id", protectRoute, deleteGroup);

export default groupRouter;