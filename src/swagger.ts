import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import path from 'path';

// Use environment variable for server URL, default to localhost for development
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8000';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'User Authentication and Progress API',
            version: '1.0.0',
            description: 'API for user authentication and progress tracking',
        },
        servers: [
            {
                url: SERVER_URL,
                description: 'Primary server (local dev or deployed)',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: [
        path.resolve(__dirname, 'routes', '*.ts'),    // Absolute path to src/routes/
        path.resolve(__dirname, 'controllers', '*.ts'), // Absolute path to src/controllers/
    ],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

// Debug: Log the generated spec
//console.log('Swagger Spec:', JSON.stringify(swaggerSpec, null, 2));
