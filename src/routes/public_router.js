import express from 'express';
import chatController from '../controllers/chat_controller.js';

const publicRouter = express.Router();

// CHAT
publicRouter.post('/chat/send-message-wa', chatController.sendMessageWa);

export {
    publicRouter
}