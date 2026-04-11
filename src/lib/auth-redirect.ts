const AUTH_REDIRECT_KEY = "auth_redirect";

export function storeAuthRedirect(redirect: string) {
  sessionStorage.setItem(AUTH_REDIRECT_KEY, redirect);
}

export function getAuthRedirect(): string | null {
  return sessionStorage.getItem(AUTH_REDIRECT_KEY);
}

export function clearAuthRedirect() {
  sessionStorage.removeItem(AUTH_REDIRECT_KEY);
}
