import { Router } from "express";
import { deleteChat, postChat } from "../controllers/chat.controller.js";

const router = Router();

router.post("/", postChat);
router.delete("/:sessionId", deleteChat);

export default router;
