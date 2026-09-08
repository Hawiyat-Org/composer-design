export function orderAgentsWithComposerDesignFirst<T extends { id: string }>(
  agents: readonly T[],
): T[] {
  const composerDesignAgents: T[] = [];
  const otherAgents: T[] = [];
  for (const agent of agents) {
    if (agent.id === 'amr') {
      composerDesignAgents.push(agent);
    } else {
      otherAgents.push(agent);
    }
  }
  return [...composerDesignAgents, ...otherAgents];
}
