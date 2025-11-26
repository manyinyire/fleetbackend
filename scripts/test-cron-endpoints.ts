import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
    console.error('Error: CRON_SECRET is not defined in .env file');
    process.exit(1);
}

const endpoints = [
    '/api/cron/invoice-reminders',
    '/api/cron/weekly-targets',
    '/api/cron/subscription-validation',
    '/api/cron/auto-invoice-generation'
];

async function testEndpoint(endpoint: string) {
    console.log(`Testing ${endpoint}...`);
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CRON_SECRET}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`✅ ${endpoint}: Success`, data);
        } else {
            console.error(`❌ ${endpoint}: Failed (${response.status})`, data);
        }
    } catch (error) {
        console.error(`❌ ${endpoint}: Error`, error instanceof Error ? error.message : error);
    }
}

async function runTests() {
    console.log(`Starting cron endpoint tests against ${BASE_URL}`);

    for (const endpoint of endpoints) {
        await testEndpoint(endpoint);
    }
}

runTests();
