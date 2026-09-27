const test = require('node:test');
const assert = require('node:assert');

test('Student Placement System - Basic CI Test', () => {
    assert.strictEqual(1 + 1, 2);
});

test('Student Placement System - String Test', () => {
    const projectName = 'Student Placement System';
    assert.ok(projectName.includes('Placement'));
});
