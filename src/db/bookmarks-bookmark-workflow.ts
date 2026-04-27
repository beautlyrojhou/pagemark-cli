import type { Database } from 'better-sqlite3';

/**
 * Workflow management for bookmarks.
 * Allows defining named workflows (e.g. "to-read", "in-review", "done")
 * and moving bookmarks through workflow steps.
 */

export interface Workflow {
  id: number;
  name: string;
  steps: string[]; // ordered list of step names
  createdAt: string;
}

export interface BookmarkWorkflowState {
  bookmarkId: number;
  workflowId: number;
  workflowName: string;
  currentStep: string;
  updatedAt: string;
}

/** Ensure workflow tables exist */
export function migrateWorkflows(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      steps TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS bookmark_workflow_states (
      bookmark_id INTEGER NOT NULL,
      workflow_id INTEGER NOT NULL,
      current_step TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (bookmark_id, workflow_id),
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    );
  `);
}

/** Create a new workflow with an ordered list of steps */
export function createWorkflow(db: Database, name: string, steps: string[]): Workflow {
  if (steps.length === 0) throw new Error('Workflow must have at least one step');
  const stmt = db.prepare(
    `INSERT INTO workflows (name, steps) VALUES (?, ?) RETURNING id, name, steps, created_at`
  );
  const row = stmt.get(name, JSON.stringify(steps)) as any;
  return { id: row.id, name: row.name, steps: JSON.parse(row.steps), createdAt: row.created_at };
}

/** Delete a workflow and all associated bookmark states */
export function deleteWorkflow(db: Database, workflowId: number): boolean {
  const result = db.prepare('DELETE FROM workflows WHERE id = ?').run(workflowId);
  return result.changes > 0;
}

/** List all workflows */
export function listWorkflows(db: Database): Workflow[] {
  const rows = db.prepare('SELECT id, name, steps, created_at FROM workflows ORDER BY name').all() as any[];
  return rows.map(r => ({ id: r.id, name: r.name, steps: JSON.parse(r.steps), createdAt: r.created_at }));
}

/** Assign a bookmark to a workflow, starting at the first step */
export function assignToWorkflow(db: Database, bookmarkId: number, workflowId: number): BookmarkWorkflowState {
  const workflow = db.prepare('SELECT id, name, steps FROM workflows WHERE id = ?').get(workflowId) as any;
  if (!workflow) throw new Error(`Workflow ${workflowId} not found`);
  const steps: string[] = JSON.parse(workflow.steps);
  const firstStep = steps[0];
  db.prepare(`
    INSERT INTO bookmark_workflow_states (bookmark_id, workflow_id, current_step, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(bookmark_id, workflow_id) DO UPDATE SET current_step = excluded.current_step, updated_at = excluded.updated_at
  `).run(bookmarkId, workflowId, firstStep);
  return getWorkflowState(db, bookmarkId, workflowId)!;
}

/** Advance a bookmark to the next step in a workflow */
export function advanceWorkflowStep(db: Database, bookmarkId: number, workflowId: number): BookmarkWorkflowState {
  const state = getWorkflowState(db, bookmarkId, workflowId);
  if (!state) throw new Error(`Bookmark ${bookmarkId} is not assigned to workflow ${workflowId}`);
  const workflow = db.prepare('SELECT steps FROM workflows WHERE id = ?').get(workflowId) as any;
  const steps: string[] = JSON.parse(workflow.steps);
  const idx = steps.indexOf(state.currentStep);
  if (idx === -1 || idx === steps.length - 1) throw new Error(`Already at final step: ${state.currentStep}`);
  const nextStep = steps[idx + 1];
  db.prepare(`UPDATE bookmark_workflow_states SET current_step = ?, updated_at = datetime('now') WHERE bookmark_id = ? AND workflow_id = ?`)
    .run(nextStep, bookmarkId, workflowId);
  return getWorkflowState(db, bookmarkId, workflowId)!;
}

/** Get current workflow state for a bookmark */
export function getWorkflowState(db: Database, bookmarkId: number, workflowId: number): BookmarkWorkflowState | null {
  const row = db.prepare(`
    SELECT s.bookmark_id, s.workflow_id, w.name AS workflow_name, s.current_step, s.updated_at
    FROM bookmark_workflow_states s JOIN workflows w ON w.id = s.workflow_id
    WHERE s.bookmark_id = ? AND s.workflow_id = ?
  `).get(bookmarkId, workflowId) as any;
  if (!row) return null;
  return { bookmarkId: row.bookmark_id, workflowId: row.workflow_id, workflowName: row.workflow_name, currentStep: row.current_step, updatedAt: row.updated_at };
}

/** List all bookmarks at a given step in a workflow */
export function listByWorkflowStep(db: Database, workflowId: number, step: string): BookmarkWorkflowState[] {
  const rows = db.prepare(`
    SELECT s.bookmark_id, s.workflow_id, w.name AS workflow_name, s.current_step, s.updated_at
    FROM bookmark_workflow_states s JOIN workflows w ON w.id = s.workflow_id
    WHERE s.workflow_id = ? AND s.current_step = ?
  `).all(workflowId, step) as any[];
  return rows.map(r => ({ bookmarkId: r.bookmark_id, workflowId: r.workflow_id, workflowName: r.workflow_name, currentStep: r.current_step, updatedAt: r.updated_at }));
}

/** Remove a bookmark from a workflow */
export function removeFromWorkflow(db: Database, bookmarkId: number, workflowId: number): boolean {
  const result = db.prepare('DELETE FROM bookmark_workflow_states WHERE bookmark_id = ? AND workflow_id = ?').run(bookmarkId, workflowId);
  return result.changes > 0;
}
