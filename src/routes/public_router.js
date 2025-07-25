import express from 'express';
import chatController from '../controllers/chat_controller.js';

const publicRouter = express.Router();

// CHAT
publicRouter.post('/chat/start-trivia', chatController.startTrivia);
publicRouter.post('/chat/response-trivia', chatController.responseTrivia);

export {
    publicRouter
}