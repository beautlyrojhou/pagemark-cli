import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import {
  addComment,
  updateComment,
  deleteComment,
  listComments,
  clearComments,
} from '../../db/bookmarks-bookmark-comment';

export function registerCommentCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'comment <action>',
    'Manage comments on bookmarks',
    (y) =>
      y
        .positional('action', {
          choices: ['add', 'edit', 'delete', 'list', 'clear'] as const,
          describe: 'Action to perform',
        })
        .option('bookmark', {
          alias: 'b',
          type: 'number',
          describe: 'Bookmark ID',
        })
        .option('comment', {
          alias: 'c',
          type: 'number',
          describe: 'Comment ID (required for edit/delete)',
        })
        .option('body', {
          alias: 'm',
          type: 'string',
          describe: 'Comment body text',
        }),
    (argv) => {
      const { action, bookmark, comment, body } = argv as {
        action: string;
        bookmark?: number;
        comment?: number;
        body?: string;
      };

      if (action === 'add') {
        if (!bookmark || !body) {
          console.error('--bookmark and --body are required for add');
          process.exit(1);
        }
        const c = addComment(db, bookmark, body);
        console.log(`Comment #${c.id} added to bookmark #${bookmark}`);
      } else if (action === 'edit') {
        if (!comment || !body) {
          console.error('--comment and --body are required for edit');
          process.exit(1);
        }
        const ok = updateComment(db, comment, body);
        console.log(ok ? `Comment #${comment} updated.` : `Comment #${comment} not found.`);
      } else if (action === 'delete') {
        if (!comment) {
          console.error('--comment is required for delete');
          process.exit(1);
        }
        const ok = deleteComment(db, comment);
        console.log(ok ? `Comment #${comment} deleted.` : `Comment #${comment} not found.`);
      } else if (action === 'list') {
        if (!bookmark) {
          console.error('--bookmark is required for list');
          process.exit(1);
        }
        const comments = listComments(db, bookmark);
        if (comments.length === 0) {
          console.log('No comments found.');
        } else {
          comments.forEach((c) => console.log(`[#${c.id}] ${c.createdAt}  ${c.body}`));
        }
      } else if (action === 'clear') {
        if (!bookmark) {
          console.error('--bookmark is required for clear');
          process.exit(1);
        }
        const n = clearComments(db, bookmark);
        console.log(`Cleared ${n} comment(s) from bookmark #${bookmark}.`);
      }
    }
  );
}
