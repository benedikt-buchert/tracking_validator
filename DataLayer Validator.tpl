___TERMS_OF_SERVICE___

By creating or modifying this file you agree to Google Tag Manager's Community
Template Gallery Developer Terms of Service available at
https://developers.google.com/tag-manager/gallery-tos (or such other URL as
Google may provide), as modified from time to time.


___INFO___

{
  "type": "TAG",
  "id": "cvt_temp_public_id",
  "version": 1,
  "securityGroups": [],
  "displayName": "DataLayer Validator",
  "brand": {
    "id": "brand_dummy",
    "displayName": ""
  },
  "description": "Injects the dataLayer validator script",
  "containerContexts": [
    "WEB"
  ]
}


___TEMPLATE_PARAMETERS___

[
  {
    "type": "TEXT",
    "name": "schemaUrl",
    "displayName": "The schema to validate the dataLayer against.",
    "simpleValueType": true,
    "defaultValue": "https://tracking-docs-demo.buchert.digital/schemas/1.2.0/event-reference.json",
    "valueValidators": []
  },
  {
    "type": "TEXT",
    "name": "scriptToInject",
    "displayName": "Script to inject",
    "simpleValueType": true,
    "defaultValue": "https://tracking-docs-demo.buchert.digital/static/dataLayer.js"
  }
]


___SANDBOXED_JS_FOR_WEB_TEMPLATE___

const injectScript = require('injectScript');
const encodeUri = require('encodeUri');

const onSuccess = data.gtmOnSuccess;
const onFailure = data.gtmOnFailure;
if( data.scriptToInject && data.schemaUrl) {
  const url = data.scriptToInject + '?schema_url=' + encodeUri(data.schemaUrl);
  injectScript(url, onSuccess(), onFailure());
} else {
  onFailure();
}


___WEB_PERMISSIONS___

[
  {
    "instance": {
      "key": {
        "publicId": "inject_script",
        "versionId": "1"
      },
      "param": [
        {
          "key": "urls",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 1,
                "string": "https://tracking-docs-demo.buchert.digital/static/dataLayer.js?schema_url\u003d*"
              }
            ]
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
- name: Untitled test 1
  code: |-
    const mockData = {
      scriptToInject: 'https://tracking-docs-demo.buchert.digital/static/dataLayer.js',
      schemaUrl: 'https://tracking-docs-demo.buchert.digital/schemas/1.2.0/event-reference.json'
    };

    // Call runCode to run the template's code.
    runCode(mockData);

    // Verify that the tag finished successfully.
    assertApi('gtmOnSuccess').wasCalled();


___NOTES___

Created on 26/01/2026, 20:58:57


