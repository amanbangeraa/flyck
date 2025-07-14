const channels: Record<string, Set<WritableStreamDefaultWriter>> = {};

export function openChannel(disp: string, res: any) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no',
    retry: 10000,
  });
  if (!channels[disp]) channels[disp] = new Set();
  channels[disp].add(res);
  res.on('close', () => {
    channels[disp].delete(res);
  });
}

export function broadcast(disp: string) {
  if (!channels[disp]) return;
  for (const res of channels[disp]) {
    res.write('event: update\ndata: 1\n\n');
  }
}
