import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0A1020] text-gray-200">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-white">About This Project</h1>
          
          <div className="bg-[#0F172A] rounded-xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">The Quran App</h2>
            <p className="mb-4 leading-relaxed">
              This application was created to provide a beautiful, accessible way to read and listen to the Quran. 
              The app features a clean interface for reading the Quran with translations, audio recitations by various reciters, 
              and a user-friendly navigation system.
            </p>
            <p className="mb-4 leading-relaxed">
              Built with Next.js, TailwindCSS, and deployed on Cloudflare Pages, this app aims to be fast, 
              responsive, and accessible across all devices.
            </p>
          </div>
          
          <div className="bg-[#0F172A] rounded-xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Developer</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white">
                R
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Rayan</h3>
                <a 
                  href="https://github.com/rayan-dev0" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                  @rayan-dev0
                </a>
              </div>
            </div>
            <div className="bg-[#1a2234] rounded-lg p-4">
              <h4 className="text-lg font-medium mb-2 text-blue-300">Tech Stack</h4>
              <div className="flex flex-wrap gap-2">
                {["HTML5", "TypeScript", "Next.js", "React", "TailwindCSS", "Cloudflare Pages"].map((tech) => (
                  <span key={tech} className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-[#0F172A] rounded-xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Source Code & Contributions</h2>
            <p className="mb-4 leading-relaxed">
              This project is open-source and contributions are welcome. Visit the GitHub repository to contribute, 
              report issues, or suggest improvements.
            </p>
            <div className="flex justify-center">
              <Link 
                href="/"
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 