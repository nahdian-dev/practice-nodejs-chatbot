import dotenv from 'dotenv';
import twilio from 'twilio';
import axios from 'axios';
import he from 'he';
import { logger } from '../application/logging.js'

dotenv.config();

const client = new twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const MessagingResponse = twilio.twiml.MessagingResponse;
const results = new Map();

const startTrivia = async (req, res) => {
    const { to } = req.body;

    try {
        const message = await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
            to: `whatsapp:${to}`,
            body: `🌟 Welcome to the Animal Trivia Challenge! 🐶🦊🦁\n\nGet ready to test your animal knowledge with 5 fun and surprising questions! 🧠🦓🐘\n\n📚 How it works:\n- You’ll be asked **5 statements** about animals.\n- For each question, just reply with **True** or **False**.\n- Try to answer all of them correctly! 🎯\n\n💡 Example:\n"Penguins can fly."\nYour answer: **False**\n\n🔥 Are you ready to begin? Type **start** to get your first question!`
        });

        res.status(200).json({
            success: true,
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
}

const responseTrivia = async (req, res) => {
    const userMessage = req.body.Body.trim().toLowerCase();
    const twiml = new MessagingResponse();

    if (userMessage === 'start') {
        try {
            const response = await axios.get('https://opentdb.com/api.php?amount=5&category=27&difficulty=easy&type=boolean');
            logger.info('Trivia questions fetched successfully');

            const questions = response.data.results;

            results.set('results', questions);
            results.set('lastIndex', 0);
            results.set('isAlreadytStart', true);
            results.set('currentNumberQuestion', 1);
            results.set('score', 0);

            twiml.message(he.decode(results.get('results')[0].question));
        } catch (error) {
            logger.info('Error fetching trivia questions:', error.message);
            twiml.message('Sorry, I could not fetch trivia questions at the moment. Please try again later.');
        }
    } else if (userMessage === 'true' || userMessage === 'false') {
        if (results.get('isAlreadytStart') !== true) {
            twiml.message('Please type "start" to begin the trivia challenge.');
            res.writeHead(200, { 'Content-Type': 'text/xml' });
            return res.end(twiml.toString());
        }

        const lastIndex = results.get('lastIndex');
        const currentNumberQuestion = results.get('currentNumberQuestion');
        const correctAnswer = results.get('results')[lastIndex].correct_answer.toLowerCase();

        if (currentNumberQuestion < 5) {
            const questionResult = results.get('results')[lastIndex + 1].question;
            const question = he.decode(questionResult);

            if (userMessage === correctAnswer) {
                results.set('lastIndex', results.get('lastIndex') + 1);
                results.set('score', results.get('score') + 1);
                results.set('currentNumberQuestion', currentNumberQuestion + 1);

                twiml.message(`Correct! The answer is ${correctAnswer}`);
                twiml.message(question);
            } else {
                results.set('lastIndex', results.get('lastIndex') + 1);
                results.set('currentNumberQuestion', currentNumberQuestion + 1);

                twiml.message(`Incorrect! The answer is ${correctAnswer}`);
                twiml.message(question);
            }
        } else {
            if (userMessage === correctAnswer) {
                results.set('score', results.get('score') + 1);

                twiml.message(`Correct! The answer is ${correctAnswer}`);
            } else {
                twiml.message(`Incorrect! The answer is ${correctAnswer}`);
            }

            twiml.message(`Congratulations! 🎉 You've completed the trivia challenge! Your final score is ${results.get('score')} out of 5.\n\nType "start" to begin another the animals trivia.`);
            results.clear();
        }
    } else if (userMessage === 'end') {
        const score = results.get('score') || 0;
        twiml.message(`Thank you for playing! Your final score is ${score} out of 5.`);
        results.clear();
    }
    else {
        twiml.message('Please reply with "True" or "False" to answer the question, or type "start" to begin the trivia.');
    }

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
}

export default {
    startTrivia,
    responseTrivia
}