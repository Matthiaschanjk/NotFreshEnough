export interface SharePayload {
  title: string;
  text: string;
  url: string;
}

export async function shareResult(payload: SharePayload) {
  if (navigator.share) {
    await navigator.share(payload);
    return {
      method: "web-share" as const,
      message: "Shared successfully."
    };
  }

  if (navigator.clipboard) {
    await navigator.clipboard.writeText(`${payload.text} ${payload.url}`);
    return {
      method: "clipboard" as const,
      message: "Share text copied to clipboard."
    };
  }

  throw new Error("This browser does not support sharing or clipboard copy.");
}
