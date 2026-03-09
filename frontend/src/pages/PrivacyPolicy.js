import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d1b4b 0%, #1a237e 100%)',
      padding: '40px 20px',
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        background: 'white',
        borderRadius: 20,
        padding: '48px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
          <h1 style={{ color: '#0d1b4b', fontSize: 32, fontWeight: 800, margin: 0 }}>
            Krishna Classes
          </h1>
          <p style={{ color: '#888', marginTop: 8 }}>Privacy Policy</p>
          <div style={{
            display: 'inline-block',
            background: '#fdf3d7',
            border: '1px solid #c9971c',
            borderRadius: 20,
            padding: '4px 16px',
            fontSize: 13,
            color: '#c9971c',
            marginTop: 8
          }}>
            Last updated: March 2026
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #0d1b4b, #c9971c)', borderRadius: 2, marginBottom: 36 }} />

        {[
          {
            title: '1. Information We Collect',
            content: `We collect information you provide directly to us when you register for an account, including your full name, father's name, class, email address, and password. We also collect information about your test performance, scores, and activity on our platform.`
          },
          {
            title: '2. How We Use Your Information',
            content: `We use the information we collect to provide, maintain, and improve our services, including to process your registration, track your test performance, display leaderboard rankings, send you important notifications about your account, and improve our educational content.`
          },
          {
            title: '3. Information Sharing',
            content: `We do not sell, trade, or rent your personal information to third parties. Your name and score may be displayed publicly on our leaderboard. We may share anonymous, aggregated data about our users for educational research purposes.`
          },
          {
            title: '4. Google AdSense & Cookies',
            content: `Our website uses Google AdSense to display advertisements. Google AdSense uses cookies to serve ads based on your prior visits to our website or other websites. You may opt out of personalized advertising by visiting Google's Ads Settings. We also use cookies to maintain your login session and remember your preferences.`
          },
          {
            title: '5. Data Security',
            content: `We implement appropriate security measures to protect your personal information. Your password is encrypted and never stored in plain text. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`
          },
          {
            title: '6. Children\'s Privacy',
            content: `Our service is designed for students of all ages under parental or teacher supervision. We encourage parents and guardians to monitor their children's use of our platform. We do not knowingly collect personal information from children under 13 without parental consent.`
          },
          {
            title: '7. Your Rights',
            content: `You have the right to access, update, or delete your personal information at any time. You can update your profile information from your account settings. To request deletion of your account and data, please contact us at the email below.`
          },
          {
            title: '8. Third Party Services',
            content: `Our platform uses MongoDB Atlas for data storage, and is hosted on Vercel and Render.com. These services have their own privacy policies. We encourage you to review their privacy policies for information about their data practices.`
          },
          {
            title: '9. Changes to This Policy',
            content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Continued use of our service after changes constitutes acceptance of the new policy.`
          },
          {
            title: '10. Contact Us',
            content: `If you have any questions about this Privacy Policy or our data practices, please contact us at: hemantbhardwaj90@gmail.com`
          },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            <h2 style={{
              color: '#0d1b4b',
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 10,
              paddingLeft: 12,
              borderLeft: '4px solid #c9971c'
            }}>
              {section.title}
            </h2>
            <p style={{
              color: '#444',
              lineHeight: 1.8,
              fontSize: 15,
              margin: 0,
              paddingLeft: 16
            }}>
              {section.content}
            </p>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          marginTop: 40,
          padding: 24,
          background: '#f8f4e8',
          borderRadius: 12,
          border: '1px solid #e8d5a3',
          textAlign: 'center'
        }}>
          <div style={{ fontWeight: 700, color: '#0d1b4b', marginBottom: 6 }}>🎓 Krishna Classes</div>
          <div style={{ fontSize: 13, color: '#888' }}>
            Providing quality education to students across Uttar Pradesh
          </div>
          <div style={{ fontSize: 13, color: '#c9971c', marginTop: 6 }}>
            hemantbhardwaj90@gmail.com
          </div>
        </div>
      </div>
    </div>
  );
}