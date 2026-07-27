const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const dbPath = path.join(__dirname, "data", "app.db");
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const seedAccounts = [
  { studentId: "2024000001", password: "123456", name: "Demo User", role: "user" },
  { studentId: "2024000002", password: "123456", name: "Financial Analyst", role: "analyst" },
  { studentId: "2024000003", password: "admin123", name: "Admin", role: "admin" }
];

const insertSeed = db.prepare(`
  INSERT OR IGNORE INTO accounts (student_id, password, name, role)
  VALUES (?, ?, ?, ?)
`);

for (const account of seedAccounts) {
  insertSeed.run(account.studentId, account.password, account.name, account.role);
}

const findAccountByStudentId = db.prepare(`
  SELECT id, student_id AS studentId, password, name, role, created_at AS createdAt
  FROM accounts
  WHERE student_id = ?
`);

const createAccountStatement = db.prepare(`
  INSERT INTO accounts (student_id, password, name, role)
  VALUES (?, ?, ?, 'user')
`);

const listAccountsStatement = db.prepare(`
  SELECT id, student_id AS studentId, name, role, created_at AS createdAt
  FROM accounts
  ORDER BY id ASC
`);

function createAccount(studentId, password, name = "New User") {
  createAccountStatement.run(studentId, password, name);
  return findPublicAccount(studentId);
}

function findPublicAccount(studentId) {
  const account = findAccountByStudentId.get(studentId);
  if (!account) return null;

  const { password, ...publicAccount } = account;
  return publicAccount;
}

function validateLogin(studentId, password) {
  const account = findAccountByStudentId.get(studentId);
  if (!account || account.password !== password) return null;

  const { password: _password, ...publicAccount } = account;
  return publicAccount;
}

function listAccounts() {
  return listAccountsStatement.all();
}

module.exports = {
  createAccount,
  findPublicAccount,
  listAccounts,
  validateLogin
};
