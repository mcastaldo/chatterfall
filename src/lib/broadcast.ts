export async function broadcast(
  event: string,
  data: unknown,
  targetUserIds?: string[]
) {
  const url =
    process.env.BROADCAST_URL ||
    `http://localhost:${process.env.PORT || 3000}/_internal/broadcast`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, data, targetUserIds }),
    });
  } catch {
    // Silent fail - real-time is best-effort
    console.error("Failed to broadcast:", event);
  }
}
