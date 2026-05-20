'use client'
import { useState } from 'react'
import Link from 'next/link'

const S = {
  navy: '#0A1628', navyMid: '#1B2A6B', navyLight: '#243A8C',
  red: '#B22234', gold: '#D4AF37',
  white: '#F8F9FF', offWhite: '#EEF0F8', gray: '#8892A4',
  grayLight: '#CDD2E0',
  cardBg: 'rgba(255,255,255,0.04)', border: 'rgba(212,175,55,0.25)',
}

const CONSTITUTION_ARTICLES = [
  { id: 'preamble', title: 'Preamble', original: 'We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America.', plain: 'This introduction explains why the Constitution was created: to form a unified nation, ensure justice, maintain peace, and protect the freedom of all Americans.' },
  { id: 'art1', title: 'Article I – The Legislative Branch', original: 'All legislative Powers herein granted shall be vested in a Congress of the United States, which shall consist of a Senate and House of Representatives...', plain: 'Creates Congress — the Senate and House of Representatives — and gives them the power to make laws.' },
  { id: 'art2', title: 'Article II – The Executive Branch', original: 'The executive Power shall be vested in a President of the United States of America. He shall hold his Office during the Term of four Years...', plain: 'Creates the office of President, who enforces the laws and serves as Commander in Chief.' },
  { id: 'art3', title: 'Article III – The Judicial Branch', original: 'The judicial Power of the United States, shall be vested in one supreme Court, and in such inferior Courts as the Congress may from time to time ordain and establish...', plain: 'Creates the Supreme Court and gives Congress power to establish lower courts.' },
  { id: 'art4', title: 'Article IV – The States', original: 'Full Faith and Credit shall be given in each State to the public Acts, Records, and judicial Proceedings of every other State...', plain: 'Defines the relationship between states and the federal government, including how new states join the Union.' },
  { id: 'art5', title: 'Article V – Amendments', original: 'The Congress, whenever two thirds of both Houses shall deem it necessary, shall propose Amendments to this Constitution...', plain: 'Explains how the Constitution can be changed.' },
  { id: 'art6', title: 'Article VI – Supremacy', original: 'This Constitution, and the Laws of the United States which shall be made in Pursuance thereof shall be the supreme Law of the Land...', plain: 'The Constitution is the highest law in the land — it overrides state laws.' },
  { id: 'art7', title: 'Article VII – Ratification', original: 'The Ratification of the Conventions of nine States shall be sufficient for the Establishment of this Constitution...', plain: 'The Constitution became law when 9 of 13 states approved it.' },
]

const AMENDMENTS = [
  { num: 1, title: 'Freedom of Speech, Religion, Press, Assembly, and Petition', original: 'Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press...', plain: 'The government cannot establish an official religion, prevent you from practicing your faith, or stop you from speaking, publishing, assembling peacefully, or petitioning the government.' },
  { num: 2, title: 'Right to Bear Arms', original: 'A well regulated Militia, being necessary to the security of a free State, the right of the people to keep and bear Arms, shall not be infringed.', plain: 'Citizens have the right to own and carry firearms. This right cannot be taken away by the government.' },
  { num: 4, title: 'Protection from Unreasonable Search and Seizure', original: 'The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated...', plain: 'Police cannot search your home, papers, or body without a court-issued warrant based on probable cause.' },
  { num: 5, title: 'Right to Remain Silent, Due Process', original: 'No person shall be held to answer for a capital, or otherwise infamous crime, unless on a presentment or indictment of a Grand Jury...', plain: 'You cannot be tried twice for the same crime. You cannot be forced to testify against yourself. The government cannot take your life, liberty, or property without due process.' },
  { num: 13, title: 'Abolished Slavery (1865)', original: 'Neither slavery nor involuntary servitude, except as a punishment for crime whereof the party shall have been duly convicted, shall exist within the United States...', plain: 'Slavery is abolished throughout the United States.' },
  { num: 14, title: 'Citizenship and Equal Protection Under the Law (1868)', original: 'All persons born or naturalized in the United States and subject to the jurisdiction thereof, are citizens of the United States...', plain: 'Everyone born in the US is a citizen. No state can deny citizens equal protection of the laws or due process.' },
  { num: 15, title: 'Right to Vote Regardless of Race (1870)', original: 'The right of citizens of the United States to vote shall not be denied or abridged by the United States or by any State on account of race, color, or previous condition of servitude.', plain: 'Citizens cannot be denied the right to vote based on race or previous enslaved status.' },
  { num: 19, title: "Women's Right to Vote (1920)", original: 'The right of citizens of the United States to vote shall not be denied or abridged on account of sex.', plain: 'Women have the right to vote.' },
  { num: 26, title: 'Voting Age Lowered to 18 (1971)', original: 'The right of citizens of the United States, who are eighteen years of age or older, to vote shall not be denied or abridged on account of age.', plain: 'Citizens 18 and older have the right to vote.' },
]

function ConstitutionCard({ title, plain, original }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: `1px solid ${S.border}`, borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', textAlign: 'left', padding: '16px 20px', background: open ? 'rgba(27,42,107,0.5)' : S.cardBg, border: 'none', cursor: 'pointer', fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 15, color: S.gold, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        {title}
        <span style={{ fontSize: 12, color: S.gray }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 20px 18px 20px', background: 'rgba(10,22,40,0.4)' }}>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: S.gold, marginBottom: 12 }}>{plain}</p>
          <p style={{ fontSize: 12, lineHeight: 1.8, color: S.gray, fontStyle: 'italic', borderLeft: `3px solid rgba(212,175,55,0.3)`, paddingLeft: 16, margin: 0 }}>{original}</p>
        </div>
      )}
    </div>
  )
}

export default function ConstitutionPage() {
  const [section, setSection] = useState('articles')
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <main style={{ minHeight: '100vh', background: S.navy, color: S.white, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 64px' }}>

        {/* Back link */}
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: S.gold, textDecoration: 'none', marginBottom: 28, opacity: 0.85 }}>
          ← Back to Dashboard
        </Link>

        {/* Title */}
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 26, marginBottom: 6 }}>The Constitution of the United States</h1>
          <p style={{ fontSize: 13, color: S.gray, lineHeight: 1.6 }}>The supreme law of the United States — every Article and key Amendment, with plain-language explanations.</p>
          <div style={{ marginTop: 10, height: 2, background: `linear-gradient(90deg, ${S.red}, transparent)`, borderRadius: 2 }} />
        </div>

        {/* Header image */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${S.border}`, cursor: 'pointer', position: 'relative' }}
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Constitution_of_the_United_States%2C_page_1.jpg/960px-Constitution_of_the_United_States%2C_page_1.jpg"
              alt="Constitution of the United States, page 1"
              referrerPolicy="no-referrer"
              style={{ width: '100%', maxHeight: 260, objectFit: 'cover', objectPosition: 'top', display: 'block', cursor: 'pointer' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: S.gray }}>🔍 Tap to expand</span>
            <a
              href="https://www.archives.gov/founding-docs/constitution"
              target="_blank"
              rel="noreferrer"
              style={{ padding: '6px 14px', background: 'rgba(212,175,55,0.1)', border: `1px solid ${S.gold}`, borderRadius: 8, color: S.gold, textDecoration: 'none', fontSize: 12, fontWeight: 600 }}
            >
              📜 View at National Archives
            </a>
          </div>
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <div
            onClick={() => setLightboxOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <button
              onClick={e => { e.stopPropagation(); setLightboxOpen(false) }}
              style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(212,175,55,0.15)', border: `1px solid ${S.gold}`, borderRadius: '50%', width: 40, height: 40, color: S.gold, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
              aria-label="Close"
            >
              ×
            </button>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Constitution_of_the_United_States%2C_page_1.jpg/960px-Constitution_of_the_United_States%2C_page_1.jpg"
              alt="Constitution of the United States, page 1 — full view"
              referrerPolicy="no-referrer"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8, border: `1px solid ${S.border}` }}
            />
          </div>
        )}

        {/* Intro */}
        <p style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.8, marginBottom: 24, padding: '16px 20px', background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12 }}>
          The Constitution of the United States is the supreme law of the land, ratified in 1788. It establishes the framework of the federal government and guarantees fundamental rights to all Americans.
        </p>

        {/* Section toggle + archive link */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {['articles', 'amendments'].map(m => (
              <button key={m} onClick={() => setSection(m)}
                style={{ padding: '8px 18px', background: section === m ? S.navyLight : 'transparent', border: 'none', color: section === m ? S.gold : S.gray, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                {m === 'articles' ? 'Articles' : 'Amendments'}
              </button>
            ))}
          </div>
          <a href="https://www.archives.gov/founding-docs/constitution" target="_blank" rel="noreferrer"
            style={{ padding: '8px 18px', background: 'rgba(212,175,55,0.1)', border: `1px solid ${S.gold}`, borderRadius: 8, color: S.gold, textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
            📜 National Archives
          </a>
        </div>

        {/* Articles */}
        {section === 'articles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CONSTITUTION_ARTICLES.map(art => (
              <ConstitutionCard key={art.id} title={art.title} plain={art.plain} original={art.original} />
            ))}
          </div>
        )}

        {/* Amendments */}
        {section === 'amendments' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {AMENDMENTS.map(am => (
              <div key={am.num} style={{ padding: 18, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 40, height: 40, background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14 }}>{am.num}</div>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 13, color: S.offWhite, marginBottom: 2 }}>Amendment {am.num}</div>
                    <div style={{ fontSize: 12, color: S.gold, fontWeight: 600 }}>{am.title}</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: S.gold, lineHeight: 1.7, marginBottom: 10 }}>{am.plain}</p>
                <p style={{ fontSize: 12, color: S.gray, lineHeight: 1.7, fontStyle: 'italic', borderLeft: `3px solid rgba(212,175,55,0.3)`, paddingLeft: 12, margin: 0 }}>{am.original}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
