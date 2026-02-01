'use client';

import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Users, Target, Info, RefreshCw, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface StockInfo {
  name: string;
  marketCap: number;
  price: number;
  startDate: string;
  endDate: string;
  // floatingShares is now handled separately or derived
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

// 매집비 등급 계산 로직 함수
const calculateGrade = (stockInfo: StockInfo, brokers: Broker[], floatingShares: number): AnalysisResult | null => {
  // 데이터 유효성 검사
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

export default function MaejipbiApp() {
  // 상태 관리
  const [stockInfo, setStockInfo] = useState<StockInfo>({
    name: '한화에어로스페이스',
    marketCap: 17000,
    price: 27000,
    startDate: '2023-11-27',
    endDate: '2024-01-26'
  });

  // 유통주식수 개별 관리 (시나리오 등에서 직접 설정 시 사용)
  const [manualFloatingShares, setManualFloatingShares] = useState<number>(32309627);

  // 유통주식수 계산 도우미 상태
  const [calcHelper, setCalcHelper] = useState({
    issuedShares: 51563401,
    floatingRatio: 62.66
  });

  // 최종 유통주식수 유도
  const floatingShares = useMemo(() => {
    if (calcHelper.issuedShares > 0 && calcHelper.floatingRatio > 0) {
      return Math.floor(calcHelper.issuedShares * (calcHelper.floatingRatio / 100));
    }
    return manualFloatingShares;
  }, [calcHelper, manualFloatingShares]);

  // 증권사별 거래 데이터
  const [brokers, setBrokers] = useState<Broker[]>([]);

  // 분석 결과 계산
  const result = useMemo(() => {
    if (brokers.length > 0) {
      return calculateGrade(stockInfo, brokers, floatingShares);
    }
    return null;
  }, [brokers, stockInfo, floatingShares]);

  // 시나리오별 더미 데이터 생성기
  const generateScenario = (type: 'AAA' | 'Samsung') => {
    let newBrokers: Broker[] = [];
    const newStockInfo = { ...stockInfo };
    let newFloatingShares = manualFloatingShares;

    if (type === 'AAA') {
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
            세력의 매집 원가를 분석하여 주포의 흔적을 찾는 도구입니다. 증권사 창구 데이터를 입력하여 매집 등급을 확인하세요.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1 space-y-6">
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
                    onChange={(e) => setStockInfo({...stockInfo, name: e.target.value})}
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
                    onChange={(e) => setStockInfo({...stockInfo, marketCap: Number(e.target.value)})}
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
                        onChange={(e) => setCalcHelper({...calcHelper, issuedShares: Number(e.target.value)})}
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
                        onChange={(e) => setCalcHelper({...calcHelper, floatingRatio: Number(e.target.value)})}
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
                  <label htmlFor="floating-shares" className="block text-xs font-medium text-slate-500 mb-1">유통 주식 수 (자동 입력됨) <span className="text-red-500">*필수</span></label>
                  <input 
                    id="floating-shares"
                    type="number" 
                    value={floatingShares}
                    readOnly
                    className="w-full border border-blue-200 rounded px-3 py-2 text-sm font-bold text-blue-700 bg-blue-50 outline-none"
                  />
                </div>
              </div>
            </div>

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
              <p className="mb-2">1. HTS의 [창구별 거래현황] 화면에서 특정 기간(저점~현재) 데이터를 확인하세요.</p>
              <p>2. 상위 5~10개 거래원의 매수/매도 수량을 우측 패널에 입력하세요.</p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
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
                          { (result.grades[1] === 'A' || result.grades[1] === 'B' || result.grades[2] === 'A' || result.grades[2] === 'B') 
                            ? " <세력 매집 포착>" 
                            : " <매집 약함>" }
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