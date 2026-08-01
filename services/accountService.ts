import type { Account, Provider } from '@/types/mail';

const SIMULATED_DELAY_MS = 800;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

const MOCK_ADDRESS: Record<Provider, string> = {
  gmail: 'chelseagratiaa@gmail.com',
  outlook: 'chelseagratiaa@outlook.com',
};

export function connectAccount(provider: Provider): Promise<Account> {
  return delay({ provider, connected: true, emailAddress: MOCK_ADDRESS[provider] });
}

export function disconnectAccount(): Promise<void> {
  return delay(undefined);
}
