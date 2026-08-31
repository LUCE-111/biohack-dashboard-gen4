import { useEffect, useState } from 'react';
import { listRosterVersions, loadRosterVersion, pruneRosterVersions, saveRosterVersion } from '../lib/rosterDb';
import type { RosterVersion } from '../types';

interface UseRosterDataResult {
  activeVersion: RosterVersion | null;
  versions: readonly RosterVersion[];
  isLoading: boolean;
  error: string | null;
  saveVersion: (version: RosterVersion) => Promise<void>;
  refresh: () => Promise<void>;
  dismissError: () => void;
}

export function useRosterData(activeVersionId: string | null): UseRosterDataResult {
  const [activeVersion, setActiveVersion] = useState<RosterVersion | null>(null);
  const [versions, setVersions] = useState<readonly RosterVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async (): Promise<void> => {
    try {
      const all = await listRosterVersions();
      setVersions(all);
      if (!activeVersionId) {
        setActiveVersion(null);
      } else {
        setActiveVersion(await loadRosterVersion(activeVersionId));
      }
    } catch {
      setError('브라우저의 근무표 저장소를 읽지 못했습니다.');
      setActiveVersion(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const all = await listRosterVersions();
        const active = activeVersionId ? await loadRosterVersion(activeVersionId) : null;
        if (!cancelled) {
          setVersions(all);
          setActiveVersion(active);
        }
      } catch {
        if (!cancelled) {
          setError('브라우저의 근무표 저장소를 읽지 못했습니다.');
          setActiveVersion(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [activeVersionId]);

  const saveVersion = async (version: RosterVersion): Promise<void> => {
    try {
      await saveRosterVersion(version);
      await pruneRosterVersions([version.id, activeVersionId ?? '']);
      await refresh();
    } catch {
      setError('새 근무표를 브라우저에 저장하지 못했습니다.');
      throw new Error('근무표 저장 실패');
    }
  };

  return { activeVersion, versions, isLoading, error, saveVersion, refresh, dismissError: () => setError(null) };
}
