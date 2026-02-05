# Dynamic Stock Portfolio Dashboard

A real-time stock portfolio dashboard built with Next.js, React, TypeScript, Tailwind CSS, and Node.js. The application displays portfolio holdings with live market data fetched from Yahoo Finance API.

## Features

- **Real-time Stock Prices**: Live CMP (Current Market Price) from Yahoo Finance
- **Auto-refresh**: Data updates every 15 seconds with visual countdown
- **Portfolio Analytics**: Track investments, current value, P&L, and returns
- **Sector Grouping**: View stocks grouped by sector with sector-level summaries
- **Visual Indicators**: Green/Red color coding for gains and losses
- **Search & Filter**: Search stocks by name, symbol, or sector
- **Sortable Columns**: Sort by any column (name, invested, CMP, P&L, etc.)
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime
- **Express 5** - Web framework
- **Yahoo Finance 2** - Live stock data
- **xlsx** - Excel file parsing

## Project Structure

```
├── frontend/                # Next.js frontend application
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   │   ├── PortfolioTable.tsx
│   │   ├── SummaryCards.tsx
│   │   ├── Analytics.tsx
│   │   └── StockCard.tsx
│   ├── lib/                 # Utilities and API client
│   └── public/              # Static assets
│
├── backend/                 # Node.js backend API
│   ├── server.js           # Express server
│   ├── dataParser.js       # Excel data parser
│   └── data/               # Excel data files
│
└── vercel.json             # Vercel deployment config
```

## Installation

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend server will start at `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:3000`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stocks` | GET | Get all stocks with live prices |
| `/api/stocks/summary` | GET | Get portfolio summary |
| `/api/alerts` | GET | Get portfolio alerts (must exit, stage-2) |
| `/api/sectors` | GET | Get list of all sectors |
| `/api/live-status` | GET | Get live data status |
| `/api/refresh-prices` | POST | Force refresh stock prices |
| `/health` | GET | Health check endpoint |

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (.env)
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## Deployment

### Backend (Render)

1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Deploy

### Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Next.js
4. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL` = Your Render backend URL
5. Deploy

## Portfolio Table Columns

| Column | Description |
|--------|-------------|
| Particulars | Stock name |
| Sector | Industry sector |
| Buy Price | Purchase price per share |
| Qty | Number of shares |
| Invested | Total investment (Buy Price × Qty) |
| Weight | Portfolio percentage |
| Exch | Exchange (NSE/BSE) |
| CMP | Current Market Price (Live) |
| Value | Current value (CMP × Qty) |
| P&L | Profit/Loss with percentage |
| P/E | Price to Earnings ratio |
| EPS | Earnings Per Share |

## Screenshots

### Summary Cards
- Invested amount with holdings count
- Current market value
- Total P&L (profit/loss)
- Overall returns percentage

### Sector View
- Collapsible sector groups
- Sector-level summaries
- Color-coded borders per sector

### All Stocks View
- Flat table with all holdings
- Sortable columns
- Search functionality

## Technical Challenges & Solutions

### 1. Yahoo Finance API
Yahoo Finance doesn't have an official public API. Solution: Using the `yahoo-finance2` unofficial library with NSE/BSE symbol mapping.

### 2. Symbol Mapping
Excel data contains BSE codes, but Yahoo Finance works better with NSE symbols. Solution: Created a comprehensive `SYMBOL_MAP` to convert BSE codes to NSE tickers.

### 3. Rate Limiting
To prevent API blocks, implemented:
- 1-minute cache for live prices
- Batch processing for stock updates

### 4. Real-time Updates
Using `setInterval` for 15-second refresh cycles with visual countdown timer.

## License

ISC

## Author

Built for Octa Byte AI Pvt Ltd - Case Study Assignment
