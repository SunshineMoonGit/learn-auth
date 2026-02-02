import { NextRequest, NextResponse } from 'next/server';

// 주식현재가 회원사 종목매매동향 API
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const stockCode = searchParams.get('code');

    if (!stockCode) {
        return NextResponse.json(
            { error: '종목코드가 필요합니다.' },
            { status: 400 }
        );
    }

    const baseUrl = process.env.NEXT_PUBLIC_KIS_BASE_URL || 'https://openapi.koreainvestment.com:9443';
    const appKey = process.env.NEXT_PUBLIC_KIS_APP_KEY || '';
    const appSecret = process.env.NEXT_PUBLIC_KIS_APP_SECRET || '';

    // Authorization 헤더에서 토큰 확인 (프론트엔드에서 전달받은 토큰)
    const authHeader = request.headers.get('Authorization');
    let accessToken: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
        console.log('프론트엔드에서 전달받은 토큰 사용');
    }

    // 토큰이 없으면 새로 발급 (fallback)
    if (!accessToken) {
        console.log('새 토큰 발급 중...');
        try {
            const tokenRes = await fetch(`${baseUrl}/oauth2/tokenP`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify({
                    grant_type: 'client_credentials',
                    appkey: appKey,
                    appsecret: appSecret,
                }),
            });

            if (!tokenRes.ok) {
                const errorText = await tokenRes.text();
                return NextResponse.json(
                    { error: `토큰 발급 실패: ${errorText}` },
                    { status: tokenRes.status }
                );
            }

            const tokenData = await tokenRes.json();
            accessToken = tokenData.access_token;
        } catch (error) {
            return NextResponse.json(
                { error: `토큰 발급 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}` },
                { status: 500 }
            );
        }
    }

    // 회원사 매매동향 조회
    try {
        const url = new URL(`${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-member`);
        url.searchParams.set('FID_COND_MRKT_DIV_CODE', 'J');
        url.searchParams.set('FID_INPUT_ISCD', stockCode);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'authorization': `Bearer ${accessToken}`,
                'appkey': appKey,
                'appsecret': appSecret,
                'tr_id': 'FHKST01010600',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `회원사 데이터 조회 실패: ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Broker 형식으로 변환
        interface BrokerData {
            name: string;
            buyVol: number;
            sellVol: number;
        }
        const brokers: BrokerData[] = [];

        // output 객체에서 데이터 추출 (필드명이 seln_mbcr_name1~5, shnu_mbcr_name1~5 형태)
        const output = data.output;

        if (output) {
            // 상위 5개 창구 데이터 추출
            for (let i = 1; i <= 5; i++) {
                // 매도 상위 창구
                const sellName = output[`seln_mbcr_name${i}`];
                const sellVol = parseInt(output[`seln_vol${i}`] || output[`total_seln_qty${i}`] || '0', 10);

                // 매수 상위 창구
                const buyName = output[`shnu_mbcr_name${i}`];
                const buyVol = parseInt(output[`shnu_vol${i}`] || output[`total_shnu_qty${i}`] || '0', 10);

                // 매도 창구 추가
                if (sellName) {
                    const existing = brokers.find(b => b.name === sellName);
                    if (existing) {
                        existing.sellVol += sellVol;
                    } else {
                        brokers.push({
                            name: sellName,
                            buyVol: 0,
                            sellVol: sellVol,
                        });
                    }
                }

                // 매수 창구 추가
                if (buyName) {
                    const existing = brokers.find(b => b.name === buyName);
                    if (existing) {
                        existing.buyVol += buyVol;
                    } else {
                        brokers.push({
                            name: buyName,
                            buyVol: buyVol,
                            sellVol: 0,
                        });
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            brokers,
            raw: data, // 디버깅용 원본 데이터
        });
    } catch (error) {
        return NextResponse.json(
            { error: `API 호출 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}` },
            { status: 500 }
        );
    }
}
