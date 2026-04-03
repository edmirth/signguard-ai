import { useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/providers/AuthProvider';

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const { session, user, profile, isLoading, refreshProfile } = useAuthContext();
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function signInWithApple() {
    setIsSigningIn(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
      }
    } finally {
      setIsSigningIn(false);
    }
  }

  async function signInWithGoogle() {
    setIsSigningIn(true);
    try {
      const redirectUrl = AuthSession.makeRedirectUri();
      const nonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString()
      );

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: { nonce },
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) return;

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const params = new URLSearchParams(url.hash.replace('#', ''));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }
    } finally {
      setIsSigningIn(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return {
    session,
    user,
    profile,
    isLoading: isLoading || isSigningIn,
    signInWithApple,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };
}
