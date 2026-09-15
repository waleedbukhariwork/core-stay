import { DiagnosticFailure, type DiagnosticDefinition } from './diagnostic.js';

export const INITIAL_DIAGNOSTIC_ID = 'engineering_diagnostic';
export const INITIAL_DIAGNOSTIC_VERSION = 'engineering-baseline-v1';
// Published definitions are immutable: retain old versions while sessions reference them.
// Populate only with product-approved, curated questions and answer keys.
const engineeringBaselineV1 = Object.freeze({
  id: INITIAL_DIAGNOSTIC_ID,
  version: INITIAL_DIAGNOSTIC_VERSION,
  questions: Object.freeze([
    {
      id: 'async-user-return-v1',
      category: 'spot_the_bug',
      interactionType: 'single_choice',
      skill: { id: 'debugging', label: 'Debugging' },
      concept: { id: 'async-control-flow', label: 'Asynchronous control flow' },
      difficulty: 'foundational',
      prompt:
        'Why can this function return undefined even when the request succeeds?',
      context:
        'Assume fetch resolves successfully and the response body contains a valid user.',
      code: `async function loadUser(id) {
  let user;
  fetch('/users/' + id)
    .then((response) => response.json())
    .then((data) => { user = data; });
  return user;
}`,
      options: [
        {
          id: 'async-user-return-a',
          label:
            'The function returns before the promise callbacks assign user.',
        },
        {
          id: 'async-user-return-b',
          label: 'fetch cannot be called from an async function.',
        },
        {
          id: 'async-user-return-c',
          label: 'response.json() always returns undefined.',
        },
        {
          id: 'async-user-return-d',
          label: 'The user variable must be declared outside the function.',
        },
      ],
      confidenceRequested: false,
      correctOptionId: 'async-user-return-a',
      explanation:
        'Starting a promise chain does not pause the function. The return executes while user is still undefined. Await the fetch and body parsing, then return the parsed value.',
      keyIdea:
        'Trace asynchronous control flow by following what is awaited, returned and allowed to continue.',
    },
    {
      id: 'http-timeout-retry-v1',
      category: 'conceptual_reasoning',
      interactionType: 'single_choice',
      skill: { id: 'api-design', label: 'API and HTTP reasoning' },
      concept: { id: 'idempotent-retry', label: 'Idempotent retries' },
      difficulty: 'foundational',
      prompt:
        'A mobile client times out after requesting that email notifications be disabled. Which API behavior makes an immediate retry safest?',
      context:
        'The client cannot tell whether the first request reached the server. Authentication and validation still apply to every attempt.',
      code: null,
      options: [
        {
          id: 'http-timeout-retry-a',
          label: 'Toggle the current value again on every request.',
        },
        {
          id: 'http-timeout-retry-b',
          label:
            'Accept the desired value disabled and replace the stored value idempotently.',
        },
        {
          id: 'http-timeout-retry-c',
          label: 'Return success without reading or writing server state.',
        },
        {
          id: 'http-timeout-retry-d',
          label: 'Reject every repeated request, including identical retries.',
        },
      ],
      confidenceRequested: false,
      correctOptionId: 'http-timeout-retry-b',
      explanation:
        'Replacing state with an explicit desired value has the same result whether the request is applied once or repeatedly. A toggle can undo a successful first request.',
      keyIdea:
        'Design retryable operations around desired state or an idempotency key, not blind state transitions.',
    },
    {
      id: 'inventory-order-atomicity-v1',
      category: 'scenario_judgment',
      interactionType: 'single_choice',
      skill: { id: 'databases', label: 'Databases' },
      concept: { id: 'atomic-invariant', label: 'Atomic business invariants' },
      difficulty: 'intermediate',
      prompt:
        'Which implementation best prevents an order from being created when there is not enough inventory?',
      context:
        'Creating the order and reserving stock are PostgreSQL writes in the same service. Concurrent requests may target the same product.',
      code: null,
      options: [
        {
          id: 'inventory-order-atomicity-a',
          label:
            'Read stock, commit, then create the order and decrement stock in separate operations.',
        },
        {
          id: 'inventory-order-atomicity-b',
          label:
            'Create the order first and asynchronously correct negative inventory later.',
        },
        {
          id: 'inventory-order-atomicity-c',
          label:
            'In one transaction, conditionally reserve available stock, verify it succeeded, and create the order using the same transaction connection.',
        },
        {
          id: 'inventory-order-atomicity-d',
          label:
            'Check available stock only in the client before submitting the order.',
        },
      ],
      confidenceRequested: true,
      correctOptionId: 'inventory-order-atomicity-c',
      explanation:
        'A conditional stock update and order insert in one transaction make the invariant atomic. If the reservation affects no row, the transaction can fail without creating an order.',
      keyIdea:
        'Enforce contested business invariants inside the database transaction that owns every related write.',
    },
    {
      id: 'concurrent-withdrawal-v1',
      category: 'predict_outcome',
      interactionType: 'single_choice',
      skill: { id: 'concurrency', label: 'Concurrency and system behavior' },
      concept: { id: 'lost-update', label: 'Lost updates' },
      difficulty: 'intermediate',
      prompt:
        'Two requests run this read-modify-write flow concurrently. Both read a balance of 100 and each withdraws 80. What failure can occur?',
      context:
        'Assume PostgreSQL read committed isolation, no row lock, and each request records its withdrawal before committing.',
      code: `BEGIN;
SELECT balance FROM accounts WHERE id = 42;
-- application calculates 100 - 80
UPDATE accounts SET balance = 20 WHERE id = 42;
COMMIT;`,
      options: [
        {
          id: 'concurrent-withdrawal-a',
          label:
            'Both withdrawals can commit while the final balance is 20, hiding one balance update.',
        },
        {
          id: 'concurrent-withdrawal-b',
          label: 'PostgreSQL always rejects the second SELECT automatically.',
        },
        {
          id: 'concurrent-withdrawal-c',
          label: 'The final balance is guaranteed to be minus 60.',
        },
        {
          id: 'concurrent-withdrawal-d',
          label: 'Both transactions are guaranteed to roll back as deadlocks.',
        },
      ],
      confidenceRequested: true,
      correctOptionId: 'concurrent-withdrawal-a',
      explanation:
        'Each request calculates from the same stale value and later writes 20. Both withdrawal records may commit, but one balance update overwrites the other. A row lock or conditional atomic update is needed.',
      keyIdea:
        'A transaction alone does not prevent lost updates; the read and write must use an appropriate locking or atomic-update strategy.',
    },
    {
      id: 'password-reset-token-v1',
      category: 'better_approach',
      interactionType: 'single_choice',
      skill: { id: 'security', label: 'Security' },
      concept: { id: 'reset-token-lifecycle', label: 'Reset token lifecycle' },
      difficulty: 'intermediate',
      prompt:
        'Which design is the safest practical improvement for password-reset tokens?',
      context:
        'The current implementation stores reusable reset tokens in plaintext for 24 hours.',
      code: null,
      options: [
        {
          id: 'password-reset-token-a',
          label:
            'Use a short numeric token and keep it reusable so users are not locked out.',
        },
        {
          id: 'password-reset-token-b',
          label:
            'Encrypt the token but keep the decryption key beside it in the same row.',
        },
        {
          id: 'password-reset-token-c',
          label:
            'Generate a high-entropy token, store only a verifier, expire it quickly, and consume it atomically once.',
        },
        {
          id: 'password-reset-token-d',
          label: 'Log the token so support can recover it for the user.',
        },
      ],
      confidenceRequested: false,
      correctOptionId: 'password-reset-token-c',
      explanation:
        'A random high-entropy token resists guessing, a stored hash or HMAC limits damage from a database read, and short expiry plus atomic one-time consumption limits replay.',
      keyIdea:
        'Treat recovery tokens like credentials: minimize exposure, lifetime and replay opportunity.',
    },
    {
      id: 'project-owner-n-plus-one-v1',
      category: 'scenario_judgment',
      interactionType: 'single_choice',
      skill: { id: 'performance', label: 'Performance and reliability' },
      concept: { id: 'n-plus-one-queries', label: 'N+1 database queries' },
      difficulty: 'intermediate',
      prompt:
        'An endpoint loads 100 projects, then issues one sequential owner query for each project. What is the best targeted improvement?',
      context:
        'Tracing confirms that these 101 database round trips dominate endpoint latency and the response needs only owner id and display name.',
      code: null,
      options: [
        {
          id: 'project-owner-n-plus-one-a',
          label:
            'Increase the HTTP timeout and keep the query pattern unchanged.',
        },
        {
          id: 'project-owner-n-plus-one-b',
          label:
            'Fetch the required owners with a set-based join or bounded batch query.',
        },
        {
          id: 'project-owner-n-plus-one-c',
          label:
            'Run an additional owner query to warm each result before use.',
        },
        {
          id: 'project-owner-n-plus-one-d',
          label: 'Return every owner column so no future query can be needed.',
        },
      ],
      confidenceRequested: false,
      correctOptionId: 'project-owner-n-plus-one-b',
      explanation:
        'A set-based query removes repeated network and database overhead while selecting only the fields the endpoint needs. A longer timeout hides the symptom rather than reducing work.',
      keyIdea:
        'Use evidence to remove repeated I/O at the data boundary, and fetch only the required shape.',
    },
    {
      id: 'payment-timeout-retry-v1',
      category: 'spot_the_bug',
      interactionType: 'single_choice',
      skill: { id: 'reliability', label: 'Reliability' },
      concept: { id: 'idempotency-key', label: 'Idempotent side effects' },
      difficulty: 'advanced',
      prompt:
        'What is the critical bug in retrying this payment request after a timeout?',
      context:
        'The payment provider may create the charge and lose the response. POST /charges creates a new charge on every accepted request.',
      code: `for (let attempt = 0; attempt < 3; attempt++) {
  try {
    return await post('/charges', { customerId, amount });
  } catch (error) {
    if (!isTimeout(error)) throw error;
  }
}`,
      options: [
        {
          id: 'payment-timeout-retry-a',
          label:
            'A lost successful response can make a retry create a duplicate charge.',
        },
        {
          id: 'payment-timeout-retry-b',
          label: 'The loop can never make more than one HTTP request.',
        },
        {
          id: 'payment-timeout-retry-c',
          label:
            'Timeouts prove that the provider did not receive the request.',
        },
        {
          id: 'payment-timeout-retry-d',
          label: 'POST automatically deduplicates identical JSON bodies.',
        },
      ],
      confidenceRequested: false,
      correctOptionId: 'payment-timeout-retry-a',
      explanation:
        'A timeout makes the result uncertain; it does not prove failure. The client should reuse a stable idempotency key, and the server/provider must atomically bind that key to one outcome.',
      keyIdea:
        'Retries of non-idempotent side effects require durable deduplication across uncertain outcomes.',
    },
    {
      id: 'out-of-order-plan-events-v1',
      category: 'predict_outcome',
      interactionType: 'single_choice',
      skill: { id: 'distributed-systems', label: 'Distributed systems' },
      concept: { id: 'event-ordering', label: 'Out-of-order events' },
      difficulty: 'advanced',
      prompt:
        'A consumer receives plan version 42 (premium) and then delayed version 41 (basic). It unconditionally upserts each event. What happens, and what protects the projection?',
      context:
        'Delivery is at least once and ordering is not guaranteed across retries.',
      code: null,
      options: [
        {
          id: 'out-of-order-plan-events-a',
          label:
            'The projection can regress to basic; apply an atomic per-user version check and ignore versions that are not newer.',
        },
        {
          id: 'out-of-order-plan-events-b',
          label:
            'The projection stays premium because databases automatically compare event versions.',
        },
        {
          id: 'out-of-order-plan-events-c',
          label:
            'The projection becomes invalid only if both events arrive in the same millisecond.',
        },
        {
          id: 'out-of-order-plan-events-d',
          label: 'Retry version 41 until it is accepted after version 42.',
        },
      ],
      confidenceRequested: true,
      correctOptionId: 'out-of-order-plan-events-a',
      explanation:
        'An unconditional upsert applies arrival order, so the delayed older event overwrites newer state. Comparing and advancing the stored version atomically makes duplicates and older events harmless.',
      keyIdea:
        'When delivery can be duplicated or reordered, make consumers monotonic using stable identity and versioned state transitions.',
    },
  ]),
} satisfies DiagnosticDefinition);

const definitions: readonly DiagnosticDefinition[] = Object.freeze([
  engineeringBaselineV1,
]);

export function currentDefinition(): DiagnosticDefinition {
  const definition = definitions.at(-1);
  if (!definition || !definition.questions.length)
    throw new DiagnosticFailure('DIAGNOSTIC_UNAVAILABLE');
  return definition;
}

export function getDefinition(
  id: string,
  version: string,
): DiagnosticDefinition {
  const definition = definitions.find(
    (item) => item.id === id && item.version === version,
  );
  if (!definition) throw new DiagnosticFailure('DIAGNOSTIC_UNAVAILABLE');
  return definition;
}
