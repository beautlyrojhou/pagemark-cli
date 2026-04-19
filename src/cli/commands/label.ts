import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import { addLabel, removeLabel, getLabels, listByLabel, getAllLabels, clearLabels } from '../../db/bookmarks-label';

export function registerLabelCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'label <action>',
    'Manage labels on bookmarks',
    (y) =>
      y
        .positional('action', {
          choices: ['add', 'remove', 'list', 'by', 'all', 'clear'] as const,
          describe: 'Action to perform',
        })
        .option('id', { type: 'number', describe: 'Bookmark ID' })
        .option('label', { alias: 'l', type: 'string', describe: 'Label name' }),
    (argv) => {
      const { action, id, label } = argv as { action: string; id?: number; label?: string };

      if (action === 'all') {
        const labels = getAllLabels(db);
        if (!labels.length) { console.log('No labels found.'); return; }
        labels.forEach(({ label: l, count }) => console.log(`${l} (${count})`));
        return;
      }

      if (action === 'by') {
        if (!label) { console.error('--label required'); process.exit(1); }
        const results = listByLabel(db, label);
        if (!results.length) { console.log('No bookmarks with that label.'); return; }
        results.forEach(b => console.log(`[${b.id}] ${b.title} — ${b.url}`));
        return;
      }

      if (!id) { console.error('--id required'); process.exit(1); }

      if (action === 'list') {
        const labels = getLabels(db, id);
        if (!labels.length) { console.log('No labels.'); return; }
        console.log(labels.join(', '));
        return;
      }

      if (action === 'clear') {
        clearLabels(db, id);
        console.log(`Cleared all labels from bookmark ${id}.`);
        return;
      }

      if (!label) { console.error('--label required'); process.exit(1); }

      if (action === 'add') {
        addLabel(db, id, label!);
        console.log(`Label '${label}' added to bookmark ${id}.`);
      } else if (action === 'remove') {
        removeLabel(db, id, label!);
        console.log(`Label '${label}' removed from bookmark ${id}.`);
      }
    }
  );
}
