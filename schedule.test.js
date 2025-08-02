process.env.TZ = 'America/New_York';
const assert = require('assert');
const { createSchedule } = require('./app.js');

function countDoses(schedule) {
  return schedule.reduce((sum, day) => sum + day.doses.length, 0);
}

const schedule = createSchedule('test', '2024-05-01', 2, 10, '20:00');

assert.strictEqual(countDoses(schedule), 20, 'Total doses should equal dosesPerDay * totalDays');
assert.strictEqual(schedule[0].doses.length, 1, 'First day should have one dose when starting in the evening');
assert.strictEqual(schedule[schedule.length - 1].doses.length, 1, 'Last day should contain remaining dose');
const firstDay = new Date(schedule[0].date);
assert.strictEqual(firstDay.getFullYear(), 2024, 'Year should match start date');
assert.strictEqual(firstDay.getMonth() + 1, 5, 'Month should match start date');
assert.strictEqual(firstDay.getDate(), 1, 'Day should match start date');

console.log('All schedule tests passed');
