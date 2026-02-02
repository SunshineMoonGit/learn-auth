import { NextRequest, NextResponse } from 'next/server';

// 종목별 투자자 매매동향 API
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

    // 먼저 토큰 발급
    let accessToken: string;
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

    // 투자자 매매동향 조회
    try {
        const url = new URL(`${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-investor`);
        url.searchParams.set('FID_COND_MRKT_DIV_CODE', 'J');
        url.searchParams.set('FID_INPUT_ISCD', stockCode);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'authorization': `Bearer ${accessToken}`,
                'appkey': appKey,
                'appsecret': appSecret,
                'tr_id': 'FHKST01010900',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `투자자 동향 조회 실패: ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            data: data,
        });
    } catch (error) {
        return NextResponse.json(
            { error: `API 호출 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}` },
            { status: 500 }
        );
    }
}
