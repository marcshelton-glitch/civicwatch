import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A1628',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'radial-gradient(rgba(212,175,55,0.06) 1px, transparent 1px)',
      backgroundSize: '28px 28px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🦅</div>
          <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: 2, color: '#F8F9FF' }}>
            CIVIC<span style={{ color: '#D4AF37' }}>WATCH</span>
          </div>
          <div style={{ fontSize: 11, color: '#8892A4', letterSpacing: 3, textTransform: 'uppercase', marginTop: 4 }}>
            Sign in to your account
          </div>
        </div>
        <SignIn
          appearance={{
            variables: {
              colorPrimary: '#B22234',
              colorBackground: '#1B2A6B',
              colorText: '#F8F9FF',
              colorTextSecondary: '#8892A4',
              colorInputBackground: 'rgba(255,255,255,0.05)',
              colorInputText: '#F8F9FF',
              borderRadius: '10px',
            },
            elements: {
              card: { boxShadow: '0 8px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(212,175,55,0.25)' },
            }
          }}
          redirectUrl="/dashboard"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  )
}