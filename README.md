# 📖 Quranic

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js%2014-black?style=for-the-badge&logo=next.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

A modern Quran reading experience built with Next.js 14, featuring beautiful UI, audio recitations, translations, and more.

[✨ Live Demo](https://quranic-app.pages.dev/) | [Report Bug](https://github.com/yourusername/quranic-app/issues) | [Request Feature](https://github.com/yourusername/quranic-app/issues)

</div>

---

## ✨ Features

<table>
  <tr>
    <td>
      <ul>
        <li>📖 Beautiful Arabic typography</li>
        <li>🎧 Audio recitations</li>
        <li>📝 Multiple translations and tafsir</li>
        <li>🔍 Search verses and translations</li>
      </ul>
    </td>
    <td>
      <ul>
        <li>🌙 Dark mode support</li>
        <li>📱 Responsive design</li>
        <li>⚡ Fast and optimized performance</li>
        <li>📌 Bookmark verses</li>
        <li>🌐 PWA support for offline reading</li>
      </ul>
    </td>
  </tr>
</table>

## 🚀 Tech Stack

<table>
  <tr>
    <td>
      <ul>
        <li><b>Framework:</b> Next.js 14 (App Router)</li>
        <li><b>Styling:</b> Tailwind CSS</li>
        <li><b>UI Components:</b> ShadCN</li>
      </ul>
    </td>
    <td>
      <ul>
        <li><b>State Management:</b> React Context</li>
        <li><b>Database:</b> Supabase</li>
        <li><b>Authentication:</b> NextAuth.js</li>
        <li><b>Deployment:</b> Vercel</li>
      </ul>
    </td>
  </tr>
</table>

## 🛠️ Getting Started

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

## 📁 Project Structure

```
src/
├── app/                 # App router pages
├── components/          # Reusable components
├── lib/                 # Utility functions
├── styles/              # Global styles
└── types/               # TypeScript types
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Quran API providers
- ShadCN UI components
- Next.js team
- All contributors and supporters

## TODO 
- [ ] Mobile App for both Android and IOS using (lynx-app or React Native)
- [ ] Integrate Dua and Dhikir Page 
- [ ] Configure DB for all the Dua and Dhikir 
- [ ] Implement Ai into the app using the preset dataset 