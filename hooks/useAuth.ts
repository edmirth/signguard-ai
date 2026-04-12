import { useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
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
      // Explicit scheme ensures consistent redirect URI across dev and production builds
      const redirectUrl = AuthSession.makeRedirectUri({ scheme: 'signguardai' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) throw error ?? new Error('Failed to get OAuth URL');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type !== 'success' || !result.url) {
        throw new Error('cancelled');
      }

      // Handle both PKCE (code in query params) and implicit (tokens in hash)
      const parsed = new URL(result.url);
      const code = parsed.searchParams.get('code');
      const hashParams = new URLSearchParams(parsed.hash.replace('#', ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (code) {
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
        if (sessionError) throw sessionError;
      } else if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      } else {
        throw new Error('No authentication data returned. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  }

  async function signInWithEmail(email: string, password: string) {
    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      setIsSigningIn(false);
    }
  }

  async function signUpWithEmail(email: string, password: string, fullName: string) {
    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
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
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshProfile,
  };
}
