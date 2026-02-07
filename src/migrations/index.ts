import * as migration_20260205_093121 from './20260205_093121';

export const migrations = [
  {
    up: migration_20260205_093121.up,
    down: migration_20260205_093121.down,
    name: '20260205_093121'
  },
];
