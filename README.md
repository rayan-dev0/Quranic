# Quranic

A modern Quran reading experience built with Next.js 14, featuring beautiful UI, audio recitations, translations, and more.

## Features

- 📖 Read the Quran with beautiful Arabic typography
- 🎧 Listen to audio recitations
- 📝 Multiple translations and tafsir
- 🔍 Search verses and translations
- 🌙 Dark mode support
- 📱 Responsive design
- ⚡ Fast and optimized performance
- 📌 Bookmark verses
- 🌐 PWA support for offline reading

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** ShadCN
- **State Management:** React Context
- **Database:** Supabase
- **Authentication:** NextAuth.js
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/quranic-app.git
cd quranic-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # App router pages
├── components/          # Reusable components
├── lib/                 # Utility functions
├── styles/             # Global styles
└── types/              # TypeScript types
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Quran API providers
- ShadCN UI components
- Next.js team
- All contributors and supporters