import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class KakaoClient {
  private readonly baseURL = 'https://kapi.kakao.com';

  async getUserMe(accessToken: string) {
    const { data } = await axios.get(`${this.baseURL}/v2/user/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      validateStatus: (s) => s < 500,
    });
    if (!data || !data.id) {
      throw new UnauthorizedException('Invalid kakao access token');
    }
    return data;
  }

  async exchangeCodeToToken(opts: {
    code: string;
    redirectUri: string;
    clientId: string;
    clientSecret?: string;
  }) {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: opts.clientId,
      redirect_uri: opts.redirectUri,
      code: opts.code,
    });
    if (opts.clientSecret) params.append('client_secret', opts.clientSecret);

    const { data, status } = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      params,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 5000,
        validateStatus: (s) => s < 500,
      },
    );
    if (status >= 400) throw new UnauthorizedException('kakao token exchange failed');
    return data as { access_token: string };
  }
}
