'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Calculator, TrendingUp, Users, Target, Info, RefreshCw, AlertCircle, CheckCircle2, ArrowRight, Search, Loader2, Key, ToggleLeft, ToggleRight } from 'lucide-react';

// ============================================
// 타입 정의
// ============================================
interface StockInfo {
  name: string;
  marketCap: number;
  price: number;
  startDate: string;
  endDate: string;
}

interface Broker {
  name: string;
  buyVol: number;
  sellVol: number;
}

interface AnalysisResult {
  grades: string[];
  details: {
    buySellRatio: string;
    multiAccumulationRatio: string;
    singleAccumulationRatio: string;
    totalNetBuyVol: number;
    maxSingleNetBuy: number;
  };
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ============================================
// 한국투자증권 API 서비스
// ============================================
const TOKEN_STORAGE_KEY = 'kis_access_token';
const TOKEN_EXPIRY_KEY = 'kis_token_expiry';

class KISApiService {
  private baseUrl: string;
  private appKey: string;
  private appSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_KIS_BASE_URL || 'https://openapi.koreainvestment.com:9443';
    this.appKey = process.env.NEXT_PUBLIC_KIS_APP_KEY || '';
    this.appSecret = process.env.NEXT_PUBLIC_KIS_APP_SECRET || '';

    // localStorage에서 토큰 불러오기
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

      if (storedToken && storedExpiry) {
        const expiryDate = new Date(storedExpiry);
        if (new Date() < expiryDate) {
          this.accessToken = storedToken;
          this.tokenExpiry = expiryDate;
          console.log('토큰 복원됨 (localStorage에서)');
        } else {
          // 만료된 토큰 삭제
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(TOKEN_EXPIRY_KEY);
        }
      }
    }
  }

  // API 키가 설정되었는지 확인
  isConfigured(): boolean {
    return this.appKey !== '' &&
      this.appKey !== 'your_app_key_here' &&
      this.appSecret !== '' &&
      this.appSecret !== 'your_app_secret_here';
  }

  // Access Token 발급 (API Route를 통해 CORS 우회)
  async getAccessToken(): Promise<string> {
    // 기존 토큰이 유효하면 재사용
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      console.log('캐시된 토큰 사용');
      return this.accessToken;
    }

    console.log('새 토큰 발급 요청...');

    // Next.js API Route를 통해 토큰 발급 (CORS 문제 해결)
    const response = await fetch('/api/auth/token', {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `토큰 발급 실패: ${response.status}`);
    }

    const data: TokenResponse = await response.json();
    this.accessToken = data.access_token;
    // 토큰 만료 시간 설정 (안전하게 23시간으로 설정)
    this.tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);

    // localStorage에 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, this.accessToken);
      localStorage.setItem(TOKEN_EXPIRY_KEY, this.tokenExpiry.toISOString());
      console.log('토큰 저장됨 (localStorage에)');
    }

    return this.accessToken;
  }

  // 토큰 정보 가져오기 (디버깅용)
  getTokenInfo(): { hasToken: boolean; expiry: Date | null } {
    return {
      hasToken: !!this.accessToken,
      expiry: this.tokenExpiry,
    };
  }

  // 토큰 초기화
  clearToken(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
  }
}

// API 서비스 인스턴스 (싱글톤)
const kisApi = new KISApiService();

// ============================================
// 매집비 등급 계산 로직
// ============================================
const calculateGrade = (stockInfo: StockInfo, brokers: Broker[], floatingShares: number): AnalysisResult | null => {
  if (!brokers || brokers.length === 0 || !floatingShares) {
    return null;
  }

  // 1. 큰손 정의 (순매수량이 양수인 상위 거래원들을 '매수 우위 큰손'으로 가정)
  const totalBuyVol = brokers.reduce((acc, cur) => acc + cur.buyVol, 0);
  const totalSellVol = brokers.reduce((acc, cur) => acc + cur.sellVol, 0);

  const buySellRatio = totalSellVol > 0 ? (totalBuyVol / totalSellVol) * 100 : 0;

  let grade1 = 'C';
  if (buySellRatio >= 300) grade1 = 'A';
  else if (buySellRatio >= 200) grade1 = 'B';
  else if (buySellRatio >= 100) grade1 = 'C';
  else grade1 = 'D';

  // 2. 두 번째 알파벳: 다수 큰손이 여러 증권사를 통해 매집한 수량 (유통주식수 대비)
  const positiveNetBuys = brokers.filter(b => (b.buyVol - b.sellVol) > 0);
  const totalNetBuyVol = positiveNetBuys.reduce((acc, cur) => acc + (cur.buyVol - cur.sellVol), 0);
  const multiAccumulationRatio = (totalNetBuyVol / floatingShares) * 100;

  let grade2 = 'C';
  if (multiAccumulationRatio >= 5) grade2 = 'A';
  else if (multiAccumulationRatio >= 3.05) grade2 = 'B';
  else grade2 = 'C';

  // 3. 세 번째 알파벳: 특정 큰손(단일 창구)이 매집한 수량 (유통주식수 대비)
  const netBuys = brokers.map(b => b.buyVol - b.sellVol);
  const maxSingleNetBuy = netBuys.length > 0 ? Math.max(...netBuys) : 0;
  const singleAccumulationRatio = (maxSingleNetBuy / floatingShares) * 100;

  let grade3 = 'C';
  if (singleAccumulationRatio >= 5) grade3 = 'A';
  else if (singleAccumulationRatio >= 3.05) grade3 = 'B';
  else grade3 = 'C';

  return {
    grades: [grade1, grade2, grade3],
    details: {
      buySellRatio: buySellRatio.toFixed(2),
      multiAccumulationRatio: multiAccumulationRatio.toFixed(2),
      singleAccumulationRatio: singleAccumulationRatio.toFixed(2),
      totalNetBuyVol,
      maxSingleNetBuy
    }
  };
};

// ============================================
// 메인 컴포넌트
// ============================================
export default function MaejipbiApp() {
  // 모드 상태 (자동/수동)
  const [isAutoMode, setIsAutoMode] = useState(true);

  // API 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // 종목 검색 상태
  const [searchCode, setSearchCode] = useState('');
  const [searchStartDate, setSearchStartDate] = useState('20240101');
  const [searchEndDate, setSearchEndDate] = useState('20240131');

  // 상태 관리
  const [stockInfo, setStockInfo] = useState<StockInfo>({
    name: '',
    marketCap: 0,
    price: 0,
    startDate: '',
    endDate: ''
  });

  const [manualFloatingShares, setManualFloatingShares] = useState<number>(0);

  const [calcHelper, setCalcHelper] = useState({
    issuedShares: 0,
    floatingRatio: 0
  });

  const floatingShares = useMemo(() => {
    if (calcHelper.issuedShares > 0 && calcHelper.floatingRatio > 0) {
      return Math.floor(calcHelper.issuedShares * (calcHelper.floatingRatio / 100));
    }
    return manualFloatingShares;
  }, [calcHelper, manualFloatingShares]);

  const [brokers, setBrokers] = useState<Broker[]>([]);

  const result = useMemo(() => {
    if (brokers.length > 0) {
      return calculateGrade(stockInfo, brokers, floatingShares);
    }
    return null;
  }, [brokers, stockInfo, floatingShares]);

  // ============================================
  // API 호출 함수들
  // ============================================

  // 토큰 발급 테스트
  const handleTestToken = useCallback(async () => {
    if (!kisApi.isConfigured()) {
      setError('.env.local 파일에 API 키를 설정해주세요.');
      return;
    }

    setTokenStatus('loading');
    setError(null);

    try {
      await kisApi.getAccessToken();
      setTokenStatus('success');
    } catch (err) {
      setTokenStatus('error');
      setError(err instanceof Error ? err.message : '토큰 발급 실패');
    }
  }, []);

  // 종목 검색 및 분석
  const handleSearch = useCallback(async () => {
    if (!searchCode.trim()) {
      setError('종목코드를 입력해주세요.');
      return;
    }

    // if (!kisApi.isConfigured()) {
    //   setError('.env.local 파일에 API 키를 설정해주세요.');
    //   return;
    // }

    setIsLoading(true);
    setError(null);

    try {
      // 1. 토큰 발급 확인 (localStorage에서 가져오거나 새로 발급)
      const token = await kisApi.getAccessToken();
      setTokenStatus('success');

      // 2. 주식 기본정보 + 회원사 매매동향 API 병렬 호출
      const [infoResponse, brokerResponse] = await Promise.all([
        fetch(`/api/stock/info?code=${searchCode}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`/api/stock/broker?code=${searchCode}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      // 주식 기본정보 처리
      let stockName = `종목코드: ${searchCode}`;
      let marketCap = 5000;
      let currentPrice = 0;
      let listedShares = 20000000;

      if (infoResponse.ok) {
        const infoData = await infoResponse.json();
        console.log('Stock Info Response:', infoData);

        if (infoData.stockInfo) {
          stockName = infoData.stockInfo.name || stockName;
          marketCap = infoData.stockInfo.marketCap || marketCap;
          currentPrice = infoData.stockInfo.currentPrice || 0;
          listedShares = infoData.stockInfo.listedShares || listedShares;
        }
      } else {
        console.warn('주식 기본정보 조회 실패, 기본값 사용');
      }

      // 회원사 매매동향 처리
      if (!brokerResponse.ok) {
        const errorData = await brokerResponse.json();
        throw new Error(errorData.error || '창구 데이터 조회 실패');
      }

      const brokerData = await brokerResponse.json();
      console.log('Broker Response:', brokerData);

      if (brokerData.brokers && brokerData.brokers.length > 0) {
        setBrokers(brokerData.brokers);
        setStockInfo({
          name: stockName,
          marketCap: marketCap,
          price: currentPrice,
          startDate: searchStartDate,
          endDate: searchEndDate
        });
        setManualFloatingShares(listedShares);
        setCalcHelper({ issuedShares: listedShares, floatingRatio: 100 }); // 상장주식수 = 유통주식수로 가정
      } else {
        setError('⚠️ 해당 종목의 창구 데이터를 찾을 수 없습니다.');
        setBrokers([]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '검색 실패');
      setTokenStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [searchCode, searchStartDate, searchEndDate]);

  // 시나리오별 더미 데이터 생성기
  const generateScenario = (type: 'AAA' | 'Samsung') => {
    let newBrokers: Broker[] = [];
    const newStockInfo = { ...stockInfo };
    let newFloatingShares = manualFloatingShares;

    if (type === 'AAA') {
      newStockInfo.name = '중소형 급등주 (시뮬레이션)';
      newStockInfo.marketCap = 2500;
      newFloatingShares = 10000000;
      setCalcHelper({ issuedShares: 0, floatingRatio: 0 });

      newBrokers = [
        { name: '모건스탠리', buyVol: 1500000, sellVol: 50000 },
        { name: 'JP모건', buyVol: 300000, sellVol: 10000 },
        { name: '신한투자', buyVol: 200000, sellVol: 50000 },
        { name: '키움증권', buyVol: 100000, sellVol: 400000 },
        { name: '미래에셋', buyVol: 50000, sellVol: 200000 },
      ];
    }
    else if (type === 'Samsung') {
      newStockInfo.name = '대형주 (시뮬레이션)';
      newStockInfo.marketCap = 4000000;
      newFloatingShares = 5000000000;
      setCalcHelper({ issuedShares: 0, floatingRatio: 0 });

      newBrokers = [
        { name: 'CS증권', buyVol: 50000000, sellVol: 10000000 },
        { name: '골드만삭스', buyVol: 40000000, sellVol: 5000000 },
        { name: '메릴린치', buyVol: 30000000, sellVol: 35000000 },
        { name: '삼성증권', buyVol: 20000000, sellVol: 40000000 },
        { name: 'KB증권', buyVol: 10000000, sellVol: 20000000 },
      ];
    }

    setStockInfo(newStockInfo);
    setManualFloatingShares(newFloatingShares);
    setBrokers(newBrokers);
    setError(null);
  };

  // 핸들러
  const handleBrokerChange = (index: number, field: keyof Broker, value: string | number) => {
    const updatedBrokers = [...brokers];
    const updatedBroker = { ...updatedBrokers[index] };

    if (field === 'name') {
      updatedBroker.name = value as string;
    } else {
      updatedBroker[field] = Number(value);
    }

    updatedBrokers[index] = updatedBroker;
    setBrokers(updatedBrokers);
  };

  const addBroker = () => {
    setBrokers([...brokers, { name: '', buyVol: 0, sellVol: 0 }]);
  };

  const removeBroker = (index: number) => {
    const updatedBrokers = brokers.filter((_, i) => i !== index);
    setBrokers(updatedBrokers);
  };

  // API 설정 상태 확인
  const isApiConfigured = kisApi.isConfigured();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <header className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-600">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Calculator className="w-8 h-8 text-blue-600" />
            매집비(Maejipbi) AI 분석기
          </h1>
          <p className="mt-2 text-slate-600">
            세력의 매집 원가를 분석하여 주포의 흔적을 찾는 도구입니다.
          </p>

          {/* 모드 토글 */}
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={() => setIsAutoMode(!isAutoMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isAutoMode
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
            >
              {isAutoMode ? (
                <ToggleRight className="w-5 h-5" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
              {isAutoMode ? '자동 검색 모드' : '수동 입력 모드'}
            </button>

            {/* API 상태 표시 */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${isApiConfigured
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
              }`}>
              <Key className="w-4 h-4" />
              {isApiConfigured ? 'API 키 설정됨' : 'API 키 필요'}
            </div>
          </div>
        </header>

        {/* 에러 표시 */}
        {error && (
          <div className={`rounded-lg p-4 flex items-start gap-3 ${error.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* 자동 검색 모드 UI */}
        {isAutoMode && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-500" />
              종목 검색
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label htmlFor="search-code" className="block text-xs font-medium text-slate-500 mb-1">
                  종목코드
                </label>
                <input
                  id="search-code"
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="예: 005930"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="search-start" className="block text-xs font-medium text-slate-500 mb-1">
                  시작일
                </label>
                <input
                  id="search-start"
                  type="text"
                  value={searchStartDate}
                  onChange={(e) => setSearchStartDate(e.target.value)}
                  placeholder="YYYYMMDD"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="search-end" className="block text-xs font-medium text-slate-500 mb-1">
                  종료일
                </label>
                <input
                  id="search-end"
                  type="text"
                  value={searchEndDate}
                  onChange={(e) => setSearchEndDate(e.target.value)}
                  placeholder="YYYYMMDD"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      검색 중...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      분석
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 토큰 테스트 버튼 */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={handleTestToken}
                disabled={!isApiConfigured || tokenStatus === 'loading'}
                className={`text-sm px-3 py-1.5 rounded transition flex items-center gap-2 ${tokenStatus === 'success'
                  ? 'bg-green-100 text-green-700'
                  : tokenStatus === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {tokenStatus === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : tokenStatus === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                {tokenStatus === 'success' ? '토큰 발급 완료' : tokenStatus === 'error' ? '토큰 발급 실패' : '토큰 발급 테스트'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-1 space-y-6">
            {/* 수동 모드일 때만 종목 정보 입력 표시 */}
            {!isAutoMode && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  종목 기본 정보
                </h2>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="stock-name" className="block text-xs font-medium text-slate-500 mb-1">종목명</label>
                    <input
                      id="stock-name"
                      type="text"
                      value={stockInfo.name}
                      onChange={(e) => setStockInfo({ ...stockInfo, name: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="종목명을 입력하세요"
                    />
                  </div>
                  <div>
                    <label htmlFor="market-cap" className="block text-xs font-medium text-slate-500 mb-1">시가총액 (억 원)</label>
                    <input
                      id="market-cap"
                      type="number"
                      value={stockInfo.marketCap}
                      onChange={(e) => setStockInfo({ ...stockInfo, marketCap: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="시가총액을 입력하세요"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                    <div className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                      <Calculator className="w-3 h-3" /> 유통주식수 자동 계산
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label htmlFor="issued-shares" className="block text-[10px] text-slate-400 mb-0.5">상장(발행)주식수</label>
                        <input
                          id="issued-shares"
                          type="number"
                          value={calcHelper.issuedShares}
                          onChange={(e) => setCalcHelper({ ...calcHelper, issuedShares: Number(e.target.value) })}
                          className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                          placeholder="상장주식수"
                        />
                      </div>
                      <div>
                        <label htmlFor="floating-ratio" className="block text-[10px] text-slate-400 mb-0.5">유동비율 (%)</label>
                        <input
                          id="floating-ratio"
                          type="number"
                          value={calcHelper.floatingRatio}
                          onChange={(e) => setCalcHelper({ ...calcHelper, floatingRatio: Number(e.target.value) })}
                          className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                          placeholder="유동비율"
                        />
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <ArrowRight className="w-4 h-4 text-slate-400 rotate-90" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="floating-shares" className="block text-xs font-medium text-slate-500 mb-1">유통 주식 수 <span className="text-red-500">*필수</span></label>
                    <input
                      id="floating-shares"
                      type="number"
                      value={floatingShares}
                      onChange={(e) => setManualFloatingShares(Number(e.target.value))}
                      className="w-full border border-blue-200 rounded px-3 py-2 text-sm font-bold text-blue-700 bg-blue-50 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 시나리오 불러오기 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-green-500" />
                시나리오 불러오기
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => generateScenario('AAA')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium transition-colors"
                >
                  중소형주 급등 (AAA)
                </button>
                <button
                  onClick={() => generateScenario('Samsung')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium transition-colors"
                >
                  대형주 패턴 (ACC)
                </button>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-5 text-sm text-blue-800 border border-blue-100">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                사용 팁
              </h3>
              {isAutoMode ? (
                <>
                  <p className="mb-2">1. .env.local 파일에 한국투자증권 API 키를 설정하세요.</p>
                  <p className="mb-2">2. 종목코드와 기간을 입력하고 [분석] 버튼을 클릭하세요.</p>
                  <p>3. 현재는 토큰 발급만 동작하며, 창구 API 연동이 필요합니다.</p>
                </>
              ) : (
                <>
                  <p className="mb-2">1. HTS의 [창구별 거래현황] 화면에서 특정 기간(저점~현재) 데이터를 확인하세요.</p>
                  <p>2. 상위 5~10개 거래원의 매수/매도 수량을 우측 패널에 입력하세요.</p>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* 수동 모드일 때만 거래량 입력 테이블 표시 */}
            {!isAutoMode && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    증권사 창구별 거래량 입력
                  </h2>
                  <button
                    onClick={addBroker}
                    className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition"
                  >
                    + 창구 추가
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">증권사명</th>
                        <th className="px-4 py-3">매수 수량</th>
                        <th className="px-4 py-3">매도 수량</th>
                        <th className="px-4 py-3">순매수</th>
                        <th className="px-4 py-3 rounded-r-lg text-center">삭제</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {brokers.map((broker, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 group">
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              placeholder="증권사명"
                              aria-label={`증권사명 ${idx + 1}`}
                              value={broker.name}
                              onChange={(e) => handleBrokerChange(idx, 'name', e.target.value)}
                              className="w-full bg-transparent outline-none focus:border-b-2 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              aria-label={`${broker.name || '증권사'} 매수 수량`}
                              value={broker.buyVol}
                              onChange={(e) => handleBrokerChange(idx, 'buyVol', e.target.value)}
                              className="w-full bg-transparent outline-none text-red-600 font-medium"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              aria-label={`${broker.name || '증권사'} 매도 수량`}
                              value={broker.sellVol}
                              onChange={(e) => handleBrokerChange(idx, 'sellVol', e.target.value)}
                              className="w-full bg-transparent outline-none text-blue-600 font-medium"
                            />
                          </td>
                          <td className="px-4 py-2 font-bold text-slate-700">
                            {(broker.buyVol - broker.sellVol).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => removeBroker(idx)}
                              className="text-slate-300 hover:text-red-500"
                              aria-label={`삭제 ${broker.name || idx + 1}`}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                      {brokers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                            데이터가 없습니다. 시나리오를 불러오거나 직접 입력하세요.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 자동 모드일 때 창구 데이터 표시 (읽기 전용) */}
            {isAutoMode && brokers.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    창구별 거래량 (조회 결과)
                  </h2>
                  {!stockInfo.name.includes('종목코드:') && (
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold rounded-full">
                      {stockInfo.name}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">증권사명</th>
                        <th className="px-4 py-3">매수 수량</th>
                        <th className="px-4 py-3">매도 수량</th>
                        <th className="px-4 py-3 rounded-r-lg">순매수</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {brokers.map((broker, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-medium">{broker.name}</td>
                          <td className="px-4 py-2 text-red-600 font-medium">{broker.buyVol.toLocaleString()}</td>
                          <td className="px-4 py-2 text-blue-600 font-medium">{broker.sellVol.toLocaleString()}</td>
                          <td className={`px-4 py-2 font-bold ${(broker.buyVol - broker.sellVol) >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                            {(broker.buyVol - broker.sellVol).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  {stockInfo.price > 0 && (
                    <span className="text-slate-600 font-medium mr-2">현재가: {stockInfo.price.toLocaleString()}원 | </span>
                  )}
                  유통주식수: {floatingShares.toLocaleString()}주 | 시가총액: {stockInfo.marketCap.toLocaleString()}억 원
                </p>
              </div>
            )}

            {result && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-yellow-400" />
                    매집비 분석 결과
                  </h2>
                  <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono">
                    {stockInfo.name} 기준
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className={`p-4 rounded-lg bg-white/5 border ${result.grades[0] === 'A' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/10'}`}>
                    <div className="text-sm text-slate-400 mb-1">큰손 매수/매도 비율</div>
                    <div className="text-4xl font-black mb-2 text-white">{result.grades[0]}</div>
                    <div className="text-xs text-slate-300">
                      매수비율: <span className="font-bold text-yellow-400">{result.details.buySellRatio}%</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2">
                      300%↑: A / 200%↑: B
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg bg-white/5 border ${result.grades[1] === 'A' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/10'}`}>
                    <div className="text-sm text-slate-400 mb-1">다수 창구 매집율</div>
                    <div className="text-4xl font-black mb-2 text-white">{result.grades[1]}</div>
                    <div className="text-xs text-slate-300">
                      유통 대비: <span className="font-bold text-yellow-400">{result.details.multiAccumulationRatio}%</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2">
                      5%↑: A / 3.05%↑: B
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg bg-white/5 border ${result.grades[2] === 'A' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/10'}`}>
                    <div className="text-sm text-slate-400 mb-1">특정 창구 집중도</div>
                    <div className="text-4xl font-black mb-2 text-white">{result.grades[2]}</div>
                    <div className="text-xs text-slate-300">
                      최대 창구: <span className="font-bold text-yellow-400">{result.details.singleAccumulationRatio}%</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2">
                      5%↑: A / 3.05%↑: B
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    AI 분석 코멘트
                  </h3>
                  <div className="space-y-3 text-sm text-slate-300">
                    <p>
                      <span className="font-bold text-white">종합 등급: </span>
                      <span className="text-yellow-400 font-mono text-lg ml-2 tracking-widest">
                        {result.grades.join('')}
                      </span>
                    </p>

                    {stockInfo.marketCap >= 10000 ? (
                      <p className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>
                          이 종목은 시가총액 {stockInfo.marketCap}억 원의 <strong>대형주</strong>입니다.
                          첫 번째 알파벳(매수/매도 비율)이 &apos;B&apos; 이상인지 확인하는 것이 가장 중요합니다.
                          현재 비율은 {result.details.buySellRatio}% 입니다.
                        </span>
                      </p>
                    ) : (
                      <p className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span>
                          이 종목은 시가총액 {stockInfo.marketCap}억 원의 <strong>중소형주</strong>입니다.
                          두 번째와 세 번째 알파벳이 &apos;B&apos; 이상일 때(매집 세력 존재) 급등 가능성이 높습니다.
                          현재 매집 상태는
                          {(result.grades[1] === 'A' || result.grades[1] === 'B' || result.grades[2] === 'A' || result.grades[2] === 'B')
                            ? " <세력 매집 포착>"
                            : " <매집 약함>"}
                          입니다.
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}