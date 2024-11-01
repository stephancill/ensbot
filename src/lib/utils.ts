export function formatRenewUrl(name: string) {
  const searchParams = new URLSearchParams({
    name,
    t: Date.now().toString(),
  });

  return `https://ens.steer.fun/frames/manage?${searchParams.toString()}`;
}
