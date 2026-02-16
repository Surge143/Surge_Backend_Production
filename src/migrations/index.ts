import * as migration_20260216_102008_final_fix_v2 from './20260216_102008_final_fix_v2';
import * as migration_20260216_104746_fix_missing_tables_final from './20260216_104746_fix_missing_tables_final';

export const migrations = [
  {
    up: migration_20260216_102008_final_fix_v2.up,
    down: migration_20260216_102008_final_fix_v2.down,
    name: '20260216_102008_final_fix_v2',
  },
  {
    up: migration_20260216_104746_fix_missing_tables_final.up,
    down: migration_20260216_104746_fix_missing_tables_final.down,
    name: '20260216_104746_fix_missing_tables_final'
  },
];
