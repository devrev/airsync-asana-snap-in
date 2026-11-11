import { processExtractionTask } from '@devrev/airsync-sdk';

import { AsanaClient } from '@asana/api-client';
import baseMetadata from '@asana/external_domain_metadata.json';

jest.mock('@devrev/airsync-sdk', () => ({
  ...jest.requireActual('@devrev/airsync-sdk'),
  processExtractionTask: jest.fn(),
}));
jest.mock('@asana/api-client');

// Run the registered production task twice in one module instance, with real enrichment helpers.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./metadata-extraction');
const task = (processExtractionTask as jest.Mock).mock.calls[0][0].task;

test('keeps customized project metadata out of a later base project in the same process', async () => {
  const original = structuredClone(baseMetadata);
  let custom = true;
  (AsanaClient as unknown as jest.Mock).mockImplementation(() => ({
    getProject: jest.fn().mockResolvedValue({ data: { data: { gid: 'project' } } }),
    getCustomFieldSettingsForProject: jest.fn().mockImplementation(async () => ({ data: { data: custom
      ? [{ custom_field: { gid: '9001', name: 'Project note', type: 'text' } }] : [] } })),
    getSectionsForProject: jest.fn().mockImplementation(async () => ({ data: { data: custom
      ? [{ gid: '810', name: 'Todo' }, { gid: '830', name: 'Done' }] : [] } })),
  }));
  const run = async () => {
    const push = jest.fn();
    const adapter = { state: {}, event: {}, initializeRepos: jest.fn(), getRepo: () => ({ push }) };
    expect(await task({ adapter })).toEqual({ status: 'success' });
    return push.mock.calls[0][0][0];
  };
  const customized = await run();
  expect(customized.record_types.tasks.fields['9001'].type).toBe('text');
  expect(customized.record_types.tasks.stage_diagram.starting_stage).toBe('810');
  custom = false;
  const base = await run();
  expect(base.record_types.tasks.fields).not.toHaveProperty('9001');
  expect(base.record_types.tasks.stage_diagram).toBeUndefined();
  expect(baseMetadata).toEqual(original);
  expect(customized.record_types.tasks.fields['9001'].type).toBe('text');
});
