import * as migration_20260428_094852 from './20260428_094852';
import * as migration_20260428_fix_web_products_v_columns from './20260428_fix_web_products_v_columns';
import * as migration_20260504_095204 from './20260504_095204';
import * as migration_20260505_093054 from './20260505_093054';
import * as migration_20260525_063118 from './20260525_063118';
import * as migration_20260526_fix_shop_menu_slug from './20260526_fix_shop_menu_slug';
import * as migration_20260529_130731 from './20260529_130731';

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
    name: '20260504_095204',
  },
  {
    up: migration_20260505_093054.up,
    down: migration_20260505_093054.down,
    name: '20260505_093054',
  },
  {
    up: migration_20260525_063118.up,
    down: migration_20260525_063118.down,
    name: '20260525_063118',
  },
  {
    up: migration_20260526_fix_shop_menu_slug.up,
    down: migration_20260526_fix_shop_menu_slug.down,
    name: '20260526_fix_shop_menu_slug',
  },
  {
    up: migration_20260529_130731.up,
    down: migration_20260529_130731.down,
    name: '20260529_130731'
  },
];
