import express from 'express';
import dotenv from 'dotenv';
import scanHandler from './pages/api/scan.js';

dotenv.config();

const app = express();
const port = 3001;

app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.post('/api/scan', async (req, res) => {
    console.log('📧 Scan request received!');
    try {
        await scanHandler(req, res);
    } catch (error) {
        console.error('❌ Error in scan handler:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    console.log('✅ Health check received');
    res.json({ status: 'ok', message: 'Backend server is running' });
});

app.listen(port, () => {
    console.log(`🚀 Local API server running at http://localhost:${port}`);
    console.log(`📍 Health check: http://localhost:${port}/api/health`);
});
