import Link from 'next/link';
// import Image from 'next/image';


export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center py-8 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-5xl font-extrabold text-zinc-900 dark:text-white sm:text-6xl mb-4">
          매집비 <span className="text-blue-600">프로그램</span>
        </h1>
        <section className='flex gap-2'>
          <Link href="/main" className="mt-8">
            <button className='bg-blue-500/20 border-2 border-blue-500  text-white px-16 py-2 rounded-lg'>매집비</button>
          </Link>
          <Link href="/signup" className="mt-8">
            <button className='bg-blue-500/20 border-2 border-blue-500  text-white px-16 py-2 rounded-lg'>회원가입</button>
          </Link>
          <Link href="/login" className="mt-8">
            <button className='bg-blue-500/20 border-2 border-blue-500  text-white px-16 py-2 rounded-lg'>로그인</button>
          </Link>
        </section>

        {/* 이미지 */}
        <div className='mt-12 w-full overflow-hidden'>

        </div>
      </main>
    </div>
  );
}
