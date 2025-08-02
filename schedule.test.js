process.env.TZ = 'America/New_York';
const assert = require('assert');
const { createSchedule } = require('./app.js');

function countDoses(schedule) {
  return schedule.reduce((sum, day) => sum + day.doses.length, 0);
}

const schedule = createSchedule('test', '2024-05-01', 2, 10, '20:00', 'timed');

assert.strictEqual(countDoses(schedule), 20, 'Total doses should equal dosesPerDay * totalDays');
assert.strictEqual(schedule[0].doses.length, 1, 'First day should have one dose when starting in the evening');
assert.strictEqual(schedule[schedule.length - 1].doses.length, 1, 'Last day should contain remaining dose');
const firstDay = new Date(schedule[0].date);
assert.strictEqual(firstDay.getFullYear(), 2024, 'Year should match start date');
assert.strictEqual(firstDay.getMonth() + 1, 5, 'Month should match start date');
assert.strictEqual(firstDay.getDate(), 1, 'Day should match start date');

const labelSchedule = createSchedule('label', '2024-05-01', 2, 2, '08:00', 'label', ['AM', 'PM'], 'AM');
assert.strictEqual(labelSchedule[0].doses[0].time, 'AM', 'Label should be stored as time');
assert.strictEqual(countDoses(labelSchedule), 4, 'Label schedule should respect doses per day');

const pmStartSchedule = createSchedule('pmstart', '2024-05-01', 2, 2, '08:00', 'label', ['AM', 'PM'], 'PM');
assert.strictEqual(pmStartSchedule[0].doses[0].time, 'PM', 'First day should start with PM when specified');
assert.strictEqual(pmStartSchedule[0].doses.length, 1, 'First day should have one dose when starting with PM');
assert.strictEqual(countDoses(pmStartSchedule), 4, 'PM start schedule should respect doses per day');

console.log('All schedule tests passed');
