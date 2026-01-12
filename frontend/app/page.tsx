import Link from 'next/link';
import Image from 'next/image';


export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center py-8 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-5xl font-extrabold text-zinc-900 dark:text-white sm:text-6xl mb-4">
          든든남 <span className="text-blue-600">커뮤니티</span>
        </h1>
        <section className='flex gap-2'>
          <Link href="/signup" className="mt-8">
            <button className='bg-blue-500/20 border-2 border-blue-500  text-white px-16 py-2 rounded-lg'>회원가입</button>
          </Link>
          <Link href="/login" className="mt-8">
            <button className='bg-blue-500/20 border-2 border-blue-500  text-white px-16 py-2 rounded-lg'>로그인</button>
          </Link>
        </section>

        {/* 이미지 */}
        <div className='mt-12 w-full overflow-hidden'>
          <Image
            src="/brandCharacter.png" 
            alt="든든남 브랜드 캐릭터"
            width={1024}  // 규격의 가로 값
            height={1536} // 규격의 세로 값
            layout='responsive'
            className="-scale-x-100 transition-transform duration-500 hover:-scale-x-105 hover:scale-y-105"
            priority={true}
          />
        </div>
      </main>
    </div>
  );
}
