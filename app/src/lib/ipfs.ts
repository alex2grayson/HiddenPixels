const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function randomChunk(length: number): string {
  let output = '';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    output += alphabet[bytes[i] % alphabet.length];
  }
  return output;
}

export async function mockUploadToIpfs(file: File): Promise<{ hash: string; size: number }> {
  // Simulate a short delay and generate a pseudo IPFS CID
  await new Promise((resolve) => setTimeout(resolve, 600));
  const cid = `Qm${randomChunk(44)}`;

  return {
    hash: cid,
    size: file.size,
  };
}
