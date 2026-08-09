export async function logRuntimeEvent(event: Record<string, unknown>): Promise<void> {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), ...event }));
}
