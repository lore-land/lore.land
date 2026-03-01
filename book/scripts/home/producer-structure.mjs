const VALENCE_LITERAL_DOMAINS = Object.freeze([
  'boon.land',
  'bane.land',
  'bone.land',
  'bonk.land',
  'honk.land'
]);

const PRODUCER_PRINCIPLES = Object.freeze([
  'Prioritize human creativity.',
  'Support mindful social development.',
  'Encourage play without compulsion.',
  'Teach grammar through exploration.',
  'Keep naming structural and swappable.'
]);

const PRODUCER_CLUSTERS = Object.freeze([
  {
    id: 'valence-realms',
    label: 'Valence Realms',
    capacity: 8,
    medium: 'world-state semantics',
    spw: '^[cluster/valence]{boon.land,bane.land,bone.land,bonk.land,honk.land + adjacent realms}',
    literalDomains: VALENCE_LITERAL_DOMAINS
  },
  {
    id: 'spw-core-network',
    label: 'Spw Core Network',
    capacity: 12,
    medium: 'language, routing, and runtime tooling',
    spw: '&[cluster/spw]{kernel, parser, interaction, education surfaces}'
  },
  {
    id: 'mindful-social-play',
    label: 'Mindful Social Play',
    capacity: 8,
    medium: 'collaborative prompts and literacy loops',
    spw: '~[cluster/social]{non-addictive progression and cooperative creativity}'
  },
  {
    id: 'absurd-earnest-labs',
    label: 'Absurd-Earnest Labs',
    capacity: 6,
    medium: 'postironic prompt engines for curiosity',
    spw: '?[cluster/absurd]{familiarity shock -> sincere wonder}'
  },
  {
    id: 'trope-knowledge-commons',
    label: 'Trope & Knowledge Commons',
    capacity: 6,
    medium: 'open references and interpretive craft',
    spw: '#[cluster/commons]{tropes, language patterns, long-form synthesis}'
  }
]);

function padSlotNumber(value) {
  return String(value).padStart(2, '0');
}

function buildProducerSlots(clusters) {
  let slotCursor = 1;
  const slots = [];
  clusters.forEach((cluster) => {
    for (let i = 0; i < cluster.capacity; i += 1) {
      const slotId = `slot-${padSlotNumber(slotCursor)}`;
      slots.push({
        id: slotId,
        clusterId: cluster.id,
        clusterLabel: cluster.label,
        spw: `~[domain/${slotId}]{${cluster.id}}`
      });
      slotCursor += 1;
    }
  });
  return slots;
}

function sumClusterCapacity(clusters) {
  return clusters.reduce((total, cluster) => total + cluster.capacity, 0);
}

const TOTAL_DOMAIN_CAPACITY = sumClusterCapacity(PRODUCER_CLUSTERS);

export const producerStructure = Object.freeze({
  intent: 'Extend ebooks as a generative medium for creativity, mindful social development, and play.',
  totalDomainCapacity: TOTAL_DOMAIN_CAPACITY,
  literalReferences: VALENCE_LITERAL_DOMAINS,
  principles: PRODUCER_PRINCIPLES,
  clusters: PRODUCER_CLUSTERS,
  slots: buildProducerSlots(PRODUCER_CLUSTERS),
  guidance: 'Keep public references structural. Map literal domain identities through private configuration.'
});
