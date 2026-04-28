import * as migration_20260428_094852 from './20260428_094852';
import * as migration_20260428_fix_web_products_v_columns from './20260428_fix_web_products_v_columns';

export const migrations = [
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
