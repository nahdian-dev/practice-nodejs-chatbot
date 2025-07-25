import dotenv from 'dotenv';
import twilio from 'twilio';
import axios from 'axios';
import e from 'express';

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
            console.log('Trivia questions fetched successfully');

            const questions = response.data.results;

            results.set('results', questions);
            results.set('currentQuestion', 1);
            results.set('score', 0);

            twiml.message(results.get('results')[0].question);
        } catch (error) {
            twiml.message('Sorry, I could not fetch trivia questions at the moment. Please try again later.');
        }
    } else if (userMessage === 'true' || userMessage === 'false') {
        const currentQuestion = results.get('currentQuestion');

        const question = results.get('results')[currentQuestion + 1].question;
        const correctAnswer = results.get('results')[currentQuestion].correct_answer.toLowerCase();

        if (currentQuestion < 5) {
            if (userMessage === correctAnswer) {
                console.log('correct');

                results.set('score', results.get('score') + 1);
                results.set('currentQuestion', currentQuestion + 1);

                twiml.message(`Correct! The answer is true`);
                twiml.message(question);
            } else {
                console.log('incorrect');
                results.set('currentQuestion', currentQuestion + 1);

                twiml.message(`Incorrect! The answer is false`);
                twiml.message(question);
            }
        } else {
            twiml.message(`Congratulations! 🎉 You've completed the trivia challenge! Your final score is ${results.get('score')} out of 5.`);

            results.clear();
        }
    } else if (userMessage === 'end') {
        twiml.message(`Thank you for playing! Your final score is ${results.get('score')} out of 5.`);
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