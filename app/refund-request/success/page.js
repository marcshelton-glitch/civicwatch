export default function RefundSuccessPage() {
  return (
    <div style={{
      maxWidth: 560, margin: '0 auto', padding: '100px 24px',
      textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#1a1a2e',
    }}>
      <div style={{ fontSize: 56, marginBottom: 24 }}>👋</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
        We&rsquo;re sorry to see you go.
      </h1>
      <p style={{ fontSize: 18, lineHeight: 1.7, color: '#444', marginBottom: 32 }}>
        But you&rsquo;re welcome to come back anytime &mdash; we&rsquo;ll be waiting for you.
      </p>
      <p style={{ fontSize: 15, color: '#666', lineHeight: 1.6 }}>
        Your refund request has been received. Our team will review it within 3–5 business days
        and reach out to the email address on your account.
      </p>
      <a href="/" style={{
        display: 'inline-block', marginTop: 40, padding: '12px 28px',
        background: '#4f6ef7', color: '#fff', borderRadius: 8, textDecoration: 'none',
        fontWeight: 600, fontSize: 15,
      }}>
        Back to CivicWatch
      </a>
    </div>
  );
}
