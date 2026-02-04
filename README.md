# Financial Dashboard

A full-stack financial portfolio dashboard built with **Next.js** (frontend) and **Node.js/Express** (backend).

## Features

- 📊 **Portfolio Overview**: Track total invested amount, current value, and profit/loss
- 🎯 **Sector Analysis**: Filter stocks by sector (Financial, Tech, Energy, etc.)
- ⚠️ **Smart Alerts**: Automatic alerts for "Must Exit" and "Stage-2" stocks
- 🔍 **Search & Filter**: Quickly find stocks by name or symbol
- 📈 **Key Metrics**: P/E ratio, EBITDA, growth rates, and more
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS

## Project Structure

```
Octa Byte/
├── backend/              # Node.js/Express API
│   ├── server.js         # Main server file
│   ├── dataParser.js     # Excel data parser
│   └── package.json
├── frontend/             # Next.js application
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and API client
│   └── package.json
└── E555815F_58D029050B.xlsx  # Stock data
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- The Excel data file in the root directory

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

The API will run on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The dashboard will run on `http://localhost:3000`

## API Endpoints

- `GET /api/stocks` - Get all stocks (with optional filters)
- `GET /api/stocks/:id` - Get single stock by ID
- `GET /api/stocks/sector/:name` - Get stocks by sector
- `GET /api/stocks/summary` - Get portfolio summary
- `GET /api/alerts` - Get portfolio alerts
- `GET /api/sectors` - Get list of all sectors

## Tech Stack

**Frontend:**
- Next.js 15
- TypeScript
- Tailwind CSS
- React

**Backend:**
- Node.js
- Express
- xlsx (for Excel parsing)
- CORS

## Development

To run both servers concurrently during development:

1. Terminal 1: `cd backend && npm run dev`
2. Terminal 2: `cd frontend && npm run dev`

## License

MIT
