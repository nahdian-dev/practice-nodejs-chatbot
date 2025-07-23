import dotenv from 'dotenv';
import { app } from './application/web.js';
import { logger } from './application/logging.js'

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});