import * as migration_20260409_125533 from './20260409_125533';
import * as migration_20260427_075147 from './20260427_075147';

export const migrations = [
  {
    up: migration_20260409_125533.up,
    down: migration_20260409_125533.down,
    name: '20260409_125533',
  },
  {
    up: migration_20260427_075147.up,
    down: migration_20260427_075147.down,
    name: '20260427_075147'
  },
];
