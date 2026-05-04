import * as migration_20260428_094852 from './20260428_094852';
import * as migration_20260428_fix_web_products_v_columns from './20260428_fix_web_products_v_columns';
import * as migration_20260504_095204 from './20260504_095204';

export const migrations = [
  {
    up: migration_20260428_094852.up,
    down: migration_20260428_094852.down,
    name: '20260428_094852',
  },
  {
    up: migration_20260428_fix_web_products_v_columns.up,
    down: migration_20260428_fix_web_products_v_columns.down,
    name: '20260428_fix_web_products_v_columns',
  },
  {
    up: migration_20260504_095204.up,
    down: migration_20260504_095204.down,
    name: '20260504_095204'
  },
];
