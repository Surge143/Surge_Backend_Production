function mockParse(rawKey) {
  return rawKey ? rawKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '').trim() : undefined
}

const testCases = [
  {
    name: 'Correct PEM',
    input:
      '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDESi9d1VWrS5Qx\n-----END PRIVATE KEY-----',
    expected:
      '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDESi9d1VWrS5Qx\n-----END PRIVATE KEY-----',
  },
  {
    name: 'Escaped Newlines',
    input:
      '-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDESi9d1VWrS5Qx\\n-----END PRIVATE KEY-----',
    expected:
      '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDESi9d1VWrS5Qx\n-----END PRIVATE KEY-----',
  },
  {
    name: 'Quoted String with Escaped Newlines',
    input:
      '"-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDESi9d1VWrS5Qx\\n-----END PRIVATE KEY-----"',
    expected:
      '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDESi9d1VWrS5Qx\n-----END PRIVATE KEY-----',
  },
  {
    name: 'With Whitespace',
    input:
      '  -----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDESi9d1VWrS5Qx\\n-----END PRIVATE KEY-----  ',
    expected:
      '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDESi9d1VWrS5Qx\n-----END PRIVATE KEY-----',
  },
  {
    name: 'Undefined',
    input: undefined,
    expected: undefined,
  },
]

let allPassed = true
testCases.forEach((tc) => {
  const result = mockParse(tc.input)
  if (result === tc.expected) {
    console.log(`✅ PASS: ${tc.name}`)
  } else {
    console.log(`❌ FAIL: ${tc.name}`)
    console.log(`   Expected: ${JSON.stringify(tc.expected)}`)
    console.log(`   Actual:   ${JSON.stringify(result)}`)
    allPassed = false
  }
})

if (allPassed) {
  process.exit(0)
} else {
  process.exit(1)
}
