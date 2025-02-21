# NBA Stats Dashboard

A real-time NBA statistics dashboard built with Next.js, showcasing today's top performers across multiple statistical categories.

![Screenshot 2025-02-20 at 4 23 28 AM](https://github.com/user-attachments/assets/fe410d8f-4180-4931-ad92-2ff7cc01cbfb)

## Features

- 🏀 Real-time NBA statistics
- 📊 Multiple statistical categories (Points, Rebounds, Assists, etc.)
- 📱 Responsive design
- 🎯 Interactive sorting and filtering
- 🔄 Auto-refreshing data (60-second intervals)
- 💫 Smooth animations and transitions
- 📋 Comprehensive stats table view

## Tech Stack

- **Frontend Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Data Source**: [nba_api](https://github.com/swar/nba_api)
- **UI Components**: Radix UI
- **Language**: TypeScript

## Prerequisites

Before running this project, make sure you have:

- Node.js (v18 or higher)
- Python 3.x
- pip (Python package manager)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/aradpey/nba-todays-leaders.git
cd nba-todays-leaders
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Install Node.js dependencies:

```bash
npm install
```

4. Connect to GitHub (if setting up from scratch):

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/aradpey/nba-todays-leaders.git
git push -u origin main
```

## Running the Application

1. Start the development server:

```bash
npm run dev
```

2. Open your browser and navigate to:

```
http://localhost:3000
```

## Project Structure

```
basket/
├── app/                  # Next.js app directory
├── api/                  # Serverless API functions
├── components/          # React components
├── public/             # Static assets
└── styles/            # Global styles
```

## Key Components

- `LeaderboardDashboard`: Main dashboard component
- `IntroAnimation`: Loading and intro animations
- `api/stats.py`: NBA API integration and serverless function

## Data Refresh

The dashboard automatically refreshes data every 60 seconds to ensure up-to-date statistics.

## Special Thanks

This project makes extensive use of the [nba_api](https://github.com/swar/nba_api) Python package, which provides access to NBA statistics. Special thanks to the maintainers of this incredible resource.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Vital Information Needed

Before committing, please ensure you have:

1. NBA API access (no authentication required)
2. Python 3.x installed with pip
3. Node.js v18 or higher
4. Sufficient system memory (recommended: 4GB or more)
5. A modern web browser for optimal viewing

## Known Limitations

- The NBA API may have rate limiting
- Statistics are only available for active game days
- Some player images may not be available

## Support

For support, please open an issue in the repository.

## Support

For support, please open an issue in the repository.

## Patch Notes

### v0.1.1 (Latest)

- Enhanced visual effects for top performers:
  - Added dynamic glowing borders for top 3 players in each category
  - Gold border with pulsing glow effect for 1st place
  - Silver border with pulsing glow effect for 2nd place
  - Bronze border with pulsing glow effect for 3rd place
  - Increased glow spread and blur effects for more dramatic visual impact
  - Subtle gradient overlays to enhance depth
  - Added corner decorations for top 3 positions
- Improved loading animation:
  - Added blurred NBA logo in background
  - Synchronized pulsing animations
  - Increased logo sizes for better visibility
- UI/UX improvements:
  - Enhanced card layouts with backdrop blur effects
  - Improved responsive design for various screen sizes
  - Added smooth transitions between states

### v0.1.0 (Initial Release)

- Real-time NBA statistics dashboard
- Multiple statistical categories
- Interactive sorting and filtering
- Auto-refreshing data
- Responsive design
- Player images and team logos integration
- Complete stats table view
