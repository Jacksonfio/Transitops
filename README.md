# 🚚 TransitOps: AI-Powered Fleet & Transport Management

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**TransitOps** is an enterprise-grade, comprehensive fleet operations management platform. Built to streamline logistics, it integrates real-time tracking, vehicle registry management, driver coordination, AI-powered dispatching, and intelligent insights to optimize your transportation network.

## ✨ Features

- **Dashboard & Analytics**: Real-time operational insights via advanced data visualization and fleet utilization tracking.
- **AI-Powered Command Center**: Leverage Gemini AI for an intelligent operations copilot, dispatch optimization, anomaly detection, and predictive maintenance.
- **Vehicle Registry Management**: Track fleet health, registration, insurance schedules, and odometer readings.
- **Driver Management**: Manage assignments, licenses, safety scores, and automated alerts for expiring credentials.
- **Maintenance & Fuel Logs**: Record expenses, log fuel efficiency, and automate maintenance scheduling.
- **Trip Dispatcher**: Ensure business rules compliance before finalizing dispatch, complete with real-time cargo tracking.

## 🛠 Tech Stack

- **Frontend**: React (v19), TypeScript, Tailwind CSS, Lucide Icons, Recharts, Framer Motion
- **Backend Framework**: Express.js with Vite Middleware for SPA
- **AI Integration**: Google Generative AI (Gemini) SDK
- **Build Tool**: Vite & Node.js

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- A Gemini API Key for AI features

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Jacksonfio/Transitops.git
   cd fleet-and-transport-manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` or `.env.local` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

5. **Access the Platform:**
   Navigate to `http://localhost:3000` in your browser.
   - **Demo Email:** `admin@transitops.com`
   - **Demo Password:** `TransitOps@2026`

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Jacksonfio/Transitops/issues).

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
