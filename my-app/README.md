# Temperature Trend Analysis System

A web-based application for analyzing and predicting temperature trends in the Philippines using historical data and advanced statistical models.

## Features

- **Two Prediction Models**:
  - Polynomial Regression (2nd degree)
  - 5-Year Moving Average

- **Interactive Visualization**:
  - Historical temperature data
  - 5-year smoothed trends
  - Prediction trend lines
  - Dynamic chart scaling

- **User-Friendly Interface**:
  - Model selection dropdown
  - Year input validation (2024-2100)
  - Real-time calculation feedback
  - Detailed results display

## Technology Stack

- Next.js 13+ (React Framework)
- TypeScript
- Supabase (Authentication & Database)
- Chart.js with react-chartjs-2
- Tailwind CSS
- shadcn/ui Components

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create `.env.local` file
   - Add Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Features in Detail

### Temperature Prediction
- Uses historical temperature data from the Philippines
- Provides two different prediction models for comparison
- Validates predictions against historical ranges
- Shows confidence metrics for predictions

### Data Visualization
- Interactive line charts
- Multiple data series display
- Automatic scale adjustment
- Trend line visualization

### User Authentication
- Secure sign-up/sign-in
- Protected routes
- Password reset functionality

## Project Structure

```
my-app/
├── app/                 # Next.js app directory
├── components/         # React components
├── utils/             # Utility functions
└── public/            # Static assets
```

## Contributing

This project is part of an academic requirement and is not open for contributions at this time.

## License

This project is created for academic purposes only.
