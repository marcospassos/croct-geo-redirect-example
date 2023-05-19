import {NextRequest, NextResponse} from 'next/server';
import {v4 as uuidv4} from 'uuid';
import {evaluate} from "@croct/plug-react/api";

const CLIENT_ID_DURATION = 60 * 60 * 24 * 365; // 1 year
const CLIENT_ID_COOKIE_NAME = 'cid';
const CLIENT_ID_COOKIE_DOMAIN = 'usezapay.com.br';
const CROCT_API_KEY = process.env.CROCT_API_KEY ?? '';

if (CROCT_API_KEY === '') {
    throw new Error('Environment variable CROCT_API_KEY is not set.');
}

type Location = {
    country: string|null,
    stateCode: string|null,
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
    const headers = new Headers(request.headers);

    const response = NextResponse.next({
        request: {
            headers: headers,
        },
    });

    const clientId = getClientId(request);

    response.cookies.set(CLIENT_ID_COOKIE_NAME, clientId, {
        maxAge: CLIENT_ID_DURATION,
        httpOnly: true,
        secure: true,
        path: '/',
        sameSite: 'strict',
        domain: CLIENT_ID_COOKIE_DOMAIN,
    });

    const {country, stateCode} = await evaluate<Location>('location', {
        timeout: 1000,
        apiKey: CROCT_API_KEY,
        clientId: clientId,
        userAgent: headers.get('user-agent') ?? undefined,
        clientIp: request.ip ?? '127.0.0.1',
        context: {
            page: {
                url: request.url,
                referrer: headers.get('referer') ?? undefined,
            }
        }
    }).catch(() => ({country: null, stateCode: null}));

    if (country?.toLowerCase() === 'br' && stateCode !== null) {
        return NextResponse.redirect(`https://www.usezapay.com.br/detran/${stateCode.toLowerCase()}`);
    }

    return response;
}

function getClientId(request: NextRequest): string {
    return request.cookies.get(CLIENT_ID_COOKIE_NAME)?.value
        ?? uuidv4().replaceAll('-', '');
}

export const config = {
    // Match the home only
    matcher: '/',
};
