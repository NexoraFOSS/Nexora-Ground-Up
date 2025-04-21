# THIS IS A VERSION OF NEXORA BUILT FROM THE GROUND-UP! IT IS IN ALPHA STAGES AND IS NOT COMPLETE

# Nexora - Game Server Management Client Area

Nexora is a full-stack web application that serves as a modern client area for managing game servers hosted via Pterodactyl Panel. It provides a comprehensive dashboard for users to manage their game servers, billing, and support tickets.

## Features

- **User Authentication**: Secure login, registration, and account management
- **Server Management**: View and control game servers via Pterodactyl Panel API
- **Performance Monitoring**: Real-time statistics and historical performance data
- **Billing System**: Subscription management and payment processing with Stripe
- **Support System**: Built-in ticketing system for customer support
- **Responsive Design**: Modern interface that works across devices

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Pterodactyl Panel (with API access)
- Stripe account (for payment processing)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/nexora.git
   cd nexora
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Edit the `config.js` file in the project root to update your configuration:
   ```javascript
   /**
    * Nexora Configuration
    * 
    * This file contains all configuration for the Nexora application.
    * You can modify these values directly or override them with environment variables.
    */
   import dotenv from 'dotenv';

   // Load environment variables from .env file if present (optional)
   dotenv.config();

   const config = {
     // Application settings
     app: {
       name: process.env.APP_NAME || 'Nexora',
       port: parseInt(process.env.PORT || '5000'),
       env: process.env.NODE_ENV || 'development',
       trustProxy: process.env.TRUST_PROXY === 'true'
     },
     
     // Database configuration
     database: {
       uri: process.env.DATABASE_URL,
       host: process.env.PGHOST || 'localhost',
       port: parseInt(process.env.PGPORT || '5432'),
       name: process.env.PGDATABASE || 'nexora',
       user: process.env.PGUSER || 'postgres',
       password: process.env.PGPASSWORD || 'postgres'
     },
     
     // Session configuration
     session: {
       secret: process.env.SESSION_SECRET || 'nexora-session-secret-dev-only',
       maxAge: parseInt(process.env.SESSION_MAX_AGE || (30 * 24 * 60 * 60 * 1000).toString()) // 30 days
     },
     
     // Pterodactyl Panel API
     pterodactyl: {
       baseUrl: process.env.PTERODACTYL_URL || 'https://panel.example.com',
       adminApiKey: process.env.PTERODACTYL_ADMIN_KEY
     },
     
     // Stripe payment processing
     stripe: {
       secretKey: process.env.STRIPE_SECRET_KEY,
       publicKey: process.env.STRIPE_PUBLIC_KEY,
       webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
       pricePlanId: process.env.STRIPE_PRICE_PLAN_ID
     }
   };

   export default config;
   ```

4. Initialize the database:
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Access the application at `http://localhost:5000`

### Building for Production

1. Build the application:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm run start
   ```

## Configuration

All application configuration is centralized in the `config.js` file located in the project root. This makes it easy to modify settings in one place while still allowing for environment variable overrides when desired.

### Configuration Structure

The configuration is organized into logical sections:

```javascript
const config = {
  app: { /* Application settings */ },
  database: { /* Database connection info */ },
  session: { /* Session settings */ },
  pterodactyl: { /* Pterodactyl panel integration */ },
  stripe: { /* Payment processing settings */ }
};
```

### Configuration Options

#### App Settings

| Config Path | Description | Default |
|-------------|-------------|---------|
| `app.name` | Application name | 'Nexora' |
| `app.port` | Port number for the server | 5000 |
| `app.env` | Environment (development/production) | 'development' |
| `app.trustProxy` | Whether to trust proxy headers | false |

#### Database Settings

| Config Path | Description | Default |
|-------------|-------------|---------|
| `database.uri` | PostgreSQL connection string | null |
| `database.host` | PostgreSQL host | 'localhost' |
| `database.port` | PostgreSQL port | 5432 |
| `database.name` | PostgreSQL database name | 'nexora' |
| `database.user` | PostgreSQL username | 'postgres' |
| `database.password` | PostgreSQL password | 'postgres' |

#### Session Settings

| Config Path | Description | Default |
|-------------|-------------|---------|
| `session.secret` | Secret for session encryption | 'nexora-session-secret-dev-only' |
| `session.maxAge` | Session duration in milliseconds | 2592000000 (30 days) |

#### Pterodactyl Settings

| Config Path | Description | Default |
|-------------|-------------|---------|
| `pterodactyl.baseUrl` | Pterodactyl Panel URL | 'https://panel.example.com' |
| `pterodactyl.adminApiKey` | Admin API key for Pterodactyl | null |

#### Stripe Settings

| Config Path | Description | Default |
|-------------|-------------|---------|
| `stripe.secretKey` | Stripe Secret Key | null |
| `stripe.publicKey` | Stripe Publishable Key | null |
| `stripe.webhookSecret` | Stripe Webhook Secret | null |
| `stripe.pricePlanId` | Stripe Price ID for subscription | null |

### Using Environment Variables

While the `config.js` file contains all settings with defaults, you can still use environment variables to override these values. This is especially useful in production environments where sensitive values like API keys should not be stored in the code.

You can use a `.env` file in development for this purpose:

```
# Basic app settings
APP_NAME=My Game Hosting
PORT=8080

# Pterodactyl integration
PTERODACTYL_URL=https://mypanel.example.com
PTERODACTYL_ADMIN_KEY=ptla_your_key_here

# Stripe payment processing
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLIC_KEY=pk_test_your_key_here
```

## Project Structure

```
nexora/
├── client/               # Frontend code (React)
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── pages/            # Page components
│   └── App.tsx           # Main component & routing
├── server/               # Backend code (Express)
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database operations
│   ├── auth.ts           # Authentication logic
│   ├── pterodactyl.ts    # Pterodactyl API integration
│   ├── billing.ts        # Stripe payment logic
│   └── tickets.ts        # Support ticketing system
├── shared/               # Shared code
│   └── schema.ts         # Database schema definitions
├── config.js             # Application configuration
├── .env                  # Environment variables (not in repo)
└── package.json          # Dependencies and scripts
```

## API Documentation

The application provides RESTful APIs for all its functionality:

### Authentication API

- `POST /api/register` - Register a new user
- `POST /api/login` - Authenticate a user
- `POST /api/logout` - End a user session
- `GET /api/user` - Get current user information

### Server Management API

- `GET /api/servers` - List all user's servers
- `GET /api/servers/:id` - Get server details
- `GET /api/server-stats` - Get server statistics
- `POST /api/servers/:id/power` - Control server power state
- `POST /api/servers/:id/command` - Execute a server command

### Billing API

- `GET /api/subscription` - Get user subscription details
- `GET /api/subscription-plans` - List available plans
- `GET /api/invoices` - List user invoices
- `POST /api/change-plan` - Change subscription plan
- `POST /api/cancel-subscription` - Cancel subscription
- `POST /api/create-payment-intent` - Create a payment intent
- `POST /api/get-or-create-subscription` - Manage subscriptions

### Support Ticket API

- `GET /api/tickets` - List user tickets
- `GET /api/tickets/:id` - Get ticket details
- `POST /api/tickets` - Create a new ticket
- `PATCH /api/tickets/:id` - Update ticket status
- `POST /api/tickets/:id/replies` - Add reply to ticket

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push schema changes to database

### Technology Stack

- **Frontend**: React, TailwindCSS, Shadcn UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL, Drizzle ORM
- **Authentication**: Session-based with Passport.js
- **API Integration**: Pterodactyl API, Stripe API
- **Build Tools**: Vite, TypeScript

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Support

If you encounter any problems or have questions, please open an issue on the GitHub repository.
