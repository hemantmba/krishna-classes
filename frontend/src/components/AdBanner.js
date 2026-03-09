import React, { useEffect, useRef } from 'react';

// REPLACE THESE AFTER ADSENSE APPROVAL
const AD_CLIENT = process.env.REACT_APP_ADSENSE_ID || 'ca-pub-XXXXXXXXXXXXXXXX';

const SLOT_IDS = {
  'top-banner': 'XXXXXXXXXX',
  'sidebar': 'XXXXXXXXXX',
  'result-page': 'XXXXXXXXXX',
  'test-between': 'XXXXXXXXXX',
};

const AD_SLOTS = {
  'top-banner': {
    style: { display: 'block', minHeight: '90px' },
    format: 'auto',
    fullWidthResponsive: true
  },
  'sidebar': {
    style: { display: 'block', minHeight: '250px' },
    format: 'auto',
    fullWidthResponsive: false
  },
  'result-page': {
    style: { display: 'block', minHeight: '90px' },
    format: 'auto',
    fullWidthResponsive: true
  },
  'test-between': {
    style: { display: 'block', textAlign: 'center', minHeight: '100px' },
    layout: 'in-article',
    format: 'fluid'
  },
};

export default function AdBanner({ slot = 'top-banner', style = {} }) {
  const adRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    const timer = setTimeout(() => {
      try {
        if (window.adsbygoogle && adRef.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          loaded.current = true;
        }
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const config = AD_SLOTS[slot] || AD_SLOTS['top-banner'];

  if (AD_CLIENT === 'ca-pub-XXXXXXXXXXXXXXXX') {
    return (
      <div style={{
        background: '#fdf3d7',
        border: '1px dashed #c9971c',
        borderRadius: '8px',
        padding: '12px',
        textAlign: 'center',
        color: '#888',
        fontSize: '13px',
        margin: '8px 0',
        ...style
      }}>
        📢 Ad Space - Configure AdSense to show ads here
      </div>
    );
  }

  return (
    <div style={{ margin: '8px 0', overflow: 'hidden', ...style }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', ...config.style }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={SLOT_IDS[slot]}
        data-ad-format={config.format}
        data-full-width-responsive={config.fullWidthResponsive ? 'true' : undefined}
        data-ad-layout={config.layout}
      />
    </div>
  );
}