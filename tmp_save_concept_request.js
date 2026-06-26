import fetch from 'node-fetch'
const url = 'http://127.0.0.1:3000/api/save-concept'
const body = {
  subject: 'API Test Subject',
  concept: 'API Test Concept',
  masteryLevel: 'Introduced',
  overviewGist: 'Test overview',
  deepDiveGist: ['Detail1'],
  strongAreas: ['Strength1'],
  weakAreas: ['Weak1'],
  nextSteps: ['Step1'],
  notes: 'Test notes'
}
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})
console.log('status', res.status)
console.log('body', await res.text())
