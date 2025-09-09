import './globals.css'
import Navbar from './components/navbar'
import { AuthProvider } from './components/auth-context'
import ThemeToggle from './components/theme-toggle'
import { Poppins } from 'next/font/google'
import { cookies } from 'next/headers'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
})

export const metadata = {
  title: 'i-GraS',
  description: 'Penilaian Cerdas untuk Pembelajaran Efektif',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read resolved theme from cookie to align SSR with client
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme')?.value as 'dark' | 'light' | undefined;
  const initialThemeClass = themeCookie === 'light' ? 'theme-light' : 'theme-dark';
  return (
    <html lang="id" className={initialThemeClass} suppressHydrationWarning>
      <body className={`${poppins.className} ${poppins.variable} min-h-dvh`}>
        {/* Early theme sync to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var d=document;var cs=d.cookie||'';var m1=cs.match(/(?:^|; )theme=([^;]+)/);var theme=m1?decodeURIComponent(m1[1]):'';var m2=cs.match(/(?:^|; )themePref=([^;]+)/);var prefCookie=m2?decodeURIComponent(m2[1]):'';var lsPref=localStorage.getItem('themePref')||localStorage.getItem('theme')||'';var sys=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=theme||(prefCookie==='system'?(sys?'dark':'light'):(prefCookie||''));if(!resolved){var p=lsPref||'dark';resolved=p==='system'?(sys?'dark':'light'):p;}var cls=resolved==='dark'?'theme-dark':'theme-light';var r=d.documentElement;r.classList.remove('theme-dark','theme-light');r.classList.add(cls);}catch(e){}})();",
          }}
        />
        <AuthProvider>
          <Navbar />
          <main className="pt-28">{children}</main>
          <ThemeToggle />
        </AuthProvider>
      </body>
    </html>
  )
}
