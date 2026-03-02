const RAW_SEED_PATHS = {
  '00': [
    '/seeds/2026-28-02/Midjourney/00/spwashi_action_bb80a18c-c92d-48bc-b62e-7b3b05817cc9.webp',
    '/seeds/2026-28-02/Midjourney/00/spwashi_concept_f42690c9-8e92-41d7-ba91-7664bb497c3f.webp',
    '/seeds/2026-28-02/Midjourney/00/spwashi_definition_9b11b46a-a429-467d-ae0e-ea3a9725b274.webp',
    '/seeds/2026-28-02/Midjourney/00/spwashi_ground_88f0028a-2cad-4494-968f-06f30741d3bb.webp',
    '/seeds/2026-28-02/Midjourney/00/spwashi_integration_393a363e-55e4-4147-9f0c-f1e4f68c817c.webp',
    '/seeds/2026-28-02/Midjourney/00/spwashi_mode_aa871d14-a31b-44d1-9f5d-82bda94bd5c9.webp',
    '/seeds/2026-28-02/Midjourney/00/spwashi_perspective_bdd8a84e-6a29-41c4-8a94-ab76b1cb04a5.webp',
    '/seeds/2026-28-02/Midjourney/00/spwashi_potential_2386107b-4a1a-4b91-8a8f-e2dce98c071a.webp',
    '/seeds/2026-28-02/Midjourney/00/spwashi_scene_3773c612-b7a3-4467-8647-4f7fd3da0fd7.webp',
    '/seeds/2026-28-02/Midjourney/00/spwashi_subject_9f855f96-eb49-4e62-a20f-dad1f38ae1c4.webp',
    '/seeds/2026-28-02/Midjourney/00/spwashi_value_787134c3-df6b-40a6-a28b-d4be30e8a541.webp',
    '/seeds/2026-28-02/Midjourney/00/spwashi_vibration_832b4a40-56f6-4ce2-b029-8fcee24dac7a.webp',
    '/seeds/2026-28-02/Midjourney/00/spwashi_wonder_b830a224-26a3-4731-8312-aba315dec302.webp'
  ],
  '01': [
    '/seeds/2026-28-02/Midjourney/01/spwashi_action_5b3d49b3-28ed-4d98-af00-96e88eceee74.webp',
    '/seeds/2026-28-02/Midjourney/01/spwashi_ascension_cf1c6ee1-656c-45d0-ac83-cd4b5fde1be9.webp',
    '/seeds/2026-28-02/Midjourney/01/spwashi_concept_309a93e0-e21d-4a01-b92b-3c6fca3daa24.webp',
    '/seeds/2026-28-02/Midjourney/01/spwashi_definition_3413d640-a9de-4a14-ac50-85c0ce430804.webp',
    '/seeds/2026-28-02/Midjourney/01/spwashi_ground_d8b67410-1e8d-4daf-a114-0b5e93394cd4.webp',
    '/seeds/2026-28-02/Midjourney/01/spwashi_mode_953ffab4-b4a7-47c8-a6f7-5b0475c29e7a.webp',
    '/seeds/2026-28-02/Midjourney/01/spwashi_perspective_ff70ef99-a37b-4106-af60-72221a4ba645.webp',
    '/seeds/2026-28-02/Midjourney/01/spwashi_potential_bcda9170-d358-42a6-bca7-c98348b6a5f5.webp',
    '/seeds/2026-28-02/Midjourney/01/spwashi_scene_bd079c7b-6311-4a47-91fd-39c2cb981c40.webp',
    '/seeds/2026-28-02/Midjourney/01/spwashi_subject_cb63f996-1749-47bd-88cc-0ab261bb0857.webp',
    '/seeds/2026-28-02/Midjourney/01/spwashi_value_24dbce91-567c-481f-95c4-27e79f6d54a6.webp',
    '/seeds/2026-28-02/Midjourney/01/spwashi_vibration_822e30bd-79e5-4673-abcc-e0d219f9ea9d.webp',
    '/seeds/2026-28-02/Midjourney/01/spwashi_wonder_c824259f-9029-4382-8d97-2f0a766f0a47.webp'
  ],
  'motif': [
    '/seeds/2026-28-02/Midjourney/spwashi_a_simple_web_page_design_with_an_illustration_of_the_th_cd4f7120-3967-4cf2-a746-0b01b2f57a25.webp'
  ]
};

function humanizeDimension(dimension) {
  return dimension
    .split(/[-_]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toSeedItem(path, setId, order) {
  const filename = path.split('/').pop() || '';
  const match = filename.match(/^spwashi_([a-z0-9_-]+)_[a-f0-9-]+\.webp$/i);
  let dimension = match ? match[1] : 'unknown';

  if (dimension.length > 28 || dimension.split('_').length > 5) {
    dimension = setId === 'motif' ? 'story-motif' : 'unknown';
  }

  return {
    id: `set-${setId}-${dimension}-${order}`,
    setId,
    order,
    src: path,
    dimension,
    label: humanizeDimension(dimension),
    alt: `Midjourney seed ${humanizeDimension(dimension)}, set ${setId}`
  };
}

export const seedSets = Object.entries(RAW_SEED_PATHS).map(([setId, paths]) => {
  const items = paths.map((path, index) => toSeedItem(path, setId, index + 1));
  return {
    id: setId,
    label: `Set ${setId}`,
    items
  };
});

export const seedManifest = seedSets.flatMap((set) => set.items);

export const seedDimensions = [...new Set(seedManifest.map((item) => item.dimension))].sort();

export function chapterSeedMap(chapterCount, preferredSet = '01') {
  const primarySet = seedSets.find((item) => item.id === preferredSet) || seedSets[0];
  const motifSet = seedSets.find((item) => item.id === 'motif');
  const source = primarySet ? [...primarySet.items] : [];
  const motifs = motifSet ? [...motifSet.items] : [];
  const blended = source.length
    ? source.map((item, index) => {
      if (!motifs.length) {
        return item;
      }
      return index % 4 === 3 ? motifs[index % motifs.length] : item;
    })
    : motifs;

  if (!blended.length) {
    return new Map();
  }

  return new Map(
    Array.from({ length: chapterCount }, (_, index) => {
      const chapter = index + 1;
      const item = blended[index % blended.length];
      return [chapter, item];
    })
  );
}
