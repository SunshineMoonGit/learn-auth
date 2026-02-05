import { NextRequest, NextResponse } from 'next/server';

// 주식현재가 시세 API (정확한 현재가, 시가총액, 상장주식수 조회)
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

    // Authorization 헤더에서 토큰 확인
    const authHeader = request.headers.get('Authorization');
    let accessToken: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
    }

    // 토큰이 없으면 새로 발급
    if (!accessToken) {
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

    // 주식현재가 시세 API 호출
    try {
        const url = new URL(`${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price`);
        url.searchParams.set('FID_COND_MRKT_DIV_CODE', 'J');
        url.searchParams.set('FID_INPUT_ISCD', stockCode);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'authorization': `Bearer ${accessToken}`,
                'appkey': appKey,
                'appsecret': appSecret,
                'tr_id': 'FHKST01010100', // 주식현재가 시세 TR ID
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `시세 정보 조회 실패: ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        const output = data.output;

        if (!output) {
            return NextResponse.json(
                { error: '종목 정보를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 필요한 데이터 추출
        // stck_prpr: 주식 현재가
        // lstn_stcn: 상장 주수
        // hts_avls: HTS 시가총액 (단위: 억 원)
        const currentPrice = parseInt(output.stck_prpr || '0', 10);
        const listedShares = parseInt(output.lstn_stcn || '0', 10);
        const marketCap = parseInt(output.hts_avls || '0', 10);

        const stockInfo = {
            name: output.bstp_kor_isnm || `종목: ${stockCode}`, // 이 API는 종목명을 직접 주지 않으므로 업종명이나 코드로 대체
            currentPrice: currentPrice,
            marketCap: marketCap,
            listedShares: listedShares,
            floatingRatio: parseFloat(output.hts_frgn_ehrt || '0'), // 외국인 소진율을 참고용으로 사용
        };

        return NextResponse.json({
            success: true,
            stockInfo,
            raw: data, // 디버깅용
        });
    } catch (error) {
        return NextResponse.json(
            { error: `API 호출 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}` },
            { status: 500 }
        );
    }
}
