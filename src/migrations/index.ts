import * as migration_20260409_125533 from './20260409_125533';
import * as migration_20260427_075147 from './20260427_075147';
import * as migration_20260428_094852 from './20260428_094852';
import * as migration_20260428_fix_web_products_v_columns from './20260428_fix_web_products_v_columns';

export const migrations = [
  {
    up: migration_20260409_125533.up,
    down: migration_20260409_125533.down,
    name: '20260409_125533',
  },
  {
    up: migration_20260427_075147.up,
    down: migration_20260427_075147.down,
    name: '20260427_075147',
  },
  {
    up: migration_20260428_094852.up,
    down: migration_20260428_094852.down,
    name: '20260428_094852',
  },
  {
    up: migration_20260428_fix_web_products_v_columns.up,
    down: migration_20260428_fix_web_products_v_columns.down,
    name: '20260428_fix_web_products_v_columns'
  },
];
