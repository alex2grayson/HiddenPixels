import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Hidden Pixels',
  projectId: 'b1e3a6c8b4fa41f8b8d2e0ff2e6a1f3a',
  chains: [sepolia],
  ssr: false,
});
