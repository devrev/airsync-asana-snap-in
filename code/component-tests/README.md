# Dynamic EDM and IDM component tests

Expectations are modeled synthetic cases based on Asana's [project custom fields](https://developers.asana.com/reference/getcustomfieldsettingsforproject), [project sections](https://developers.asana.com/reference/getsectionsforproject), and the checked-in IDM/connector contract. Expected field IDs, types, enum keys, stages, and values are authored in manifests independently of emitted output. They are not live API samples.

- `metadata-base`: no custom fields or sections; stock record types and static IDM remain available.
- `metadata-customized`: two pages each of custom fields and sections; text, number, enum/deprecated option, people references, subtask fields, and stage diagram completeness.
- `metadata-rate-limit`: one modeled 429, real metadata continuation, final complete EDM, and exactly one IDM installation across invocations. Only the wall-clock delay is skipped.
- `metadata-values`: metadata followed by real data extraction; typed custom-field values, enum/reference/section IDs, and omission of a field belonging to another project. Chef validates the emitted task against the captured EDM.
- `metadata-denied`: denied custom-field discovery must emit an error.

The same-process regression in `metadata-isolation.test.ts` executes the actual registered metadata task with real enrichment helpers for customized then base projects. Only the external API and SDK task registration are replaced; the test checks that the imported base and previous result do not change.

These scenarios require the FORGE-785 schema-capture extension in `airdrop-snap-in-mock-dependencies`; it is not in published tester 1.0.1. Repository and GitHub Packages read access to 1.0.1 were verified separately. The pilot uses Node 22.23.2, npm 10.9.8, the supported external mock 1.0.0 (darwin-arm64), Chef 0.11.4, and an AirSync CLI build supporting `validate consistency`.

From the connector root, build with `npm --prefix code run build`, then run:

```sh
TEST_RUNNER=/path/to/airdrop-snap-in-mock-dependencies/bin/airdrop-extraction-test.js
AIRSYNC_BIN=/path/to/airsync-cli/out/airsync
AIRDROP_EXTERNAL_API_MOCK=/path/to/airdrop-external-api-mock \
  node "$TEST_RUNNER" --all --fixtures code/component-tests --connector-root code \
  --output-root code/.fixture-runs --airsync-bin "$AIRSYNC_BIN" --chef-bin chef-cli
```

The real compiled `functionFactory.extraction` and SDK workers run against synthetic credentials and local provider responses. `MOCK_SERVER_URL` reaches the production HTTP client only with `AIRSYNC_LOCAL_DEVELOPMENT=1`, a plain loopback origin, and no Lambda deployment markers (including empty markers). Provider API prefixes, production endpoints, and retry behavior are preserved. No proxy, passthrough, SDK migration, or replacement business client is involved.

The runner captures the confirmed EDM upload from the completed metadata invocation and the installed IDM, then writes snapshots, provenance, assertions, and validator results under ignored `code/.fixture-runs/`. Output assertions and validator gates have separate results. Every successful metadata case enables consistency and Chef checks; `metadata-denied` requires the terminal error. Preparation included parsing the manifests, probing the supported mock's actual routes/pages, and checking production-default HTTP behavior. Separate wrong-output controls changed the expected record-type count to 999 and correctly exited 1; the valid expectations were restored.

The pilot uses `@devrev/airsync-sdk` 2.1.0. All lifecycle/output assertions, consistency, EDM validation, IDM conversion, and representative task data validation passed. Chef IDM checking reports the existing required `applies_to_part_id` setup selections for tasks/subtasks, so the complete happy scenarios deliberately remain nonzero until those selections are resolved or Chef distinguishes unresolved setup from invalid mappings. The tests keep that finding visible. The full offline Jest suite and the new isolation regression pass.

This covers dynamic EDM with static IDM defaults. It does not prove user-edited Recipe blueprint behavior, live capture/freshness, every imported record type, attachment bytes, reverse sync, schema changes between separate sync runs, or same-process full SDK lifecycle reuse. Scenario contracts still need human review for the supervised pilot.
