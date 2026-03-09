import React, { useEffect, useRef } from 'react';

const AD_CLIENT = process.env.REACT_APP_ADSENSE_ID || 'ca-pub-XXXXXXXXXXXXXXXX';

const AD_SLOTS = {
  'top-banner': { style: { display: 'block' }, format: 'auto', fullWidthResponsive: true },
  'sidebar': { style: { display: 'block' }, format: 'auto' },
  'result-page': { style: { display: 'block' }, format: 'auto', fullWidthResponsive: true },
  'test-between': { style: { display: 'block', textAlign: 'center' }, layout: 'in-article', format: 'fluid' },
};

// Map slot names to actual AdSense slot IDs - replace these with your actual IDs
const SLOT_IDS = {
  'top-banner': '1234567890',
  'sidebar': '0987654321',
  'result-page': '1122334455',
  'test-between': '5544332211',
};

export default function AdBanner({ slot = 'top-banner', style = {} }) {
  const adRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    try {
      if (window.adsbygoogle && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        loaded.current = true;
      }
    } catch (e) {}
  }, []);

  const config = AD_SLOTS[slot] || AD_SLOTS['top-banner'];

  return (
    <div className="ad-container ad-inline" style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', ...config.style }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={SLOT_IDS[slot] || '1234567890'}
        data-ad-format={config.format}
        data-full-width-responsive={config.fullWidthResponsive ? 'true' : undefined}
        data-ad-layout={config.layout}
      />
    </div>
  );
}
