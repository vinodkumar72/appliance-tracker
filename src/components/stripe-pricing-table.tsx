import { createElement, useEffect } from 'react';
import { Platform } from 'react-native';

const SCRIPT_SRC = 'https://js.stripe.com/v3/pricing-table.js';

/**
 * Stripe-hosted pricing table (configured in the Stripe dashboard under
 * Product catalog → Pricing tables). TEST MODE values — swap both for the
 * live snippet's values before charging real customers.
 */
const PRICING_TABLE_ID = 'prctbl_1UG3fi8vj04TPsRrA2VuTne2';
const PUBLISHABLE_KEY =
  'pk_test_51UG39D8vj04TPsRrXtmy3NLRADQuBZbDPydfPTlLreIidXASbi4tcI9TF4hGVHgxQPjcLnOd65G2nfkRvxsJw8Bd00wKHCnztV';

/**
 * Web-only: renders Stripe's <stripe-pricing-table> web component and loads
 * its script once. Native renders nothing (public pages redirect there anyway).
 */
export function StripePricingTable() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  if (Platform.OS !== 'web') return null;
  // Custom element, so bypass RN components and emit the DOM tag directly.
  return createElement('stripe-pricing-table', {
    'pricing-table-id': PRICING_TABLE_ID,
    'publishable-key': PUBLISHABLE_KEY,
  });
}
