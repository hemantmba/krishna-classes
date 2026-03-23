import React, { useEffect, useRef } from 'react';

export default function AdBanner({ slot, style }) {
  const adRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    try {
      // Set atOptions
      window.atOptions = {
        'key': '35d7233710dc87d28430d6bd6eafd4d0',
        'format': 'iframe',
        'height': 250,
        'width': 300,
        'params': {}
      };

      // Load Adsterra invoke script
      const script = document.createElement('script');
      script.src = 'https://actionfurmap.com/35d7233710dc87d28430d6bd6eafd4d0/invoke.js';
      script.async = true;
      script.type = 'text/javascript';

      if (adRef.current) {
        adRef.current.appendChild(script);
      }
    } catch (e) {
      console.log('Ad load error:', e);
    }
  }, []);

  return (
    <div
      ref={adRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60px',
        width: '100%',
        overflow: 'hidden',
        margin: '8px 0',
        ...style
      }}
    />
  );
}