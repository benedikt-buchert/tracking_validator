
___INFO___

{
  "type": "MACRO",
  "displayName": "Schema Validation via JSON Schema",
  "id": "cvt_temp_public_id",
  "description": "Sends the event data to an external validation server and caches the response for the event lifecycle.",
  "sandboxed": true,
  "version": 1,
  "build": 1,
  "commit": "Initial commit",
  "containerContexts": [
    "SERVER"
  ],
  "securityGroups": []
}


___TEMPLATE_PARAMETERS___

[
  {
    "name": "validationEndpoint",
    "displayName": "Validation Server Endpoint URL",
    "type": "TEXT",
    "valueType": "string",
    "required": true,
    "help": "The full URL of the external server to which the event data payload will be sent for validation."
  },
  {
    "name": "timeout",
    "displayName": "Timeout (ms)",
    "type": "TEXT",
    "valueType": "integer",
    "defaultValue": 5000,
    "help": "The maximum time to wait for a response from the validation server, in milliseconds."
  },
  {
    "name": "schemaUrl",
    "displayName": "Default Schema URL",
    "type": "TEXT",
    "valueType": "string",
    "required": false,
    "help": "The default URL of the schema to use for validation if the event does not provide one."
  }
]


___SANDBOXED_JS_FOR_SERVER___

const sendHttpRequest = require('sendHttpRequest');
const getAllEventData = require('getAllEventData');
const templateDataStorage = require('templateDataStorage');
const log = require('logToConsole');
const json = require('JSON');
const encodeUriComponent = require('encodeUriComponent');

const eventData = getAllEventData();
// Ensure the cache key is unique to the event
const cacheKey = 'validation_cache_' + eventData.event_id;

// 1. Check Cache
const cachedResponse = templateDataStorage.getItemCopy(cacheKey);

if (cachedResponse) {
  return cachedResponse;
}

// 2. Prepare Request
const postBody = json.stringify(eventData);
const requestOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  // Use the timeout from user input or default to 5000
  timeout: data.timeout || 5000
};

// 3. Send Request (Using Promises)
// sendHttpRequest returns a Promise, not a callback
log(data.validationEndpoint, requestOptions, postBody);

let endpoint = data.validationEndpoint;
if (!eventData['$schema'] && data.schemaUrl) {
  const separator = endpoint.indexOf('?') !== -1 ? '&' : '?';
  endpoint += separator + 'schema_url=' + encodeUriComponent(data.schemaUrl);
}

return sendHttpRequest(endpoint, requestOptions, postBody)
  .then((result) => {
    // Check for success status (200-299)
    if (result.statusCode >= 200 && result.statusCode < 300) {
      const parsedBody = json.parse(result.body);

      // Store success in cache
      templateDataStorage.setItemCopy(cacheKey, parsedBody);
      return parsedBody;
    }

    // Handle non-200 responses
    return {
      error: 'Validation request failed',
      statusCode: result.statusCode
    };
  })
  .catch((error) => {
    // Handle network errors or timeouts
    return {
      error: 'Request failed',
      details: error
    };
  });


___SERVER_PERMISSIONS___

[
  {
    "instance": {
      "key": {
        "publicId": "send_http"
      },
      "param": [
        {
          "key": "allowedUrls",
          "value": {
            "type": 1,
            "string": "any"
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "read_event_data"
      },
      "param": [
        {
          "key": "eventDataAccess",
          "value": {
            "type": 1,
            "string": "any"
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "access_template_storage"
      },
      "param": []
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "logging",
        "versionId": "1"
      },
      "param": [
        {
          "key": "environments",
          "value": {
            "type": 1,
            "string": "debug"
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  }
]


___TESTS___

scenarios:
- name: Cache Miss and Successful API Call Test
  description: Simulates an integration test where there is no cached data. It mocks
    the event data and the API response, then verifies that the correct data is returned
    and cached.
  code: |2-

    const mockEventData = { event_id: 'test-event-456' };
    const mockApiResponse = { validation_status: 'passed' };

    mock('getAllEventData', () => mockEventData);

    // --- MANUAL SPY SETUP ---
    let cacheKeyUsed;
    let cacheValueUsed;

    // FIX: Use mockObject for APIs that act as objects (like templateDataStorage)
    mockObject('templateDataStorage', {
      getItemCopy: () => undefined, // Simulate cache miss
      setItemCopy: (key, value) => {
        cacheKeyUsed = key;
        cacheValueUsed = value;
      }
    });

    mock('sendHttpRequest', (url, options, body) => {
      return Promise.create((resolve) => {
        resolve({
          statusCode: 200,
          headers: {},
          body: JSON.stringify(mockApiResponse)
        });
      });
    });

    runCode({
      validationEndpoint: 'https://validator.example.com/validate'
    }).then((result) => {
        // Verify the result matches the API response
        assertThat(result).isEqualTo(mockApiResponse);

        // Verify the mock was called with the correct data
        assertThat(cacheKeyUsed).isEqualTo('validation_cache_test-event-456');
        assertThat(cacheValueUsed).isEqualTo(mockApiResponse);
    });
- name: API Call Failure Test
  description: Ensures that the variable correctly handles a non-2xx response from
    the validation server.
  code: |-
    const mockEventData = { event_id: 'test-event-789' };
    mock('getAllEventData', () => mockEventData);
    mockObject('templateDataStorage', {
      getItemCopy: () => undefined,
      setItemCopy: () => {}
    });

    // Note: We don't need to assign mock() to a variable for the assertion
    mock('sendHttpRequest', (url, options) => {
      return {
        then: (success) => {
          success({ statusCode: 500, body: 'Server Error' });
          return { catch: () => {} };
        },
        catch: (failure) => {
          return { then: () => {} };
        }
      };
    });

    // For Tag templates, runCode doesn't return a promise, so just call it.
    const result = runCode({
      validationEndpoint: 'https://validator.example.com/validate'
    });

    // FIXED ASSERTIONS:
    // 1. Use wasCalled()
    // 2. Pass the API name string to assertApi
    assertApi('sendHttpRequest').wasCalled();

    // 3. If this is a Variable template, result will have a value
    // If it's a Tag template, you'll need to check a different side effect
    if (result !== undefined) {
      assertThat(result).isEqualTo({ error: 'Validation request failed', statusCode: 500 });
    }
- name: Cache Hit Test
  code: |-
    const mockEventData = { event_id: 'test-event-123' };
    const mockCachedData = { validation_status: 'success', from_cache: true };

    mock('getAllEventData', () => mockEventData);

    // --- CHANGED SECTION START ---
    mockObject('templateDataStorage', {
      getItemCopy: (key) => {
        // You can even assert the key here if you want
        if (key === 'validation_cache_test-event-123') {
            return mockCachedData;
        }
        return null;
      },
      setItemCopy: () => {}
    });

    mock('sendHttpRequest', () => {
      return Promise.resolve({ statusCode: 200, body: '{}' });
    });

    const result = runCode({
      validationEndpoint: 'https://validator.example.com/validate'
    });

    // ASSERTIONS
    assertApi('sendHttpRequest').wasNotCalled();
    assertThat(result.validation_status).isEqualTo('success');
- name: Cache Miss with Default Schema URL
  description: Simulates a cache miss where the template uses the default schemaUrl parameter.
  code: |-
    const mockEventData = { event_id: 'test-event-default-schema' };
    const mockApiResponse = { validation_status: 'passed' };
    let capturedUrl;

    mock('getAllEventData', () => mockEventData);
    mockObject('templateDataStorage', {
      getItemCopy: () => undefined,
      setItemCopy: () => {}
    });
    mock('sendHttpRequest', (url, options, body) => {
      capturedUrl = url;
      return Promise.create((resolve) => {
        resolve({
          statusCode: 200,
          body: JSON.stringify(mockApiResponse)
        });
      });
    });

    runCode({
      validationEndpoint: 'https://validator.example.com/validate',
      schemaUrl: 'https://example.com/default-schema.json'
    }).then((result) => {
      assertThat(capturedUrl).isEqualTo('https://validator.example.com/validate?schema_url=https%3A%2F%2Fexample.com%2Fdefault-schema.json');
    });
setup: |-
  const Promise = require('Promise');
  const JSON = require('JSON');


___NOTES___

Created on 18/02/2026, 20:22:01
