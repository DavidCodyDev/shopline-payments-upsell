/**
 * ScriptTag / order-status injection stub.
 *
 * Shopline allows ScriptTags on storefront or order status pages
 * (`write_script_tags` / `ScriptTagDisplayScope.CHECKOUT_OLD`).
 *
 * Private apps can use ScriptTags; Checkout UI Customizer requires a public
 * App Store app + Enterprise plan.
 *
 * This module documents the intended hook — it does not register a live ScriptTag.
 */

export const THANK_YOU_SCRIPT_SRC_PATH = "/thank-you/offer-widget.js";

export type ScriptTagCreateStub = {
  event: "onload";
  src: string;
  display_scope: "CHECKOUT_OLD";
  note: string;
};

/** Payload shape a future Admin API call would send when installing the hook. */
export function buildScriptTagPayload(appUrl: string): ScriptTagCreateStub {
  return {
    event: "onload",
    src: `${appUrl.replace(/\/$/, "")}${THANK_YOU_SCRIPT_SRC_PATH}`,
    display_scope: "CHECKOUT_OLD",
    note: "STUB — do not POST without credentials and merchant consent. Loads thank-you upsell widget.",
  };
}
