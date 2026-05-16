/**
 * Sistema de detecção e resolução de conflitos para sincronização
 */

export interface ConflictResolution {
  type: 'local' | 'remote' | 'merge' | 'manual';
  timestamp: number;
  reason: string;
}

export interface DataVersion {
  data: any;
  timestamp: number;
  clientId: string;
  version: number;
}

/**
 * Detecta conflito entre duas versões de dados
 */
export function detectConflict(local: DataVersion, remote: DataVersion): boolean {
  // Se os timestamps são diferentes e ambos foram modificados, há conflito
  if (local.timestamp !== remote.timestamp && local.clientId !== remote.clientId) {
    return true;
  }
  return false;
}

/**
 * Resolve conflito usando timestamp (versão mais recente vence)
 */
export function resolveConflictByTimestamp(
  local: DataVersion,
  remote: DataVersion
): { winner: DataVersion; resolution: ConflictResolution } {
  const winner = local.timestamp > remote.timestamp ? local : remote;
  const resolution: ConflictResolution = {
    type: 'remote',
    timestamp: Date.now(),
    reason: `Versão mais recente venceu (${winner.timestamp})`,
  };
  return { winner, resolution };
}

/**
 * Tenta fazer merge automático de dados (para arrays)
 */
export function mergeArrays(local: any[], remote: any[]): { merged: any[]; conflicts: number } {
  const merged = [...local];
  let conflicts = 0;

  // Adicionar itens do remote que não existem no local
  remote.forEach((remoteItem) => {
    const exists = local.some((localItem) => localItem.id === remoteItem.id);
    if (!exists) {
      merged.push(remoteItem);
    } else {
      // Item existe em ambos - pode ser um conflito
      conflicts++;
    }
  });

  return { merged, conflicts };
}

/**
 * Tenta fazer merge automático de dados (para objetos)
 */
export function mergeObjects(local: Record<string, any>, remote: Record<string, any>): {
  merged: Record<string, any>;
  conflicts: number;
} {
  const merged = { ...local };
  let conflicts = 0;

  Object.keys(remote).forEach((key) => {
    if (!(key in local)) {
      // Chave não existe no local, adicionar
      merged[key] = remote[key];
    } else if (JSON.stringify(local[key]) !== JSON.stringify(remote[key])) {
      // Chave existe mas com valor diferente - conflito
      conflicts++;
      // Usar versão remota por padrão
      merged[key] = remote[key];
    }
  });

  return { merged, conflicts };
}

/**
 * Resolve conflito com estratégia de merge
 */
export function resolveConflictByMerge(
  local: DataVersion,
  remote: DataVersion
): { winner: DataVersion; resolution: ConflictResolution; conflicts: number } {
  let merged: any;
  let conflicts = 0;

  // Se são arrays, fazer merge de arrays
  if (Array.isArray(local.data) && Array.isArray(remote.data)) {
    const result = mergeArrays(local.data, remote.data);
    merged = result.merged;
    conflicts = result.conflicts;
  }
  // Se são objetos, fazer merge de objetos
  else if (typeof local.data === 'object' && typeof remote.data === 'object') {
    const result = mergeObjects(local.data, remote.data);
    merged = result.merged;
    conflicts = result.conflicts;
  }
  // Caso contrário, usar versão mais recente
  else {
    merged = local.timestamp > remote.timestamp ? local.data : remote.data;
  }

  const winner: DataVersion = {
    data: merged,
    timestamp: Date.now(),
    clientId: 'merged',
    version: Math.max(local.version, remote.version) + 1,
  };

  const resolution: ConflictResolution = {
    type: 'merge',
    timestamp: Date.now(),
    reason: `Merge automático realizado (${conflicts} conflitos detectados)`,
  };

  return { winner, resolution, conflicts };
}

/**
 * Estratégia de resolução: sempre usar versão remota (servidor)
 */
export function resolveConflictByRemote(
  local: DataVersion,
  remote: DataVersion
): { winner: DataVersion; resolution: ConflictResolution } {
  const resolution: ConflictResolution = {
    type: 'remote',
    timestamp: Date.now(),
    reason: 'Versão do servidor foi usada',
  };
  return { winner: remote, resolution };
}

/**
 * Estratégia de resolução: sempre usar versão local (cliente)
 */
export function resolveConflictByLocal(
  local: DataVersion,
  remote: DataVersion
): { winner: DataVersion; resolution: ConflictResolution } {
  const resolution: ConflictResolution = {
    type: 'local',
    timestamp: Date.now(),
    reason: 'Versão local foi mantida',
  };
  return { winner: local, resolution };
}
