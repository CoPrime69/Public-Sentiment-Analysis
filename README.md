# Public Sentiment Analysis on Governance Policies

## Overview

Public Sentiment Analysis is a powerful web application designed to analyze and visualize public opinion on governance policies using Twitter data and machine learning. The platform empowers policy makers, researchers, and analysts to gain valuable insights into how the public perceives various policies based on social media discussions.

## Features

- **Policy Management**: Create, edit, and manage governance policies with keywords for tracking
- **Twitter Data Collection**: Automatically collect tweets related to specific policies based on keywords
- **Real-time Sentiment Analysis**: Analyze tweet sentiment using state-of-the-art machine learning models
- **Interactive Dashboard**: Visualize sentiment trends with charts and graphs
- **Sentiment Distribution**: View positive, negative, and neutral sentiment percentages
- **Temporal Analysis**: Track sentiment changes over different timeframes
- **Word Cloud**: Identify frequently mentioned terms in policy discussions
- **Manual Testing**: Test sentiment analysis on custom text inputs

## Technology Stack

- **Frontend**: React, Next.js, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Prisma ORM
- **Authentication**: NextAuth.js
- **Machine Learning**: Hugging Face Transformers, @xenova/transformers
- **Data Visualization**: Recharts
- **API Integration**: Twitter API v2

## System Architecture

The application follows a modern architecture with the following components:

1. **Client Layer**: React components with Next.js for SSR/SSG
2. **API Layer**: Next.js API routes for handling requests
3. **Service Layer**: Business logic for sentiment analysis and data processing
4. **Data Layer**: MongoDB database with Prisma ORM for data access
5. **External Services**: Twitter API integration, ML model for sentiment analysis

## Setup & Installation

### Prerequisites

- Node.js 16.x or later
- MongoDB instance (local or Atlas)
- Twitter API credentials

### Installation Steps

```bash
cd Public-Sentiment-Analysis

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env.local

# Edit .env.local with your credentials

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

## Environment Configuration

Create a `.env.local` file with the following variables:

```
# Database
DATABASE_URL="mongodb+srv://yourusername:password@cluster0.mongodb.net/sentiment_db?retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Twitter API
TWITTER_BEARER_TOKEN="your-twitter-bearer-token"
```

## Usage Guide

### Creating a Policy

1. Navigate to the Policies page
2. Click "Add New Policy"
3. Enter policy details:
   - Name
   - Description
   - Keywords (comma-separated)
4. Save the policy

### Analyzing Sentiment for a Policy

1. Go to the Policies page
2. Find your policy and click "Analyze"
3. Click "Collect and Analyze Tweets"
4. Wait for tweets to be collected and analyzed
5. View the results on the dashboard

### Using the Dashboard

1. Navigate to the Dashboard
2. Select a policy from the selector
3. View sentiment distribution in pie charts
4. Explore sentiment trends over time
5. Switch between timeframes (Week, Month, All Time)
6. Check word frequency in the Word Cloud

## Testing Sentiment Analysis Manually

The application provides a convenient way to test and understand how the sentiment analysis model works with different text inputs:

1. Navigate to the Test Sentiment page
2. Enter any text in the input box (like a tweet or comment)
3. Click "Analyze" to process the text
4. View the sentiment result immediately:
   - Positive, Negative, or Neutral classification
   - Confidence score for the prediction
   - Visual indicator of sentiment strength
5. Try different phrasings to see how they affect results
6. Use this tool to calibrate your understanding of how the model interprets different expressions

## Workflow Explanation

1. **Policy Creation**: Define a policy with relevant keywords
2. **Data Collection**: System collects tweets matching policy keywords via Twitter API
3. **Sentiment Analysis**: Worker processes tweets through ML model for sentiment scoring
4. **Data Storage**: Results are stored in MongoDB
5. **Visualization**: Dashboard displays processed results with various charts and metrics

## Data Models

The application uses the following data models:

- **User**: Authentication information
- **Policy**: Government policies with keywords for tracking
- **Tweet**: Twitter data related to specific policies
- **Sentiment**: Sentiment analysis results for each tweet

## API Routes

### Policy Management

- 🔹 GET `/api/policies` : List all policies
- 🔹 POST `/api/policies` : Create a new policy
- 🔹 GET `/api/policies/[id]` : Get policy details
- 🔹 PUT `/api/policies/[id]` : Update policy
- 🔹 DELETE `/api/policies/[id]` : Delete policy

### Twitter Integration

- 🔹 POST `/api/twitter` : Fetch tweets by keywords

### Sentiment Analysis

- 🔹 POST `/api/sentiment` : Analyze sentiment for text
- 🔹 GET `/api/sentiment/stats` : Get sentiment statistics
- 🔹 GET `/api/sentiment/trend` : Get sentiment trends over time
- 🔹 POST `/api/sentiment/test-sentiment` : Test sentiment analysis on text

### Tweet Management

- 🔹 POST `/api/tweets` : Save tweets with sentiment analysis
- 🔹 GET `/api/tweets` : Get tweets for a policy

## Component Structure

```
src/
├── api/                      🔹 API routes
├── components/
│   ├── dashboard/            🔹 Dashboard components
│   ├── layout/               🔹 Layout components
│   ├── policy/               🔹 Policy management components
│   └── ui/                   🔹 UI components
├── lib/
│   ├── db.ts                 🔹 Database utilities
│   ├── twitter.ts            🔹 Twitter API utilities
│   ├── sentiment.ts          🔹 Sentiment analysis utilities
│   └── sentiment-worker.ts   🔹 Sentiment worker
```

## Future Improvements

- Add support for multilingual sentiment analysis
- Implement real-time Twitter stream processing
- Add more advanced NLP features like entity recognition
- Create export functionality for reports
- Implement user roles and permissions
- Add comparison features between different policies
- Integrate additional social media platforms

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgements

- Next.js
- Prisma
- Hugging Face
- Twitter API
- Recharts
- TailwindCSS
