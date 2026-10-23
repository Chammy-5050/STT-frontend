import AuthLogo from "./AuthLogo";

export default function LoadingView() {
  return (
    <div className="auth-loading-page" role="status" aria-live="polite">
      <div className="loading-logo"><AuthLogo /></div>
      <h1>Creating your account...</h1>
      <div className="loading-track"><span /></div>
    </div>
  );
}
