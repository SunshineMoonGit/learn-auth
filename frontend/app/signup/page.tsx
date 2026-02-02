function Page() {
  return (
  <main className="max-w-3xl mx-auto py-32 px-4">
    <h1>환영합니다. 든든남 커뮤니티는 90kg이상만 가입이 가능합니다</h1>
    <form action="" className="flex flex-col gap-4 mt-4 border border-white/50 p-4 rounded-lg">

      <label htmlFor="id">아이디</label>
      <div className="flex flex-col gap-2">
      <input type="text" id="id" className="border border-blue-500 rounded-2xl bg-amber-50/20 h-10 px-2.5"/>
      <button type="button" className="px-4 bg-gray-600 rounded-2xl text-sm h-8">중복확인</button>
      </div>
      <label htmlFor="password">비밀번호</label>
      <input type="password" id="password"className="border border-blue-500 rounded-2xl bg-amber-50/20 h-10 px-2.5"/>
      <label htmlFor="weight">몸무게</label>
      <input type="number" id="weight" min={90} className="border border-blue-500 rounded-2xl bg-amber-50/20 h-10 px-2.5"/>
      <button type="submit" className="bg-blue-500 h-10 rounded-2xl font-bold">회원가입</button>
    </form>
  </main>);
}

export default Page;