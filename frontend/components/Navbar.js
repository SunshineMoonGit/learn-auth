// components/Navbar.js
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-8 py-4  text-white">
      <div className="text-xl font-bold">
        <Link href="/">든든남 커뮤니티</Link>
      </div>
      <ul className="flex gap-6">
        <li><Link href="/" className="hover:text-blue-400">Home</Link></li>
        <li><Link href="/signup" className="hover:text-blue-400">회원가입</Link></li>
      </ul>
    </nav>
  );
}