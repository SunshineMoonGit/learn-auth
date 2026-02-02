function Page() {
  return (
  <main className="max-w-3xl mx-auto py-32 px-4">
    <h1>로그인</h1>
      <form action="" className="flex flex-col gap-4 mt-4 border border-white/50 p-4 rounded-lg">
        <label htmlFor="id">아이디</label>
        <input type="text" id="id" className="border border-blue-500 rounded-2xl bg-amber-50/20 h-10 px-2.5"/>
        <label htmlFor="password">비밀번호</label>
        <input type="password" id="password"className="border border-blue-500 rounded-2xl bg-amber-50/20 h-10 px-2.5"/>
        <button type="submit" className="bg-blue-500 h-10 rounded-2xl font-bold">로그인</button>
      </form>
  </main>    
  );
}

export default Page;