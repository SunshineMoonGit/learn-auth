import { NextRequest, NextResponse } from 'next/server';

// 주식기본조회 API (종목명, 시가총액, 상장주식수, 현재가)
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

    // 주식기본조회 API 호출
    try {
        const url = new URL(`${baseUrl}/uapi/domestic-stock/v1/quotations/search-stock-info`);
        url.searchParams.set('PRDT_TYPE_CD', '300');
        url.searchParams.set('PDNO', stockCode);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'authorization': `Bearer ${accessToken}`,
                'appkey': appKey,
                'appsecret': appSecret,
                'tr_id': 'CTPF1002R',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `주식정보 조회 실패: ${errorText}` },
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
        // lstg_stqt: 상장주식수 (lstg_stkn이 아님)
        // sbst_pric: 대용가격 (현재가로 사용)
        // hts_avls: HTS 시가총액 (없으면 계산)
        const listedShares = parseInt(output.lstg_stqt || output.lstg_stkn || '0', 10);
        const currentPrice = parseInt(output.sbst_pric || output.thdt_clpr || '0', 10);
        let marketCap = parseInt(output.hts_avls || '0', 10);

        // 시가총액이 0이면 (현재가 × 상장주식수 / 1억)으로 계산
        if (marketCap === 0 && currentPrice > 0 && listedShares > 0) {
            marketCap = Math.floor((currentPrice * listedShares) / 100000000);
        }

        const stockInfo = {
            name: output.prdt_abrv_name || output.prdt_name || '알 수 없음', // 종목명
            currentPrice: currentPrice, // 현재가/대용가
            marketCap: marketCap, // 시가총액 (억 원)
            listedShares: listedShares, // 상장주식수
            floatingRatio: parseFloat(output.frgn_hldn_rt || '0'), // 외국인 보유율 (참고용)
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
