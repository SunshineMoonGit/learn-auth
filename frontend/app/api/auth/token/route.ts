import { NextResponse } from 'next/server';

export async function POST() {
    const baseUrl = process.env.NEXT_PUBLIC_KIS_BASE_URL || 'https://openapivts.koreainvestment.com:29443';
    const appKey = process.env.NEXT_PUBLIC_KIS_APP_KEY || '';
    const appSecret = process.env.NEXT_PUBLIC_KIS_APP_SECRET || '';

    if (!appKey || !appSecret || appKey === 'your_app_key_here') {
        return NextResponse.json(
            { error: 'API 키가 설정되지 않았습니다.' },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(`${baseUrl}/oauth2/tokenP`, {
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

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `토큰 발급 실패: ${response.status} - ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: `네트워크 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}` },
            { status: 500 }
        );
    }
}
