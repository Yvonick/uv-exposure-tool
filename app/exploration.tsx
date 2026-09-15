'use client';
import { createContext, useContext, useEffect, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { EXPLORATION_COOKIE, defaultExploration, type Exploration } from '@/lib/exploration-preference';

const Context = createContext<{ exploration: Exploration; setExploration: Dispatch<SetStateAction<Exploration>> }>({ exploration: defaultExploration, setExploration: () => {} });
export function ExplorationProvider({ initial, children }: { initial: Exploration; children: ReactNode }) {
  const [exploration, setExploration] = useState(initial);
  useEffect(() => {
    document.cookie = `${EXPLORATION_COOKIE}=${encodeURIComponent(JSON.stringify(exploration))}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  }, [exploration]);
  return <Context.Provider value={{ exploration, setExploration }}>{children}</Context.Provider>;
}
export const useExploration = () => useContext(Context);
