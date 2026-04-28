import type { Argv } from 'yargs';
import type { Database } from 'better-sqlite3';
import {
  createWorkflow,
  deleteWorkflow,
  listWorkflows,
  assignToWorkflow,
  getWorkflowForBookmark,
  advanceWorkflowStep,
  removeFromWorkflow,
} from '../../db/bookmarks-bookmark-workflow';

export function registerWorkflowCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'workflow <action>',
    'Manage bookmark workflows',
    (y) =>
      y
        .positional('action', {
          choices: ['create', 'delete', 'list', 'assign', 'status', 'advance', 'remove'] as const,
          describe: 'Action to perform',
        })
        .option('name', { type: 'string', describe: 'Workflow name' })
        .option('steps', { type: 'string', describe: 'Comma-separated list of step names' })
        .option('id', { type: 'number', describe: 'Bookmark ID' })
        .option('workflow', { type: 'string', describe: 'Workflow name to assign' }),
    (argv) => {
      const action = argv.action as string;

      if (action === 'create') {
        if (!argv.name || !argv.steps) {
          console.error('--name and --steps are required for create');
          process.exit(1);
        }
        const steps = (argv.steps as string).split(',').map((s) => s.trim());
        const workflow = createWorkflow(db, argv.name as string, steps);
        console.log(`Created workflow "${workflow.name}" with steps: ${workflow.steps.join(', ')}`);
        return;
      }

      if (action === 'delete') {
        if (!argv.name) {
          console.error('--name is required for delete');
          process.exit(1);
        }
        deleteWorkflow(db, argv.name as string);
        console.log(`Deleted workflow "${argv.name}"`);
        return;
      }

      if (action === 'list') {
        const workflows = listWorkflows(db);
        if (workflows.length === 0) {
          console.log('No workflows defined.');
        } else {
          for (const wf of workflows) {
            console.log(`[${wf.id}] ${wf.name}: ${wf.steps.join(' → ')}`);
          }
        }
        return;
      }

      if (action === 'assign') {
        if (!argv.id || !argv.workflow) {
          console.error('--id and --workflow are required for assign');
          process.exit(1);
        }
        assignToWorkflow(db, argv.id as number, argv.workflow as string);
        console.log(`Assigned bookmark #${argv.id} to workflow "${argv.workflow}"`);
        return;
      }

      if (action === 'status') {
        if (!argv.id) {
          console.error('--id is required for status');
          process.exit(1);
        }
        const status = getWorkflowForBookmark(db, argv.id as number);
        if (!status) {
          console.log(`Bookmark #${argv.id} is not assigned to any workflow.`);
        } else {
          console.log(`Workflow: ${status.workflowName}  |  Step: ${status.currentStep}`);
        }
        return;
      }

      if (action === 'advance') {
        if (!argv.id) {
          console.error('--id is required for advance');
          process.exit(1);
        }
        const result = advanceWorkflowStep(db, argv.id as number);
        if (!result) {
          console.log(`Bookmark #${argv.id} is already at the final step or not in a workflow.`);
        } else {
          console.log(`Advanced bookmark #${argv.id} to step: ${result.currentStep}`);
        }
        return;
      }

      if (action === 'remove') {
        if (!argv.id) {
          console.error('--id is required for remove');
          process.exit(1);
        }
        removeFromWorkflow(db, argv.id as number);
        console.log(`Removed bookmark #${argv.id} from its workflow.`);
        return;
      }

      console.error(`Unknown action: ${action}`);
      process.exit(1);
    }
  );
}
