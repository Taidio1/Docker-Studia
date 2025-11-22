require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const { Kafka } = require('kafkajs');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); 
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// PostgreSQL Connection Pool
const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'customersdb',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
});

// Kafka Configuration
const kafka = new Kafka({
    clientId: 'customer-service',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
    retry: {
        initialRetryTime: 300,
        retries: 10
    }
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'customer-service-group' });

// Kafka Producer and Consumer Setup
let kafkaReady = false;

async function initializeKafka() {
    try {
        // Connect producer
        await producer.connect();
        console.log('✅ Kafka Producer connected');

        // Connect consumer
        await consumer.connect();
        await consumer.subscribe({ topic: 'customer-requests', fromBeginning: false });
        console.log('✅ Kafka Consumer subscribed to customer-requests topic');

        // Start consuming messages
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const requestData = JSON.parse(message.value.toString());
                    console.log(`📨 Kafka Consumer received: ${message.value.toString()}`);
                    
                    // Process the request - fetch customers from database
                    const customers = await getCustomersFromDB();
                    
                    // Publish response to customer-responses topic
                    await producer.send({
                        topic: 'customer-responses',
                        messages: [{
                            key: requestData.requestId,
                            value: JSON.stringify({
                                requestId: requestData.requestId,
                                sellerName: requestData.sellerName,
                                customers: customers,
                                timestamp: new Date().toISOString()
                            })
                        }]
                    });
                    
                    console.log(`✅ Published response to customer-responses topic for request ${requestData.requestId}`);
                } catch (error) {
                    console.error('❌ Error processing Kafka message:', error);
                }
            },
        });

        kafkaReady = true;
        console.log('✅ Kafka fully initialized');
    } catch (error) {
        console.error('❌ Error initializing Kafka:', error);
        // Don't exit - allow the service to run without Kafka in degraded mode
        setTimeout(initializeKafka, 5000); // Retry after 5 seconds
    }
}

// Helper function to calculate company size
const getSize = (customer) => {
    return customer.employees <= 100 ? "Small" : customer.employees <= 1000 ? "Medium" : "Big";
};

// Database query function
async function getCustomersFromDB() {
    try {
        const result = await pool.query('SELECT * FROM customers ORDER BY id');
        return result.rows.map(customer => ({
            id: customer.id,
            name: customer.name,
            employees: customer.employees,
            size: getSize(customer),
            contactInfo: customer.contact_name && customer.contact_email ? {
                name: customer.contact_name,
                email: customer.contact_email
            } : undefined
        }));
    } catch (error) {
        console.error('❌ Database query error:', error);
        throw error;
    }
}

// API Endpoints

// Health check endpoint
app.get('/health', async (req, res) => {
    const health = {
        status: 'UP',
        timestamp: new Date().toISOString(),
        services: {
            database: 'DOWN',
            kafka: kafkaReady ? 'UP' : 'DOWN'
        }
    };

    try {
        await pool.query('SELECT 1');
        health.services.database = 'UP';
    } catch (error) {
        console.error('Health check - Database error:', error);
    }

    const statusCode = health.services.database === 'UP' ? 200 : 503;
    res.status(statusCode).json(health);
});

// Main endpoint - Get customers for seller
app.post('/', async (req, res) => {
    const { name } = req.body;
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`📥 Received request from seller: ${name} (ID: ${requestId})`);

    try {
        // Publish event to Kafka
        if (kafkaReady) {
            await producer.send({
                topic: 'customer-requests',
                messages: [{
                    key: requestId,
                    value: JSON.stringify({
                        requestId: requestId,
                        sellerName: name,
                        timestamp: new Date().toISOString()
                    })
                }]
            });
            console.log(`✅ Published to Kafka: customer-requests topic`);
        } else {
            console.warn('⚠️  Kafka not ready, skipping message publishing');
        }

        // Fetch customers from database
        const customers = await getCustomersFromDB();

        // Return response
        const response = {
            name,
            timestamp: new Date().toDateString(),
            customers: customers
        };

        res.set('Access-Control-Allow-Origin', '*');
        return res.json(response);
    } catch (error) {
        console.error('❌ Error processing request:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Optional: Add new customer endpoint
app.post('/customers', async (req, res) => {
    const { name, employees, contactName, contactEmail } = req.body;

    if (!name || !employees) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['name', 'employees']
        });
    }

    try {
        const result = await pool.query(
            'INSERT INTO customers (name, employees, contact_name, contact_email) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, employees, contactName || null, contactEmail || null]
        );

        const newCustomer = result.rows[0];
        
        res.status(201).json({
            message: 'Customer created successfully',
            customer: {
                id: newCustomer.id,
                name: newCustomer.name,
                employees: newCustomer.employees,
                size: getSize(newCustomer),
                contactInfo: newCustomer.contact_name && newCustomer.contact_email ? {
                    name: newCustomer.contact_name,
                    email: newCustomer.contact_email
                } : undefined
            }
        });

        console.log(`✅ New customer created: ${newCustomer.name} (ID: ${newCustomer.id})`);
    } catch (error) {
        console.error('❌ Error creating customer:', error);
        res.status(500).json({
            error: 'Failed to create customer',
            message: error.message
        });
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM signal received: closing HTTP server and connections');
    try {
        await producer.disconnect();
        await consumer.disconnect();
        await pool.end();
        console.log('✅ All connections closed gracefully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

// Start server
app.listen(port, async () => {
    console.log(`🚀 Backend app listening on port ${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Initialize Kafka after server starts
    await initializeKafka();
});
